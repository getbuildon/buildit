export type ProgressEntryRow = {
  unit_id: string | null
  task_id: string
  progress_state: string
  status: string
  created_at?: string | null
  submitted_at?: string | null
}

function getEntryTimestamp(entry: ProgressEntryRow): number {
  const value = entry.submitted_at ?? entry.created_at
  return value ? new Date(value).getTime() : 0
}

export function filterProgressEntriesBefore(
  entries: ProgressEntryRow[],
  beforeDate: Date,
): ProgressEntryRow[] {
  const cutoff = beforeDate.getTime()
  return entries.filter((entry) => {
    const timestamp = getEntryTimestamp(entry)
    return timestamp > 0 && timestamp <= cutoff
  })
}

/** El avance de obra solo impacta cuando la tarea fue certificada. */
export function isProgressEntryCertified(entry: ProgressEntryRow): boolean {
  return entry.status === "approved"
}

function buildLatestEntriesByTaskForUnit(
  entries: ProgressEntryRow[],
  unitId: string,
  assignedTaskIds: string[],
): Map<string, ProgressEntryRow> {
  const assigned = new Set(assignedTaskIds)
  const latestByTask = new Map<string, ProgressEntryRow>()

  for (const entry of entries) {
    if (entry.unit_id !== unitId || !entry.task_id) continue
    if (!assigned.has(entry.task_id)) continue

    const previous = latestByTask.get(entry.task_id)
    if (!previous || getEntryTimestamp(entry) > getEntryTimestamp(previous)) {
      latestByTask.set(entry.task_id, entry)
    }
  }

  return latestByTask
}

function buildLatestEntriesByUnitTask(
  entries: ProgressEntryRow[],
  unitIds: string[],
  byUnit: Record<string, string[]>,
  allTaskIds: string[],
): Map<string, ProgressEntryRow> {
  const unitIdSet = new Set(unitIds)
  const latestByUnitTask = new Map<string, ProgressEntryRow>()

  for (const entry of entries) {
    if (!entry.unit_id || !entry.task_id) continue
    if (!unitIdSet.has(entry.unit_id)) continue
    if (
      !getAssignedTaskIdsForUnit(byUnit, entry.unit_id, allTaskIds).includes(entry.task_id)
    ) {
      continue
    }

    const key = `${entry.unit_id}:${entry.task_id}`
    const previous = latestByUnitTask.get(key)
    if (!previous || getEntryTimestamp(entry) > getEntryTimestamp(previous)) {
      latestByUnitTask.set(key, entry)
    }
  }

  return latestByUnitTask
}

export function getAssignedTaskIdsForUnit(
  byUnit: Record<string, string[]>,
  unitId: string,
  allTaskIds: string[],
): string[] {
  const hasAnyAssignment = Object.keys(byUnit).length > 0
  if (!hasAnyAssignment) return allTaskIds
  return byUnit[unitId] ?? []
}

export type RubroProgressContext = {
  taskToRubro: Map<string, string>
  rubroWeights: Map<string, number>
}

/** Agrupa tareas asignadas por rubro. */
function groupAssignedTasksByRubro(
  assignedTaskIds: string[],
  taskToRubro: Map<string, string>,
): Map<string, string[]> {
  const tasksByRubro = new Map<string, string[]>()

  for (const taskId of assignedTaskIds) {
    const rubroId = taskToRubro.get(taskId)
    if (!rubroId) continue
    const list = tasksByRubro.get(rubroId) ?? []
    list.push(taskId)
    tasksByRubro.set(rubroId, list)
  }

  return tasksByRubro
}

/**
 * Calcula el progreso de una unidad según la incidencia de cada rubro.
 * Solo las tareas certificadas (status approved) suman al avance del rubro.
 */
