"use server"

import { createClient } from "@/utils/supabase/server"
import { requireAuthenticatedUser } from "@/lib/authHelpers"
import type { CreateProjectDraft } from "@/lib/projects/createProjectDraft"
import { loadProjectCatalogIds } from "@/lib/projects/projectCatalogServer"

export type CreateProjectResult =
  | { ok: true; projectId: string }
  | { ok: false; error: string }

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

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        name,
        location: draft.location.trim() || null,
        start_date: parseOptionalDate(draft.startDate),
        end_date: parseOptionalDate(draft.endDate),
        status: "active",
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

    const { error: memberError } = await supabase.from("project_members").insert({
      project_id: projectId,
      user_id: user.id,
      role_id: catalog.roleIds.Administrador,
      is_active: true,
    })

    if (memberError) {
      throw memberError
    }

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
        const { error: unitsError } = await supabase
          .from("project_units")
          .insert(unitRows)
        if (unitsError) throw unitsError
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

        const taskRows = rubro.tasks
          .map((task, taskIndex) => {
            const taskName = task.name.trim()
            if (!taskName) return null
            return {
              project_id: projectId,
              rubro_id: insertedRubro.id,
              name: taskName,
              weight_percent: parseOptionalNumber(task.weightPercent),
              sort_order: taskIndex,
            }
          })
          .filter((row): row is NonNullable<typeof row> => row !== null)

        if (taskRows.length > 0) {
          const { error: tasksError } = await supabase
            .from("rubro_tasks")
            .insert(taskRows)
          if (tasksError) throw tasksError
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
