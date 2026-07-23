import type { RubroGroupDraft, RubroItemDraft } from "@/lib/projects/createProjectDraft"
import { mapTaskStatusToDb, type CargarAvanceTaskStatus } from "@/lib/projects/cargarAvance"

export type InitialWorkTaskStatus = Exclude<CargarAvanceTaskStatus, "blocked">

export const INITIAL_WORK_STATUS_LABELS: Record<InitialWorkTaskStatus, string> = {
  pending: "Sin Iniciar",
  completed: "Completado",
  in_progress: "En Proceso",
}

export function getTaskInitialStatus(
  taskId: string,
  statuses: Record<string, InitialWorkTaskStatus>,
): InitialWorkTaskStatus {
  return statuses[taskId] ?? "pending"
}

export function deriveRubroInitialStatus(
  rubro: RubroItemDraft,
  statuses: Record<string, InitialWorkTaskStatus>,
): InitialWorkTaskStatus {
  const namedTasks = rubro.tasks.filter((task) => task.name.trim())
  if (namedTasks.length === 0) return "pending"

  const taskStatuses = namedTasks.map((task) => getTaskInitialStatus(task.id, statuses))
  if (taskStatuses.every((status) => status === "completed")) return "completed"
  if (taskStatuses.every((status) => status === "pending")) return "pending"
  return "in_progress"
}

export function applyRubroInitialStatus(
  rubro: RubroItemDraft,
  status: InitialWorkTaskStatus,
  current: Record<string, InitialWorkTaskStatus>,
): Record<string, InitialWorkTaskStatus> {
  const next = { ...current }
  for (const task of rubro.tasks) {
    if (!task.name.trim()) continue
    next[task.id] = status
  }
  return next
}

export function mapInitialWorkStatusToDb(status: InitialWorkTaskStatus) {
  return mapTaskStatusToDb(status)
}

export function countNamedTasksInGroups(groups: RubroGroupDraft[]): number {
  return groups.reduce(
    (sum, group) =>
      sum +
      group.rubros.reduce(
        (rubroSum, rubro) =>
          rubroSum + rubro.tasks.filter((task) => task.name.trim()).length,
        0,
      ),
    0,
  )
}
