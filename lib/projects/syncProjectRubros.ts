import type { SupabaseClient } from "@supabase/supabase-js"

export type RubroTaskSaveInput = {
  id?: string
  name: string
  default_weight: number | null
}

export type RubroSaveInput = {
  id?: string
  name: string
  weight_percent: number | null
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
  rubroTrackingTypeIds: Map<string, string>
}

type IncomingIds = {
  groupIds: Set<string>
  rubroIds: Set<string>
  taskIds: Set<string>
}

type PlannedTask = {
  taskIndex: number
  draftId?: string
  taskId?: string
  taskName: string
  default_weight: number | null
}

type PlannedRubro = {
  rubroIndex: number
  draftId?: string
  rubroId?: string
  rubroName: string
  weight_percent: number | null
  tasks: PlannedTask[]
}

type PlannedGroup = {
  groupIndex: number
  draftId?: string
  groupId?: string
  groupName: string
  rubros: PlannedRubro[]
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
        tracking_type_id,
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
  const rubroTrackingTypeIds = new Map<string, string>()

  for (const group of groups ?? []) {
    groupIds.add(group.id)
    for (const rubro of (group.rubros as Array<{ id: string; tracking_type_id: string; rubro_tasks: Array<{ id: string; name: string }> }>) ?? []) {
      rubroIds.add(rubro.id)
      rubroTrackingTypeIds.set(rubro.id, rubro.tracking_type_id)
      for (const task of rubro.rubro_tasks ?? []) {
        taskIds.add(task.id)
        taskNames.set(task.id, task.name)
      }
    }
  }

  return { groupIds, rubroIds, taskIds, taskNames, rubroTrackingTypeIds }
}

