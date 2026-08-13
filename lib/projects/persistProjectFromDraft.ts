import type { SupabaseClient } from "@supabase/supabase-js"

import { requireAuthenticatedUser } from "@/lib/authHelpers"
import type {
  CreateProjectDraft,
  ProjectUserType,
} from "@/lib/projects/createProjectDraft"
import { loadProjectCatalogIds } from "@/lib/projects/projectCatalogServer"
import { unitTypeToDbFields } from "@/lib/projects/unitTypes"
import {
  getTaskInitialStatus,
  mapInitialWorkStatusToDb,
} from "@/lib/projects/initialWorkStatus"
import { validateProjectSeatAllocation } from "@/lib/company/projectSubscriptionLimits"
import { createAdminClient } from "@/utils/supabase/admin"

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  let cleaned = trimmed.replace(/\s*m2\s*$/i, "").trim()
  if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, "")
  } else {
    cleaned = cleaned.replace(",", ".")
  }

  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function parseOptionalDate(value: string): string | null {
  const trimmed = value.trim()
  return trimmed || null
}

export type PersistProjectFromDraftResult =
  | { ok: true; unitIdByDraftId: Record<string, string> }
  | { ok: false; error: string }

export async function persistProjectFromDraft(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  draft: CreateProjectDraft,
): Promise<PersistProjectFromDraftResult> {
  const catalog = await loadProjectCatalogIds(supabase)
  const adminClient = createAdminClient()

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("company_id")
    .eq("id", projectId)
    .maybeSingle()

  if (projectError || !project?.company_id) {
    return { ok: false, error: "No se encontró la obra." }
  }

  const companyId = project.company_id

  await Promise.all([
    supabase.from("unit_task_assignments").delete().eq("project_id", projectId),
    supabase.from("progress_entries").delete().eq("project_id", projectId),
    supabase.from("project_invitations").delete().eq("project_id", projectId),
    supabase.from("rubro_tasks").delete().eq("project_id", projectId),
    supabase.from("rubros").delete().eq("project_id", projectId),
    supabase.from("rubro_groups").delete().eq("project_id", projectId),
    supabase.from("project_units").delete().eq("project_id", projectId),
    supabase.from("project_floors").delete().eq("project_id", projectId),
  ])

  const { data: companyAdmins } = await adminClient
    .from("company_members")
    .select("user_id, role")
    .eq("company_id", companyId)
    .in("role", ["admin", "owner"])

  const creatorCompanyRole = companyAdmins?.find((cm) => cm.user_id === userId)?.role
  const creatorUserType: ProjectUserType =
    creatorCompanyRole === "owner" ? "Owner" : "Admin"

  const coAdmins = (companyAdmins ?? []).filter((cm) => cm.user_id !== userId)
  const plannedUserTypes: ProjectUserType[] = [
    creatorUserType,
    ...coAdmins.map((cm) => (cm.role === "owner" ? "Owner" : "Admin")),
    ...draft.teamMembers.map((member) => member.userType),
  ]

  const seatValidation = await validateProjectSeatAllocation(
    supabase,
    projectId,
    plannedUserTypes,
  )
  if (!seatValidation.ok) {
    return { ok: false, error: seatValidation.error }
  }

  const draftToDbUnitId = new Map<string, string>()
  const draftToDbTaskId = new Map<string, string>()
  const draftToDbRubroId = new Map<string, string>()
  const unitToFloorDbId = new Map<string, string>()

  if (draft.floors.length > 0) {
    const floorRows = draft.floors.map((floor, index) => ({
      project_id: projectId,
      name: floor.name.trim() || `Piso ${index + 1}`,
      identifier: floor.identifier.trim().slice(0, 4) || null,
      level: floor.level.trim() || null,
      sort_order: index,
    }))

    const { data: floors, error: floorsError } = await supabase
      .from("project_floors")
      .insert(floorRows)
      .select("id")

    if (floorsError || !floors) {
      return { ok: false, error: floorsError?.message ?? "No se pudieron guardar los pisos." }
    }

    const unitDraftIds: string[] = []
    const unitRows: {
      project_id: string
      floor_id: string
      unit_type_id: string
      unit_type: string
      code: string | null
      name: string | null
      square_meters: number | null
      room_count: number | null
      sort_order: number
      plan_url?: string | null
      render_url?: string | null
    }[] = []

    draft.floors.forEach((floor, floorIndex) => {
      const floorId = floors[floorIndex]?.id
      if (!floorId) return
      floor.units.forEach((unit, unitIndex) => {
        const { room_count, name } = unitTypeToDbFields({
          type: unit.type,
          roomCount: unit.roomCount,
          officeSize: unit.officeSize,
        })

        unitDraftIds.push(unit.id)
        unitRows.push({
          project_id: projectId,
          floor_id: floorId,
          unit_type_id: catalog.unitTypeIds[unit.type],
          unit_type: unit.type,
          code: unit.code.trim().slice(0, 4) || null,
          name,
          square_meters: parseOptionalNumber(unit.squareMeters),
          room_count,
          sort_order: unitIndex,
          plan_url: unit.planRemoved ? null : unit.planUrl,
          render_url: unit.renderRemoved ? null : unit.renderUrl,
        })
      })
    })

    if (unitRows.length > 0) {
      const { data: insertedUnits, error: unitsError } = await supabase
        .from("project_units")
        .insert(unitRows)
        .select("id")
      if (unitsError) {
        return { ok: false, error: unitsError.message }
      }
      unitDraftIds.forEach((draftId, i) => {
        const dbId = insertedUnits?.[i]?.id
        if (dbId) draftToDbUnitId.set(draftId, dbId)
      })

      draft.floors.forEach((floor, floorIndex) => {
        const floorDbId = floors[floorIndex]?.id
        if (!floorDbId) return
        floor.units.forEach((unit) => {
          unitToFloorDbId.set(unit.id, floorDbId)
        })
      })
    }
  }

  let groupSort = 0
  for (const group of draft.groups) {
    const groupName = group.name.trim()
    if (!groupName) continue

    const { data: insertedGroup, error: groupError } = await supabase
      .from("rubro_groups")
      .insert({
        project_id: projectId,
        name: groupName,
        sort_order: groupSort++,
      })
      .select("id")
      .single()

    if (groupError || !insertedGroup) {
      return { ok: false, error: groupError?.message ?? "No se pudo guardar un grupo de rubros." }
    }

    let rubroSort = 0
    for (const rubro of group.rubros) {
      const rubroName = rubro.name.trim()
      if (!rubroName) continue

      const { data: insertedRubro, error: rubroError } = await supabase
        .from("rubros")
        .insert({
          project_id: projectId,
          group_id: insertedGroup.id,
          name: rubroName,
          tracking_type_id: catalog.trackingTypeIds[rubro.trackingType],
          sort_order: rubroSort++,
          weight_percent: parseOptionalNumber(rubro.weightPercent),
        })
        .select("id")
        .single()

      if (rubroError || !insertedRubro) {
        return { ok: false, error: rubroError?.message ?? "No se pudo guardar un rubro." }
      }

      draftToDbRubroId.set(rubro.id, insertedRubro.id)

      const validTasks = rubro.tasks
        .map((task, taskIndex) => {
          const taskName = task.name.trim()
          if (!taskName) return null
          return {
            draftId: task.id,
            row: {
              project_id: projectId,
              rubro_id: insertedRubro.id,
              name: taskName,
              weight_percent: parseOptionalNumber(task.weightPercent),
              sort_order: taskIndex,
            },
          }
        })
        .filter((t): t is NonNullable<typeof t> => t !== null)

      if (validTasks.length > 0) {
        const { data: insertedTasks, error: tasksError } = await supabase
          .from("rubro_tasks")
          .insert(validTasks.map((t) => t.row))
          .select("id")
        if (tasksError) {
          return { ok: false, error: tasksError.message }
        }
        validTasks.forEach((t, i) => {
          const dbId = insertedTasks?.[i]?.id
          if (dbId) draftToDbTaskId.set(t.draftId, dbId)
        })
      }
    }
  }

  if (draftToDbUnitId.size > 0 && draftToDbTaskId.size > 0) {
    const assignmentRows: {
      project_id: string
      unit_id: string
      rubro_task_id: string
    }[] = []

    for (const [draftUnitId, dbUnitId] of draftToDbUnitId) {
      const excludedTaskIds = new Set(draft.unitTaskExclusions[draftUnitId] ?? [])
      for (const [draftTaskId, dbTaskId] of draftToDbTaskId) {
        if (!excludedTaskIds.has(draftTaskId)) {
          assignmentRows.push({
            project_id: projectId,
            unit_id: dbUnitId,
            rubro_task_id: dbTaskId,
          })
        }
      }
    }

    if (assignmentRows.length > 0) {
      const { error: assignmentsError } = await supabase
        .from("unit_task_assignments")
        .insert(assignmentRows)
      if (assignmentsError) {
        return { ok: false, error: assignmentsError.message }
      }
    }
  }

  if (draft.workStage === "in_execution" && draftToDbUnitId.size > 0) {
    const now = new Date().toISOString()
    const progressRows: {
      project_id: string
      floor_id: string | null
      unit_id: string
      category_id: string
      task_id: string
      created_by: string
      status: "submitted" | "rejected" | "draft"
      progress_state: "pending" | "in_progress" | "completed"
      submitted_at: string | null
    }[] = []

    for (const [draftUnitId, dbUnitId] of draftToDbUnitId) {
      const excludedTaskIds = new Set(draft.unitTaskExclusions[draftUnitId] ?? [])
      const floorDbId = unitToFloorDbId.get(draftUnitId) ?? null

      for (const group of draft.groups) {
        for (const rubro of group.rubros) {
          const dbRubroId = draftToDbRubroId.get(rubro.id)
          if (!dbRubroId) continue

          for (const task of rubro.tasks) {
            if (!task.name.trim()) continue
            if (excludedTaskIds.has(task.id)) continue

            const initialStatus = getTaskInitialStatus(task.id, draft.taskInitialStatuses)
            if (initialStatus === "pending") continue

            const dbTaskId = draftToDbTaskId.get(task.id)
            if (!dbTaskId) continue

            const mapped = mapInitialWorkStatusToDb(initialStatus)
            progressRows.push({
              project_id: projectId,
              floor_id: floorDbId,
              unit_id: dbUnitId,
              category_id: dbRubroId,
              task_id: dbTaskId,
              created_by: userId,
              status: mapped.status,
              progress_state: mapped.progress_state,
              submitted_at: mapped.status === "draft" ? null : now,
            })
          }
        }
      }
    }

    if (progressRows.length > 0) {
      const { error: progressError } = await supabase
        .from("progress_entries")
        .insert(progressRows)
      if (progressError) {
        return { ok: false, error: progressError.message }
      }
    }
  }

  if (draft.teamMembers.length > 0) {
    const invitationRows = draft.teamMembers.map((member) => ({
      project_id: projectId,
      email: member.email.trim().toLowerCase(),
      first_name: member.firstName.trim(),
      last_name: member.lastName.trim(),
      user_type_id: catalog.userTypeIds[member.userType],
      role_id: catalog.roleIds[member.role],
      status: "pending" as const,
      invited_by: userId,
    }))

    const { error: invitationsError } = await supabase
      .from("project_invitations")
      .insert(invitationRows)

    if (invitationsError) {
      return { ok: false, error: invitationsError.message }
    }
  }

  return {
    ok: true,
    unitIdByDraftId: Object.fromEntries(draftToDbUnitId),
  }
}

