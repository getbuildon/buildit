import {
  createDefaultFloor,
  createEmptyProjectDraft,
  type CreateProjectDraft,
  type RubroGroupDraft,
  type RubroItemDraft,
  type StructureFloorDraft,
  type StructureUnitDraft,
} from "@/lib/projects/createProjectDraft"
import {
  dbFieldsToUnitDraft,
  normalizeUnitType,
} from "@/lib/projects/unitTypes"

/**
 * Reglas de asignación unidad ↔ tarea (unit_task_assignments):
 *
 * - Lista positiva: solo aplica lo que tiene fila en unit_task_assignments.
 * - Destildar: borra la asignación; los avances (progress_entries) se conservan.
 * - Volver a tildar: restaura la asignación y los avances vuelven a mostrarse.
 * - Tarea nueva: se asigna por defecto a todas las unidades del proyecto.
 * - Eliminar tarea del catálogo: bloqueada si tiene avances (validación previa + FK RESTRICT).
 * - Guardado en configuración: sincronización incremental (update/insert/delete selectivo).
 * - Estructura (pisos/unidades): sincronización incremental; no se eliminan unidades/pisos con avances.
 */
export function getAllTaskIds(draft: CreateProjectDraft): string[] {
  return draft.groups.flatMap((group) =>
    group.rubros.flatMap((rubro) => rubro.tasks.map((task) => task.id)),
  )
}

export function isTaskAssignedToUnit(
  byUnit: Record<string, string[]>,
  unitId: string,
  taskId: string,
): boolean {
  const hasAnyAssignment = Object.keys(byUnit).length > 0
  if (!hasAnyAssignment) return true
  return (byUnit[unitId] ?? []).includes(taskId)
}

export function assignmentsToExclusions(
  byUnit: Record<string, string[]>,
  draft: CreateProjectDraft,
): Record<string, string[]> {
  const allTaskIds = getAllTaskIds(draft)
  if (allTaskIds.length === 0) return {}

  const hasAnyAssignment = Object.keys(byUnit).length > 0
  const exclusions: Record<string, string[]> = {}

  for (const floor of draft.floors) {
    for (const unit of floor.units) {
      const assigned = new Set(hasAnyAssignment ? (byUnit[unit.id] ?? []) : allTaskIds)
      const excluded = allTaskIds.filter((id) => !assigned.has(id))
      if (excluded.length > 0) exclusions[unit.id] = excluded
    }
  }

  return exclusions
}

export function exclusionsToAssignments(
  exclusions: Record<string, string[]>,
  draft: CreateProjectDraft,
): Record<string, string[]> {
  const allTaskIds = getAllTaskIds(draft)
  const byUnit: Record<string, string[]> = {}

  for (const floor of draft.floors) {
    for (const unit of floor.units) {
      const excluded = new Set(exclusions[unit.id] ?? [])
      const assigned = allTaskIds.filter((id) => !excluded.has(id))
      if (assigned.length > 0) byUnit[unit.id] = assigned
    }
  }

  return byUnit
}

function buildUnitPositionMap(draft: CreateProjectDraft): Map<string, string> {
  const map = new Map<string, string>()
  draft.floors.forEach((floor, floorIndex) => {
    floor.units.forEach((unit, unitIndex) => {
      map.set(`${floorIndex}:${unitIndex}`, unit.id)
    })
  })
  return map
}

function buildTaskPositionMap(draft: CreateProjectDraft): Map<string, string> {
  const map = new Map<string, string>()
  draft.groups.forEach((group, groupIndex) => {
    group.rubros.forEach((rubro, rubroIndex) => {
      rubro.tasks.forEach((task, taskIndex) => {
        map.set(`${groupIndex}:${rubroIndex}:${taskIndex}`, task.id)
      })
    })
  })
  return map
}

export function remapUnitTaskExclusions(
  exclusions: Record<string, string[]>,
  oldDraft: CreateProjectDraft,
  newDraft: CreateProjectDraft,
): Record<string, string[]> {
  const oldUnits = buildUnitPositionMap(oldDraft)
  const newUnits = buildUnitPositionMap(newDraft)
  const oldTasks = buildTaskPositionMap(oldDraft)
  const newTasks = buildTaskPositionMap(newDraft)

  const unitIdToPosition = new Map<string, string>()
  oldUnits.forEach((unitId, position) => unitIdToPosition.set(unitId, position))

  const taskIdToPosition = new Map<string, string>()
  oldTasks.forEach((taskId, position) => taskIdToPosition.set(taskId, position))

  const remapped: Record<string, string[]> = {}

  for (const [oldUnitId, excludedTaskIds] of Object.entries(exclusions)) {
    const position = unitIdToPosition.get(oldUnitId)
    if (!position) continue

    const newUnitId = newUnits.get(position)
    if (!newUnitId) continue

    const newExcluded: string[] = []
    for (const oldTaskId of excludedTaskIds) {
      const taskPosition = taskIdToPosition.get(oldTaskId)
      if (!taskPosition) continue
      const newTaskId = newTasks.get(taskPosition)
      if (newTaskId) newExcluded.push(newTaskId)
    }

    if (newExcluded.length > 0) remapped[newUnitId] = newExcluded
  }

  return remapped
}

type FloorData = {
  id: string
  name: string
  level: string | null
}

type UnitData = {
  id: string
  floor_id: string
  unit_type: string | null
  name: string | null
  area_m2: number | null
  rooms: number | null
}

type RubroGroupData = {
  id: string
  name: string
  rubros: Array<{
    id: string
    name: string
    tasks: Array<{
      id: string
      name: string
      default_weight: number | null
    }>
  }>
}

export function buildConfigDraftFromProjectData(input: {
  projectName: string
  location: string
  floors: FloorData[]
  units: UnitData[]
  groups: RubroGroupData[]
  assignmentsByUnit?: Record<string, string[]>
}): CreateProjectDraft {
  const base = createEmptyProjectDraft()

  const floorsWithUnits: StructureFloorDraft[] =
    input.floors.length > 0
      ? input.floors.map((floor) => ({
          id: floor.id,
          name: floor.name,
          level: floor.level || "",
          units: input.units
            .filter((unit) => unit.floor_id === floor.id)
            .map(
              (unit): StructureUnitDraft => {
                const normalizedType =
                  normalizeUnitType(unit.unit_type) ?? "Departamento"
                const variants = dbFieldsToUnitDraft(unit)

                return {
                  id: unit.id,
                  type: normalizedType,
                  squareMeters: unit.area_m2?.toString() || "",
                  roomCount: variants.roomCount,
                  officeSize: variants.officeSize,
                }
              },
            ),
        }))
      : [
          { ...createDefaultFloor(1), name: "Planta Baja" },
          createDefaultFloor(2),
          createDefaultFloor(3),
        ]

  const groups: RubroGroupDraft[] =
    input.groups.length > 0
      ? input.groups.map((group) => ({
          id: group.id,
          name: group.name,
          rubros: group.rubros.map(
            (rubro): RubroItemDraft => ({
              id: rubro.id,
              name: rubro.name,
              trackingType: "Porcentaje",
              tasks: rubro.tasks.map((task) => ({
                id: task.id,
                name: task.name,
                weightPercent: task.default_weight?.toString() || "",
              })),
            }),
          ),
        }))
      : base.groups

  const draft: CreateProjectDraft = {
    ...base,
    projectName: input.projectName,
    location: input.location,
    floors: floorsWithUnits,
    groups,
    unitTaskExclusions: {},
  }

  draft.unitTaskExclusions = assignmentsToExclusions(
    input.assignmentsByUnit ?? {},
    draft,
  )

  return draft
}