function collectIncomingIds(
  groups: RubroGroupSaveInput[],
  existing: ExistingRubrosState,
): IncomingIds {
  const incoming: IncomingIds = {
    groupIds: new Set<string>(),
    rubroIds: new Set<string>(),
    taskIds: new Set<string>(),
  }

  for (const group of groups) {
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

  return incoming
}

function buildPlannedGroups(
  groups: RubroGroupSaveInput[],
  existing: ExistingRubrosState,
): PlannedGroup[] {
  const planned: PlannedGroup[] = []

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
    const group = groups[groupIndex]
    const groupName = group.name.trim()
    if (!groupName) continue

    const rubros: PlannedRubro[] = []

    for (let rubroIndex = 0; rubroIndex < group.rubros.length; rubroIndex++) {
      const rubro = group.rubros[rubroIndex]
      const tasks: PlannedTask[] = []

      for (let taskIndex = 0; taskIndex < rubro.tasks.length; taskIndex++) {
        const task = rubro.tasks[taskIndex]
        const taskName = task.name.trim()
        if (!taskName) continue

        tasks.push({
          taskIndex,
          draftId: task.id,
          taskId: isPersistedId(task.id, existing.taskIds) ? task.id : undefined,
          taskName,
          default_weight: task.default_weight ?? null,
        })
      }

      rubros.push({
        rubroIndex,
        draftId: rubro.id,
        rubroId: isPersistedId(rubro.id, existing.rubroIds) ? rubro.id : undefined,
        rubroName: rubro.name.trim() || "Nuevo rubro",
        weight_percent: rubro.weight_percent ?? null,
        tasks,
      })
    }

    planned.push({
      groupIndex,
      draftId: group.id,
      groupId: isPersistedId(group.id, existing.groupIds) ? group.id : undefined,
      groupName,
      rubros,
    })
  }

  return planned
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

async function upsertGroups(
  supabase: SupabaseClient,
  projectId: string,
  plannedGroups: PlannedGroup[],
): Promise<void> {
  const updates = plannedGroups
    .filter((group): group is PlannedGroup & { groupId: string } => !!group.groupId)
    .map((group) => ({
      id: group.groupId,
      project_id: projectId,
      name: group.groupName,
      sort_order: group.groupIndex,
    }))

  if (updates.length > 0) {
    const { error } = await supabase.from("rubro_groups").upsert(updates)
    if (error) throw error
  }

  const inserts = plannedGroups.filter((group) => !group.groupId)
  if (inserts.length === 0) return

  const { data: insertedGroups, error: insertError } = await supabase
    .from("rubro_groups")
    .insert(
      inserts.map((group) => ({
        project_id: projectId,
        name: group.groupName,
        sort_order: group.groupIndex,
      })),
    )
    .select("id")

  if (insertError || !insertedGroups) {
    throw insertError ?? new Error("Error al crear grupos de rubros")
  }

  if (insertedGroups.length !== inserts.length) {
    throw new Error("Error al crear grupos de rubros")
  }

  for (let index = 0; index < inserts.length; index++) {
    inserts[index].groupId = insertedGroups[index].id
  }
}

async function upsertRubros(
  supabase: SupabaseClient,
  projectId: string,
  plannedGroups: PlannedGroup[],
  defaultTrackingTypeId: string,
  existing: ExistingRubrosState,
): Promise<void> {
  const updates: Array<{
    id: string
    project_id: string
    group_id: string
    name: string
    sort_order: number
    weight_percent: number | null
    tracking_type_id: string
    tracking_scope: "unit"
  }> = []

  const inserts: Array<{
    plannedRubro: PlannedRubro
    groupId: string
    sort_order: number
  }> = []

  for (const group of plannedGroups) {
    if (!group.groupId) {
      throw new Error("Grupo de rubros sin ID persistido")
    }

    for (const rubro of group.rubros) {
      if (rubro.rubroId) {
        updates.push({
          id: rubro.rubroId,
          project_id: projectId,
          group_id: group.groupId,
          name: rubro.rubroName,
          sort_order: rubro.rubroIndex,
          weight_percent: rubro.weight_percent,
          tracking_type_id:
            existing.rubroTrackingTypeIds.get(rubro.rubroId) ?? defaultTrackingTypeId,
          tracking_scope: "unit",
        })
      } else {
        inserts.push({
          plannedRubro: rubro,
          groupId: group.groupId,
          sort_order: rubro.rubroIndex,
        })
      }
    }
  }

  if (updates.length > 0) {
    const { error } = await supabase.from("rubros").upsert(updates, { onConflict: "id" })
    if (error) throw error
  }

  if (inserts.length === 0) return

  const { data: insertedRubros, error: insertError } = await supabase
    .from("rubros")
    .insert(
      inserts.map(({ plannedRubro, groupId, sort_order }) => ({
        project_id: projectId,
        group_id: groupId,
        name: plannedRubro.rubroName,
        tracking_scope: "unit",
        sort_order,
        tracking_type_id: defaultTrackingTypeId,
        weight_percent: plannedRubro.weight_percent,
      })),
    )
    .select("id")

  if (insertError || !insertedRubros) {
    throw insertError ?? new Error("Error al crear rubros")
  }

  if (insertedRubros.length !== inserts.length) {
    throw new Error("Error al crear rubros")
  }

  for (let index = 0; index < inserts.length; index++) {
    inserts[index].plannedRubro.rubroId = insertedRubros[index].id
  }
}

async function upsertTasks(
  supabase: SupabaseClient,
  projectId: string,
  plannedGroups: PlannedGroup[],
): Promise<string[]> {
  const updates: Array<{
    id: string
    project_id: string
    rubro_id: string
    name: string
    weight_percent: number | null
    sort_order: number
  }> = []

  const inserts: Array<{
    plannedTask: PlannedTask
    rubroId: string
    sort_order: number
  }> = []

  for (const group of plannedGroups) {
    for (const rubro of group.rubros) {
      if (!rubro.rubroId) {
        throw new Error("Rubro sin ID persistido")
      }

      for (const task of rubro.tasks) {
        if (task.taskId) {
          updates.push({
            id: task.taskId,
            project_id: projectId,
            rubro_id: rubro.rubroId,
            name: task.taskName,
            weight_percent: task.default_weight,
            sort_order: task.taskIndex,
          })
        } else {
          inserts.push({
            plannedTask: task,
            rubroId: rubro.rubroId,
            sort_order: task.taskIndex,
          })
        }
      }
    }
  }

  if (updates.length > 0) {
    const { error } = await supabase.from("rubro_tasks").upsert(updates)
    if (error) throw error
  }

  if (inserts.length === 0) return []

  const { data: insertedTasks, error: insertError } = await supabase
    .from("rubro_tasks")
    .insert(
      inserts.map(({ plannedTask, rubroId, sort_order }) => ({
        project_id: projectId,
        rubro_id: rubroId,
        name: plannedTask.taskName,
        description: null,
        weight_percent: plannedTask.default_weight,
        sort_order,
      })),
    )
    .select("id")

  if (insertError || !insertedTasks) {
    throw insertError ?? new Error("Error al crear tareas")
  }

  if (insertedTasks.length !== inserts.length) {
    throw new Error("Error al crear tareas")
  }

  for (let index = 0; index < inserts.length; index++) {
    inserts[index].plannedTask.taskId = insertedTasks[index].id
  }

  return insertedTasks.map((task) => task.id)
}

function collectRubrosIdMaps(plannedGroups: PlannedGroup[]): {
  groupIdByDraftId: Record<string, string>
  rubroIdByDraftId: Record<string, string>
  taskIdByDraftId: Record<string, string>
} {
  const groupIdByDraftId: Record<string, string> = {}
  const rubroIdByDraftId: Record<string, string> = {}
  const taskIdByDraftId: Record<string, string> = {}

  for (const group of plannedGroups) {
    if (group.draftId && group.groupId) {
      groupIdByDraftId[group.draftId] = group.groupId
    }

    for (const rubro of group.rubros) {
      if (rubro.draftId && rubro.rubroId) {
        rubroIdByDraftId[rubro.draftId] = rubro.rubroId
      }

      for (const task of rubro.tasks) {
        if (task.draftId && task.taskId) {
          taskIdByDraftId[task.draftId] = task.taskId
        }
      }
    }
  }

  return { groupIdByDraftId, rubroIdByDraftId, taskIdByDraftId }
}

async function deleteRemovedRubros(
  supabase: SupabaseClient,
  projectId: string,
  tasksToDelete: string[],
  rubrosToDelete: string[],
  groupsToDelete: string[],
): Promise<void> {
  if (tasksToDelete.length > 0) {
    const { error } = await supabase
      .from("rubro_tasks")
      .delete()
      .eq("project_id", projectId)
      .in("id", tasksToDelete)
    if (error) throw error
  }

  if (rubrosToDelete.length > 0) {
    const { error } = await supabase
      .from("rubros")
      .delete()
      .eq("project_id", projectId)
      .in("id", rubrosToDelete)
    if (error) throw error
  }

  if (groupsToDelete.length > 0) {
    const { error } = await supabase
      .from("rubro_groups")
      .delete()
      .eq("project_id", projectId)
      .in("id", groupsToDelete)
    if (error) throw error
  }
}

export async function syncProjectRubros(
  supabase: SupabaseClient,
  projectId: string,
  groups: RubroGroupSaveInput[],
): Promise<
  | {
      ok: true
      groupIdByDraftId: Record<string, string>
      rubroIdByDraftId: Record<string, string>
      taskIdByDraftId: Record<string, string>
    }
  | { ok: false; error: string }
> {
  try {
    const [{ data: trackingTypes }, existing] = await Promise.all([
      supabase.from("task_tracking_types").select("id").eq("slug", "porcentaje").limit(1),
      loadExistingRubrosState(supabase, projectId),
    ])

    if (!trackingTypes || trackingTypes.length === 0) {
      return { ok: false, error: "No se encontró el tipo de seguimiento predeterminado." }
    }

    const defaultTrackingTypeId = trackingTypes[0].id
    const incoming = collectIncomingIds(groups, existing)
    const plannedGroups = buildPlannedGroups(groups, existing)

    const tasksToDelete = [...existing.taskIds].filter((id) => !incoming.taskIds.has(id))
    const rubrosToDelete = [...existing.rubroIds].filter((id) => !incoming.rubroIds.has(id))
    const groupsToDelete = [...existing.groupIds].filter((id) => !incoming.groupIds.has(id))

    const removalError = await assertRemovableTasks(
      supabase,
      projectId,
      tasksToDelete,
      existing.taskNames,
    )
    if (removalError) return { ok: false, error: removalError }

    await upsertGroups(supabase, projectId, plannedGroups)
    await upsertRubros(supabase, projectId, plannedGroups, defaultTrackingTypeId, existing)
    const newTaskIds = await upsertTasks(supabase, projectId, plannedGroups)

    await deleteRemovedRubros(
      supabase,
      projectId,
      tasksToDelete,
      rubrosToDelete,
      groupsToDelete,
    )

    await assignNewTasksToAllUnits(supabase, projectId, newTaskIds)

    const idMaps = collectRubrosIdMaps(plannedGroups)
    return { ok: true, ...idMaps }
  } catch (err) {
    return { ok: false, error: mapSupabaseError(err, "Error al guardar rubros") }
  }
}