export async function resolveProjectCompanyId(
  supabase: SupabaseClient,
  userId: string,
  draft: CreateProjectDraft,
): Promise<{ ok: true; companyId: string } | { ok: false; error: string }> {
  if (draft.companyId) {
    return { ok: true, companyId: draft.companyId }
  }

  const companyName = draft.companyName.trim() || `Mi Empresa - ${userId.slice(0, 8)}`
  const { data: newCompany, error: companyError } = await supabase
    .from("companies")
    .insert({ name: companyName })
    .select("id")
    .single()

  if (companyError || !newCompany) {
    return { ok: false, error: companyError?.message ?? "No se pudo crear la empresa." }
  }

  const { error: memberError } = await supabase.from("company_members").insert({
    company_id: newCompany.id,
    user_id: userId,
    role: "owner",
    status: "active",
  })

  if (memberError) {
    return { ok: false, error: memberError.message }
  }

  return { ok: true, companyId: newCompany.id }
}

export async function ensureProjectCreatorMembership(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  companyId: string,
) {
  const catalog = await loadProjectCatalogIds(supabase)
  const adminClient = createAdminClient()

  const { data: existingMembership } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle()

  if (!existingMembership) {
    const { data: companyAdmins } = await adminClient
      .from("company_members")
      .select("user_id, role")
      .eq("company_id", companyId)
      .in("role", ["admin", "owner"])

    const creatorCompanyRole = companyAdmins?.find((cm) => cm.user_id === userId)?.role
    const creatorUserTypeId =
      creatorCompanyRole === "owner"
        ? catalog.userTypeIds.Owner
        : catalog.userTypeIds.Admin

    const { error: memberError } = await supabase.from("project_members").insert({
      project_id: projectId,
      user_id: userId,
      role_id: catalog.roleIds.Administrador,
      user_type_id: creatorUserTypeId,
      is_active: true,
    })

    if (memberError) {
      return { ok: false as const, error: memberError.message }
    }

    const coAdmins = (companyAdmins ?? []).filter((cm) => cm.user_id !== userId)
    if (coAdmins.length > 0) {
      const { error: coAdminError } = await adminClient
        .from("project_members")
        .insert(
          coAdmins.map((cm) => ({
            project_id: projectId,
            user_id: cm.user_id,
            role_id: catalog.roleIds.Administrador,
            user_type_id:
              cm.role === "owner"
                ? catalog.userTypeIds.Owner
                : catalog.userTypeIds.Admin,
            is_active: true,
          })),
        )
      if (coAdminError) {
        return { ok: false as const, error: coAdminError.message }
      }
    }
  }

  return { ok: true as const }
}

export function getProjectDisplayName(draft: CreateProjectDraft): string {
  return draft.projectName.trim() || "Obra sin título"
}

export function getProjectFieldUpdates(draft: CreateProjectDraft) {
  return {
    name: getProjectDisplayName(draft),
    location: draft.location.trim() || null,
    total_surface_m2: parseOptionalNumber(draft.totalSurface),
    start_date: parseOptionalDate(draft.startDate),
    end_date: parseOptionalDate(draft.endDate),
    building_type: draft.workStage,
  }
}

export async function assertDraftProjectAccess(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, status, company_id, created_by")
    .eq("id", projectId)
    .maybeSingle()

  if (error || !project) {
    return { ok: false as const, error: "No se encontró la obra." }
  }

  if (project.status !== "draft") {
    return { ok: false as const, error: "Esta obra ya fue creada." }
  }

  if (project.created_by === userId) {
    return { ok: true as const, project }
  }

  const { data: membership } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle()

  if (membership) {
    return { ok: true as const, project }
  }

  return { ok: false as const, error: "No tenés permiso para editar este borrador." }
}

export async function requireAuthenticatedUserId() {
  const user = await requireAuthenticatedUser()
  return user.id
}
