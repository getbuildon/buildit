import type {
  TrabajoDiarioFloor,
  TrabajoDiarioRubroGroup,
  TrabajoDiarioRubroTask,
  TrabajoDiarioUnit,
} from "@/app/[projectId]/trabajo-diario/actions"
import {
  getUnitDisplayCode,
} from "@/lib/projects/floorLabels"
import { isTaskAssignedToUnit } from "@/lib/projects/unitTaskAssignments"

export type CargarAvanceRubroOption = {
  id: string
  name: string
  groupName: string
}

export function getUnitTaskKey(unitId: string, taskId: string): string {
  return `${unitId}:${taskId}`
}

export function buildLoadedUnitTaskKeySet(keys: string[]): Set<string> {
  return new Set(keys)
}

export function isUnitTaskLoaded(
  loadedKeys: Set<string>,
  unitId: string,
  taskId: string,
): boolean {
  return loadedKeys.has(getUnitTaskKey(unitId, taskId))
}

/** Tarea cargable si al menos una unidad seleccionada aún no tiene avance. */
export function isTaskLoadableForUnits(
  taskId: string,
  unitIds: string[],
  assignmentsByUnit: Record<string, string[]>,
  loadedKeys: Set<string>,
): boolean {
  return unitIds.some(
    (unitId) =>
      isTaskAssignedToUnit(assignmentsByUnit, unitId, taskId) &&
      !isUnitTaskLoaded(loadedKeys, unitId, taskId),
  )
}

export function getRubrosForUnits(
  unitIds: string[],
  rubroGroups: TrabajoDiarioRubroGroup[],
  assignmentsByUnit: Record<string, string[]>,
  loadedUnitTaskKeys: Set<string> = new Set(),
): CargarAvanceRubroOption[] {
  if (unitIds.length === 0) return []

  const rubros: CargarAvanceRubroOption[] = []

  for (const group of rubroGroups) {
    for (const rubro of group.rubros) {
      const hasLoadableTask = rubro.tasks.some((task) =>
        isTaskLoadableForUnits(
          task.id,
          unitIds,
          assignmentsByUnit,
          loadedUnitTaskKeys,
        ),
      )

      if (hasLoadableTask) {
        rubros.push({
          id: rubro.id,
          name: rubro.name,
          groupName: group.name,
        })
      }
    }
  }

  return rubros
}

/** @deprecated Usar getRubrosForUnits cuando ya hay unidades seleccionadas. */
export function getRubrosForFloor(
  floor: TrabajoDiarioFloor,
  rubroGroups: TrabajoDiarioRubroGroup[],
  assignmentsByUnit: Record<string, string[]>,
): CargarAvanceRubroOption[] {
  const relevantTaskIds = new Set<string>()

  for (const unit of floor.units) {
    for (const group of rubroGroups) {
      for (const rubro of group.rubros) {
        for (const task of rubro.tasks) {
          if (isTaskAssignedToUnit(assignmentsByUnit, unit.id, task.id)) {
            relevantTaskIds.add(task.id)
          }
        }
      }
    }
  }

  const rubros: CargarAvanceRubroOption[] = []

  for (const group of rubroGroups) {
    for (const rubro of group.rubros) {
      if (rubro.tasks.some((task) => relevantTaskIds.has(task.id))) {
        rubros.push({
          id: rubro.id,
          name: rubro.name,
          groupName: group.name,
        })
      }
    }
  }

  return rubros
}

export function findRubroById(
  rubroId: string,
  rubroGroups: TrabajoDiarioRubroGroup[],
): { rubro: TrabajoDiarioRubroGroup["rubros"][number]; groupName: string } | null {
  for (const group of rubroGroups) {
    const rubro = group.rubros.find((item) => item.id === rubroId)
    if (rubro) return { rubro, groupName: group.name }
  }
  return null
}

export function getUnitsForRubroOnFloor(
  floor: TrabajoDiarioFloor,
  rubroId: string,
  rubroGroups: TrabajoDiarioRubroGroup[],
  assignmentsByUnit: Record<string, string[]>,
): TrabajoDiarioUnit[] {
  const rubroMatch = findRubroById(rubroId, rubroGroups)
  if (!rubroMatch) return []

  const rubroTaskIds = new Set(rubroMatch.rubro.tasks.map((task) => task.id))

  return floor.units.filter((unit) =>
    [...rubroTaskIds].some((taskId) =>
      isTaskAssignedToUnit(assignmentsByUnit, unit.id, taskId),
    ),
  )
}