export function calculateUnitProgressPercent(
  unitId: string,
  assignedTaskIds: string[],
  entries: ProgressEntryRow[],
  rubroProgress: RubroProgressContext,
): number {
  if (assignedTaskIds.length === 0) return 0

  const latestByTask = buildLatestEntriesByTaskForUnit(entries, unitId, assignedTaskIds)
  const tasksByRubro = groupAssignedTasksByRubro(
    assignedTaskIds,
    rubroProgress.taskToRubro,
  )

  let totalProgress = 0

  for (const [rubroId, taskIds] of tasksByRubro) {
    const rubroWeight = rubroProgress.rubroWeights.get(rubroId) ?? 0
    if (rubroWeight <= 0 || taskIds.length === 0) continue

    let certifiedCount = 0
    for (const taskId of taskIds) {
      const entry = latestByTask.get(taskId)
      if (entry && isProgressEntryCertified(entry)) {
        certifiedCount += 1
      }
    }

    totalProgress += rubroWeight * (certifiedCount / taskIds.length)
  }

  return Math.round(totalProgress)
}

function calculateAverageProgress(values: number[]): number {
  if (values.length === 0) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

export function calculateUnitProgressValue(
  unitId: string,
  allTaskIds: string[],
  byUnit: Record<string, string[]>,
  entries: ProgressEntryRow[],
  rubroProgress: RubroProgressContext,
): number {
  const assignedTaskIds = getAssignedTaskIdsForUnit(byUnit, unitId, allTaskIds)
  return calculateUnitProgressPercent(unitId, assignedTaskIds, entries, rubroProgress)
}

/** Progreso del piso: promedio igualitario de sus unidades (rubros certificados por unidad). */
export function calculateFloorProgressPercent(
  unitIds: string[],
  allTaskIds: string[],
  byUnit: Record<string, string[]>,
  entries: ProgressEntryRow[],
  rubroProgress: RubroProgressContext,
): number {
  if (unitIds.length === 0) return 0

  const unitProgressValues = unitIds.map((unitId) =>
    calculateUnitProgressValue(unitId, allTaskIds, byUnit, entries, rubroProgress),
  )

  return calculateAverageProgress(unitProgressValues)
}

/** Progreso de obra: promedio igualitario de los pisos. */
export function calculateProjectProgressPercent(
  floorUnitIds: string[][],
  allTaskIds: string[],
  byUnit: Record<string, string[]>,
  entries: ProgressEntryRow[],
  rubroProgress: RubroProgressContext,
): number {
  if (floorUnitIds.length === 0) return 0

  const floorProgressValues = floorUnitIds.map((unitIds) =>
    calculateFloorProgressPercent(unitIds, allTaskIds, byUnit, entries, rubroProgress),
  )

  return calculateAverageProgress(floorProgressValues)
}

export function countAssignedCompletedTasks(
  byUnit: Record<string, string[]>,
  allTaskIds: string[],
  unitIds: string[],
  entries: ProgressEntryRow[],
): number {
  const latestByUnitTask = buildLatestEntriesByUnitTask(entries, unitIds, byUnit, allTaskIds)
  let certifiedCount = 0

  for (const entry of latestByUnitTask.values()) {
    if (isProgressEntryCertified(entry)) {
      certifiedCount += 1
    }
  }

  return certifiedCount
}

export function countAssignedBlockedTasks(
  byUnit: Record<string, string[]>,
  allTaskIds: string[],
  unitIds: string[],
  entries: ProgressEntryRow[],
): number {
  const blocked = new Set<string>()

  for (const entry of entries) {
    if (!entry.unit_id || !entry.task_id) continue
    if (entry.status !== "rejected") continue
    if (!unitIds.includes(entry.unit_id)) continue
    if (!getAssignedTaskIdsForUnit(byUnit, entry.unit_id, allTaskIds).includes(entry.task_id)) {
      continue
    }
    blocked.add(`${entry.unit_id}:${entry.task_id}`)
  }

  return blocked.size
}

export function unitHasBlockedTasks(
  unitId: string,
  assignedTaskIds: string[],
  entries: ProgressEntryRow[],
): boolean {
  if (assignedTaskIds.length === 0) return false

  const latestByTask = new Map<string, ProgressEntryRow>()

  for (const entry of entries) {
    if (entry.unit_id !== unitId || !entry.task_id) continue
    if (!assignedTaskIds.includes(entry.task_id)) continue

    const previous = latestByTask.get(entry.task_id)
    if (!previous || getEntryTimestamp(entry) > getEntryTimestamp(previous)) {
      latestByTask.set(entry.task_id, entry)
    }
  }

  for (const entry of latestByTask.values()) {
    if (entry.status === "rejected") return true
  }

  return false
}
