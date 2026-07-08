"use server"

import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { requireAuthenticatedUser } from "@/lib/authHelpers"
import type {
  AvailableTeamMember,
  CreateProjectDraft,
  ProjectTeamRole,
  ProjectUserType,
} from "@/lib/projects/createProjectDraft"
import { loadProjectCatalogIds } from "@/lib/projects/projectCatalogServer"
import { PROJECT_ROLE_SLUG, USER_TYPE_SLUG } from "@/lib/projects/catalogSlugs"

export type CreateProjectResult =
  | { ok: true; projectId: string }
  | { ok: false; error: string }

export async function getCompanyProjectMembers(
  companyId: string,
): Promise<AvailableTeamMember[]> {
  const user = await requireAuthenticatedUser()
  const admin = createAdminClient()

  const { data: projects, error: projectsError } = await admin
    .from("projects")
    .select("id")
    .eq("company_id", companyId)

  if (projectsError || !projects?.length) return []

  const projectIds = projects.map((p) => p.id)

  const { data: members, error: membersError } = await admin
    .from("project_members")
    .select("user_id, role_id, user_type_id, joined_at")
    .in("project_id", projectIds)
    .eq("is_active", true)
    .neq("user_id", user.id)

  if (membersError || !members?.length) return []

  const userIds = [...new Set(members.map((m) => m.user_id))]

  const [profilesResult, rolesResult, userTypesResult] = await Promise.all([
    admin.from("profiles").select("id, first_name, last_name, email").in("id", userIds),
    admin.from("project_roles").select("id, slug, label"),
    admin.from("user_types").select("id, slug"),
  ])

  const profileById = new Map((profilesResult.data ?? []).map((p) => [p.id, p]))
  const roleById = new Map((rolesResult.data ?? []).map((r) => [r.id, r]))
  const userTypeById = new Map((userTypesResult.data ?? []).map((t) => [t.id, t]))

  const roleBySlug = new Map<string, ProjectTeamRole>(
    Object.entries(PROJECT_ROLE_SLUG).map(([label, slug]) => [slug, label as ProjectTeamRole]),
  )
  const userTypeBySlug = new Map<string, ProjectUserType>(
    Object.entries(USER_TYPE_SLUG).map(([label, slug]) => [slug, label as ProjectUserType]),
  )

  const sorted = [...members].sort(
    (a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime(),
  )

  const seen = new Set<string>()
  const result: AvailableTeamMember[] = []

  for (const member of sorted) {
    if (seen.has(member.user_id)) continue
    seen.add(member.user_id)

    const profile = profileById.get(member.user_id)
    if (!profile) continue

    const roleRow = roleById.get(member.role_id)
    const userTypeRow = userTypeById.get(member.user_type_id)

    const role: ProjectTeamRole = roleBySlug.get(roleRow?.slug ?? "") ?? "Residente"
    const userType: ProjectUserType = userTypeBySlug.get(userTypeRow?.slug ?? "") ?? "Operador"

    result.push({
      id: member.user_id,
      firstName: profile.first_name || "",
      lastName: profile.last_name || "",
      email: profile.email,
      roleTitle: roleRow?.label ?? role,
      userType,
      role,
    })
  }

  return result
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : null
}

function parseOptionalDate(value: string): string | null {
  const trimmed = value.trim()
  return trimmed || null
}

export async function createProjectFromDraft(
  draft: CreateProjectDraft,
): Promise<CreateProjectResult> {
  const name = draft.projectName.trim()
  if (!name) {
    return { ok: false, error: "El nombre del proyecto es obligatorio." }
  }

  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

  let projectId: string | null = null

  try {
    const catalog = await loadProjectCatalogIds(supabase)

    let companyId: string

    if (draft.companyId) {
      // Usar empresa existente seleccionada
      companyId = draft.companyId
    } else {
      // Crear nueva empresa con el nombre ingresado
      const companyName = draft.companyName.trim() || `Mi Empresa - ${user.id.slice(0, 8)}`
      const { data: newCompany, error: companyError } = await supabase
        .from("companies")
        .insert({ name: companyName })
        .select("id")
        .single()

      if (companyError || !newCompany) {
        return { ok: false, error: companyError?.message ?? "No se pudo crear la empresa." }
      }

      companyId = newCompany.id

      const { error: memberError } = await supabase.from("company_members").insert({
        company_id: companyId,
        user_id: user.id,
        role: "owner",
        status: "active",
      })

      if (memberError) throw memberError
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        name,
        location: draft.location.trim() || null,
        start_date: parseOptionalDate(draft.startDate),
        end_date: parseOptionalDate(draft.endDate),
        status: "active",
        company_id: companyId,
        created_by: user.id,
      })
      .select("id")
      .single()

    if (projectError || !project) {
      return {
        ok: false,
        error: projectError?.message ?? "No se pudo crear la obra.",
      }
    }

    projectId = project.id

    // Obtener roles de empresa para determinar user_type de cada admin/owner
    const adminClient = createAdminClient()
    const { data: companyAdmins } = await adminClient
      .from("company_members")
      .select("user_id, role")
      .eq("company_id", companyId)
      .in("role", ["admin", "owner"])

    const creatorCompanyRole = companyAdmins?.find((cm) => cm.user_id === user.id)?.role
    const creatorUserTypeId =
      creatorCompanyRole === "owner"
        ? catalog.userTypeIds.Owner
        : catalog.userTypeIds.Admin

    const { error: memberError } = await supabase.from("project_members").insert({
      project_id: projectId,
      user_id: user.id,
      role_id: catalog.roleIds.Administrador,
      user_type_id: creatorUserTypeId,
      is_active: true,
    })

    if (memberError) throw memberError

    // Agregar automáticamente a los demás admins/owners de la empresa
    const coAdmins = (companyAdmins ?? []).filter((cm) => cm.user_id !== user.id)
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
      if (coAdminError) throw coAdminError
    }

    // Mapeos draft ID → DB ID para construir las asignaciones al final
    const draftToDbUnitId = new Map<string, string>()
    const draftToDbTaskId = new Map<string, string>()

    if (draft.floors.length > 0) {
      const floorRows = draft.floors.map((floor, index) => ({
        project_id: projectId,
        name: floor.name.trim() || `Piso ${index + 1}`,
        level: floor.level.trim() || null,
        sort_order: index,
      }))

      const { data: floors, error: floorsError } = await supabase
        .from("project_floors")
        .insert(floorRows)
        .select("id")

      if (floorsError || !floors) {
        throw floorsError ?? new Error("No se pudieron guardar los pisos.")
      }

      const unitDraftIds: string[] = []
      const unitRows: {
        project_id: string
        floor_id: string
        unit_type_id: string
        square_meters: number | null
        room_count: number | null
        sort_order: number
      }[] = []

      draft.floors.forEach((floor, floorIndex) => {
        const floorId = floors[floorIndex]?.id
        if (!floorId) return
        floor.units.forEach((unit, unitIndex) => {
          unitDraftIds.push(unit.id)
          unitRows.push({
            project_id: projectId!,
            floor_id: floorId,
            unit_type_id: catalog.unitTypeIds[unit.type],
            square_meters: parseOptionalNumber(unit.squareMeters),
            room_count: (() => {
              const count = parseOptionalNumber(unit.roomCount)
              return count === null ? null : Math.round(count)
            })(),
            sort_order: unitIndex,
          })
        })
      })

      if (unitRows.length > 0) {
        const { data: insertedUnits, error: unitsError } = await supabase
          .from("project_units")
          .insert(unitRows)
          .select("id")
        if (unitsError) throw unitsError
        unitDraftIds.forEach((draftId, i) => {
          const dbId = insertedUnits?.[i]?.id
          if (dbId) draftToDbUnitId.set(draftId, dbId)
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
        throw groupError ?? new Error("No se pudo guardar un grupo de rubros.")
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
          })
          .select("id")
          .single()

        if (rubroError || !insertedRubro) {
          throw rubroError ?? new Error("No se pudo guardar un rubro.")
        }

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
          if (tasksError) throw tasksError
          validTasks.forEach((t, i) => {
            const dbId = insertedTasks?.[i]?.id
            if (dbId) draftToDbTaskId.set(t.draftId, dbId)
          })
        }
      }
    }

    // Crear asignaciones de tareas por unidad
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
              project_id: projectId!,
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
        if (assignmentsError) throw assignmentsError
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
        invited_by: user.id,
      }))

      const { error: invitationsError } = await supabase
        .from("project_invitations")
        .insert(invitationRows)

      if (invitationsError) throw invitationsError
    }

    return { ok: true, projectId: projectId! }
  } catch (cause) {
    if (projectId) {
      await supabase.from("projects").delete().eq("id", projectId)
    }

    const message =
      cause instanceof Error
        ? cause.message
        : "No se pudo crear la obra. Intentá de nuevo."

    return { ok: false, error: message }
  }
}
