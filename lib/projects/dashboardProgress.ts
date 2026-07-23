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

export function calculateUnitProgressPercent(
  unitId: string,
  assignedTaskIds: string[],
  entries: ProgressEntryRow[],
  taskWeights: Map<string, number | null>,
): number {
  if (assignedTaskIds.length === 0) return 0

  const latestByTask = buildLatestEntriesByTaskForUnit(entries, unitId, assignedTaskIds)
  const certifiedTasks = new Set<string>()
  for (const [taskId, entry] of latestByTask) {
    if (isProgressEntryCertified(entry)) {
      certifiedTasks.add(taskId)
    }
  }

  const useWeights = assignedTaskIds.some((taskId) => {
    const weight = taskWeights.get(taskId)
    return weight != null && weight > 0
  })

  if (useWeights) {
    let totalWeight = 0
    let certifiedWeight = 0
    for (const taskId of assignedTaskIds) {
      const weight = taskWeights.get(taskId) ?? 0
      if (weight <= 0) continue
      totalWeight += weight
      if (certifiedTasks.has(taskId)) certifiedWeight += weight
    }
    if (totalWeight <= 0) {
      return Math.round((certifiedTasks.size / assignedTaskIds.length) * 100)
    }
    return Math.round((certifiedWeight / totalWeight) * 100)
  }

  return Math.round((certifiedTasks.size / assignedTaskIds.length) * 100)
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
