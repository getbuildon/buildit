import type { ProgressEntryRow } from "@/lib/projects/dashboardProgress"
import { getAssignedTaskIdsForUnit } from "@/lib/projects/dashboardProgress"

export type UnitDetailTaskStatus =
  | "pending"
  | "completed"
  | "certified"
  | "in_progress"
  | "blocked"

export type UnitDetailTaskFilter =
  | "all"
  | "completed"
  | "certified"
  | "in_progress"
  | "blocked"

export type UnitDetailTaskItem = {
  id: string
  code: string
  name: string
  rubroName: string
  groupIndex: number
  status: UnitDetailTaskStatus
  entryId: string | null
  authorName: string | null
  occurredAt: string | null
  formattedMeta: string | null
}

export type UnitDetailTaskGroup = {
  id: string
  index: number
  name: string
  tasks: UnitDetailTaskItem[]
}

function getEntryTimestamp(entry: ProgressEntryRow): number {
  const value = entry.submitted_at ?? entry.created_at
  return value ? new Date(value).getTime() : 0
}

export function resolveUnitTaskStatus(
  entry: ProgressEntryRow | null | undefined,
): UnitDetailTaskStatus {
  if (!entry) return "pending"
  if (entry.status === "approved") return "certified"
  if (entry.status === "rejected") return "blocked"
  if (entry.progress_state === "completed") return "completed"
  if (entry.progress_state === "in_progress") return "in_progress"
  return "pending"
}

export function matchesUnitTaskFilter(
  status: UnitDetailTaskStatus,
  filter: UnitDetailTaskFilter,
): boolean {
  if (filter === "all") return true
  if (filter === "completed") return status === "completed"
  if (filter === "certified") return status === "certified"
  if (filter === "in_progress") return status === "in_progress"
  return status === "blocked"
}

export function buildTaskCode(
  groupIndex: number,
  rubroIndex: number,
  taskIndex: number,
): string {
  return `${groupIndex}.${rubroIndex}.${taskIndex}`
}

export function formatUnitTaskMetaDate(value: string): string {
  const date = new Date(value)
  const datePart = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
  const timePart = new Intl.DateTimeFormat("es-AR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).format(date)
  return `${datePart} · ${timePart} h`
}

export function countCompletedTasks(
  assignedTaskIds: string[],
  latestByTaskId: Map<string, ProgressEntryRow>,
): number {
  let count = 0
  for (const taskId of assignedTaskIds) {
    const entry = latestByTaskId.get(taskId)
    if (!entry) continue
    if (entry.status === "approved") {
      count += 1
    }
  }
  return count
}

export function buildLatestEntriesByTask(
  entries: ProgressEntryRow[],
  assignedTaskIds: string[],
): Map<string, ProgressEntryRow> {
  const assigned = new Set(assignedTaskIds)
  const latestByTask = new Map<string, ProgressEntryRow>()

  for (const entry of entries) {
    if (!entry.task_id || !assigned.has(entry.task_id)) continue
    const previous = latestByTask.get(entry.task_id)
    if (!previous || getEntryTimestamp(entry) > getEntryTimestamp(previous)) {
      latestByTask.set(entry.task_id, entry)
    }
  }

  return latestByTask
}

export function getAssignedTaskIds(
  assignmentsByUnit: Record<string, string[]>,
  unitId: string,
  allTaskIds: string[],
): string[] {
  return getAssignedTaskIdsForUnit(assignmentsByUnit, unitId, allTaskIds)
}