export function getTasksForRubroAndUnits(
  rubroId: string,
  rubroGroups: TrabajoDiarioRubroGroup[],
  unitIds: string[],
  assignmentsByUnit: Record<string, string[]>,
  loadedUnitTaskKeys: Set<string> = new Set(),
): TrabajoDiarioRubroTask[] {
  const rubroMatch = findRubroById(rubroId, rubroGroups)
  if (!rubroMatch || unitIds.length === 0) return []

  return rubroMatch.rubro.tasks
    .filter((task) =>
      isTaskLoadableForUnits(
        task.id,
        unitIds,
        assignmentsByUnit,
        loadedUnitTaskKeys,
      ),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function getUnitDisplayLabel(
  unit: { id: string; code?: string | null; name?: string | null },
  unitIndex?: number,
): string {
  return getUnitDisplayCode(unit, unitIndex)
}

export type CargarAvanceTaskStatus = "pending" | "in_progress" | "completed" | "blocked"

export const CARGAR_AVANCE_STATUS_LABELS: Record<CargarAvanceTaskStatus, string> = {
  pending: "Sin Iniciar",
  completed: "Completado",
  in_progress: "En Proceso",
  blocked: "Bloqueado",
}

export const CARGAR_AVANCE_BADGE_STYLES: Record<
  Exclude<CargarAvanceTaskStatus, "pending">,
  string
> = {
  completed: "bg-[#d6f1e3] text-[#208368]",
  in_progress: "bg-[#fff7c2] text-[#4f3422]",
  blocked: "bg-[#ffdbdc] text-[#641723]",
}

export const CARGAR_AVANCE_BADGE_CLASSNAME =
  "shrink-0 rounded-[8px] px-3 py-1 text-[12px] font-medium leading-4"

export type CargarAvancePhotoDraft = {
  id: string
  file: File
  previewUrl: string
  fileName: string
  fileSize: number
  fileType: string
}

export type CargarAvanceTaskDraft = {
  taskStatus: CargarAvanceTaskStatus
  comment: string
  photos: CargarAvancePhotoDraft[]
}

export function createEmptyTaskDraft(): CargarAvanceTaskDraft {
  return { taskStatus: "pending", comment: "", photos: [] }
}

export function revokeTaskDraftPhotos(draft: CargarAvanceTaskDraft): void {
  for (const photo of draft.photos) {
    URL.revokeObjectURL(photo.previewUrl)
  }
}

export function revokeAllTaskDrafts(drafts: Record<string, CargarAvanceTaskDraft>): void {
  for (const draft of Object.values(drafts)) {
    revokeTaskDraftPhotos(draft)
  }
}

export function hasTaskDraftContent(draft: CargarAvanceTaskDraft): boolean {
  return (
    draft.taskStatus !== "pending" ||
    draft.comment.trim().length > 0 ||
    draft.photos.length > 0
  )
}

export function mapTaskStatusToDb(taskStatus: CargarAvanceTaskStatus): {
  progress_state: "pending" | "in_progress" | "completed"
  status: "submitted" | "rejected" | "draft"
} {
  switch (taskStatus) {
    case "completed":
      return { progress_state: "completed", status: "submitted" }
    case "in_progress":
      return { progress_state: "in_progress", status: "submitted" }
    case "blocked":
      return { progress_state: "in_progress", status: "rejected" }
    default:
      return { progress_state: "pending", status: "draft" }
  }
}

export function getUnitDisplayTitle(
  unit: TrabajoDiarioUnit,
  floor: { name: string; identifier?: string | null },
  unitIndex?: number,
): string {
  const unitCode = getUnitDisplayCode(unit, unitIndex)
  const typeDetails = unit.name?.trim()
  if (typeDetails) {
    return `${floor.name} — ${unitCode} — ${typeDetails}`
  }
  return `${floor.name} — ${unitCode}`
}
