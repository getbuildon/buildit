import type { SupabaseClient } from "@supabase/supabase-js"

export type RubroTaskSaveInput = {
  id?: string
  name: string
  default_weight: number | null
}

export type RubroSaveInput = {
  id?: string
  name: string
  tasks: RubroTaskSaveInput[]
}

export type RubroGroupSaveInput = {
  id?: string
  name: string
  rubros: RubroSaveInput[]
}

type ExistingRubrosState = {
  groupIds: Set<string>
  rubroIds: Set<string>
  taskIds: Set<string>
  taskNames: Map<string, string>
}

type IncomingIds = {
  groupIds: Set<string>
  rubroIds: Set<string>
  taskIds: Set<string>
}

function isPersistedId(id: string | undefined, knownIds: Set<string>): id is string {
  return !!id && knownIds.has(id)
}

function mapSupabaseError(err: unknown, fallback: string): string {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: string }).code)
      : null

  if (code === "23503") {
    return "No se puede eliminar una tarea que ya tiene avances registrados."
  }

  if (err instanceof Error && err.message) return err.message
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message?: string }).message)
  }

  return fallback
}

async function loadExistingRubrosState(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ExistingRubrosState> {
  const { data: groups, error } = await supabase
    .from("rubro_groups")
    .select(
      `
      id,
      rubros (
        id,
        rubro_tasks (id, name)
      )
    `,
    )
    .eq("project_id", projectId)

  if (error) throw error

  const groupIds = new Set<string>()
  const rubroIds = new Set<string>()
  const taskIds = new Set<string>()
  const taskNames = new Map<string, string>()

  for (const group of groups ?? []) {
    groupIds.add(group.id)
    for (const rubro of (group.rubros as Array<{ id: string; rubro_tasks: Array<{ id: string; name: string }> }>) ?? []) {
      rubroIds.add(rubro.id)
      for (const task of rubro.rubro_tasks ?? []) {
        taskIds.add(task.id)
        taskNames.set(task.id, task.name)
      }
    }
  }

  return { groupIds, rubroIds, taskIds, taskNames }
}

function collectIncomingIds(
  groups: RubroGroupSaveInput[],
  existing: ExistingRubrosState,
): { incoming: IncomingIds; emptyGroupIdsToDelete: string[] } {
  const incoming: IncomingIds = {
    groupIds: new Set<string>(),
    rubroIds: new Set<string>(),
    taskIds: new Set<string>(),
  }
  const emptyGroupIdsToDelete: string[] = []

  for (const group of groups) {
    if (group.rubros.length === 0) {
      if (isPersistedId(group.id, existing.groupIds)) {
        emptyGroupIdsToDelete.push(group.id)
      }
      continue
    }

    if (isPersistedId(group.id, existing.groupIds)) {
      incoming.groupIds.add(group.id)
    }

    for (const rubro of group.rubros) {
      if (isPersistedId(rubro.id, existing.rubroIds)) {
        incoming.rubroIds.add(rubro.id)
      }

      for (const task of rubro.tasks) {
        if (isPersistedId(task.id, existing.taskIds)) {
          incoming.taskIds.add(task.id)
        }
      }
    }
  }

  return { incoming, emptyGroupIdsToDelete }
}

async function assertRemovableTasks(
  supabase: SupabaseClient,
  projectId: string,
  taskIdsToRemove: string[],
  taskNames: Map<string, string>,
): Promise<string | null> {
  if (taskIdsToRemove.length === 0) return null

  const { data: blocked, error } = await supabase
    .from("progress_entries")
    .select("task_id")
    .eq("project_id", projectId)
    .in("task_id", taskIdsToRemove)

  if (error) throw error
  if (!blocked || blocked.length === 0) return null

  const blockedNames = [
    ...new Set(
      blocked
        .map((row) => taskNames.get(row.task_id) ?? "Tarea con avances")
        .filter(Boolean),
    ),
  ]

  if (blockedNames.length === 1) {
    return `No se puede eliminar "${blockedNames[0]}" porque ya tiene avances registrados.`
  }

  return `No se pueden eliminar estas tareas porque ya tienen avances registrados: ${blockedNames.join(", ")}.`
}

async function assignNewTasksToAllUnits(
  supabase: SupabaseClient,
  projectId: string,
  newTaskIds: string[],
): Promise<void> {
  if (newTaskIds.length === 0) return

  const { data: units, error: unitsError } = await supabase
    .from("project_units")
    .select("id")
    .eq("project_id", projectId)

  if (unitsError) throw unitsError
  if (!units || units.length === 0) return

  const assignmentRows = units.flatMap((unit) =>
    newTaskIds.map((taskId) => ({
      project_id: projectId,
      unit_id: unit.id,
      rubro_task_id: taskId,
    })),
  )

  const { error: assignError } = await supabase.from("unit_task_assignments").insert(assignmentRows)
  if (assignError) throw assignError
}

export async function syncProjectRubros(
  supabase: SupabaseClient,
  projectId: string,
  groups: RubroGroupSaveInput[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const [{ data: trackingTypes }, existing] = await Promise.all([
      supabase.from("task_tracking_types").select("id").eq("slug", "porcentaje").limit(1),
      loadExistingRubrosState(supabase, projectId),
    ])

    if (!trackingTypes || trackingTypes.length === 0) {
      return { ok: false, error: "No se encontró el tipo de seguimiento predeterminado." }
    }

    const defaultTrackingTypeId = trackingTypes[0].id
    const { incoming, emptyGroupIdsToDelete } = collectIncomingIds(groups, existing)

    const tasksToDelete = [...existing.taskIds].filter((id) => !incoming.taskIds.has(id))
    const rubrosToDelete = [...existing.rubroIds].filter((id) => !incoming.rubroIds.has(id))
    const groupsToDelete = [
      ...[...existing.groupIds].filter((id) => !incoming.groupIds.has(id)),
      ...emptyGroupIdsToDelete,
    ]

    const removalError = await assertRemovableTasks(
      supabase,
      projectId,
      tasksToDelete,
      existing.taskNames,
    )
    if (removalError) return { ok: false, error: removalError }

    const newTaskIds: string[] = []

    for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
      const group = groups[groupIndex]
      if (group.rubros.length === 0) continue

      let groupId: string
      if (isPersistedId(group.id, existing.groupIds)) {
        groupId = group.id
        const { error: groupUpdateError } = await supabase
          .from("rubro_groups")
          .update({ name: group.name, sort_order: groupIndex })
          .eq("id", groupId)
          .eq("project_id", projectId)
        if (groupUpdateError) throw groupUpdateError
      } else {
        const { data: insertedGroup, error: groupInsertError } = await supabase
          .from("rubro_groups")
          .insert({ project_id: projectId, name: group.name, sort_order: groupIndex })
          .select("id")
          .single()
        if (groupInsertError || !insertedGroup) {
          throw groupInsertError ?? new Error("Error al crear grupo de rubros")
        }
        groupId = insertedGroup.id
      }

      for (let rubroIndex = 0; rubroIndex < group.rubros.length; rubroIndex++) {
        const rubro = group.rubros[rubroIndex]
        let rubroId: string

        if (isPersistedId(rubro.id, existing.rubroIds)) {
          rubroId = rubro.id
          const { error: rubroUpdateError } = await supabase
            .from("rubros")
            .update({
              name: rubro.name,
              sort_order: rubroIndex,
              group_id: groupId,
            })
            .eq("id", rubroId)
            .eq("project_id", projectId)
          if (rubroUpdateError) throw rubroUpdateError
        } else {
          const { data: insertedRubro, error: rubroInsertError } = await supabase
            .from("rubros")
            .insert({
              project_id: projectId,
              group_id: groupId,
              name: rubro.name,
              tracking_scope: "unit",
              sort_order: rubroIndex,
              tracking_type_id: defaultTrackingTypeId,
            })
            .select("id")
            .single()
          if (rubroInsertError || !insertedRubro) {
            throw rubroInsertError ?? new Error("Error al crear rubro")
          }
          rubroId = insertedRubro.id
        }

        for (let taskIndex = 0; taskIndex < rubro.tasks.length; taskIndex++) {
          const task = rubro.tasks[taskIndex]

          if (isPersistedId(task.id, existing.taskIds)) {
            const { error: taskUpdateError } = await supabase
              .from("rubro_tasks")
              .update({
                name: task.name,
                weight_percent: task.default_weight ?? null,
                sort_order: taskIndex,
                rubro_id: rubroId,
              })
              .eq("id", task.id)
              .eq("project_id", projectId)
            if (taskUpdateError) throw taskUpdateError
          } else {
            const { data: insertedTask, error: taskInsertError } = await supabase
              .from("rubro_tasks")
              .insert({
                project_id: projectId,
                rubro_id: rubroId,
                name: task.name,
                description: null,
                weight_percent: task.default_weight ?? null,
                sort_order: taskIndex,
              })
              .select("id")
              .single()
            if (taskInsertError || !insertedTask) {
              throw taskInsertError ?? new Error("Error al crear tarea")
            }
            newTaskIds.push(insertedTask.id)
          }
        }
      }
    }

    if (tasksToDelete.length > 0) {
      const { error: deleteTasksError } = await supabase
        .from("rubro_tasks")
        .delete()
        .eq("project_id", projectId)
        .in("id", tasksToDelete)
      if (deleteTasksError) throw deleteTasksError
    }

    if (rubrosToDelete.length > 0) {
      const { error: deleteRubrosError } = await supabase
        .from("rubros")
        .delete()
        .eq("project_id", projectId)
        .in("id", rubrosToDelete)
      if (deleteRubrosError) throw deleteRubrosError
    }

    if (groupsToDelete.length > 0) {
      const { error: deleteGroupsError } = await supabase
        .from("rubro_groups")
        .delete()
        .eq("project_id", projectId)
        .in("id", groupsToDelete)
      if (deleteGroupsError) throw deleteGroupsError
    }

    await assignNewTasksToAllUnits(supabase, projectId, newTaskIds)

    return { ok: true }
  } catch (err) {
    return { ok: false, error: mapSupabaseError(err, "Error al guardar rubros") }
  }
}
