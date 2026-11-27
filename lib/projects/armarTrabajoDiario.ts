import type {
  TrabajoDiarioTaskStatus,
  TrabajoDiarioData,
  TrabajoDiarioFloor,
  TrabajoDiarioRubroGroup,
  TrabajoDiarioTask,
} from "@/app/project/[projectId]/trabajo-diario/actions"
import { formatArgentinaEntryDate } from "@/lib/datetime/argentinaDateTime"
import {
  getUnitTaskKey,
  isUnitTaskCompletedForLoading,
  mapDbProgressToCargarAvanceStatus,
  type CargarAvanceTaskStatus,
} from "@/lib/projects/cargarAvance"
import { getUnitLabelInFloor } from "@/lib/projects/floorLabels"
import { buildTaskCodeMap, buildTaskLabelMap } from "@/lib/projects/unitDetailTasks"
import { isTaskAssignedToUnit } from "@/lib/projects/unitTaskAssignments"

/**
 * Arma los datos de Trabajo diario (lista de trabajos cargados y lo que necesita «Cargar
 * avance») a partir de las filas de la base. Lo usan los dos caminos: la server action
 * (getTrabajoDiarioData) y el servidor de datos (GET /obras/:id/trabajo), que manda las
 * filas tal cual. Así la regla de etiquetas, códigos y estados vive en un solo lugar.
 */

export type FilaDePiso = {
  id: string
  name: string
  identifier: string | null
  level: string | null
  sort_order: number | null
}

export type FilaDeUnidad = {
  id: string
  floor_id: string
  code: string | null
  name: string | null
  sort_order: number | null
}

export type FilaDeTarea = { id: string; name: string; sort_order: number; weight_percent: number | null }
export type FilaDeRubro = { id: string; name: string; sort_order: number; rubro_tasks: FilaDeTarea[] | null }
export type FilaDeGrupo = { id: string; name: string; sort_order: number; rubros: FilaDeRubro[] | null }

/** El último avance de cada tarea en cada unidad (función latest_progress_entries de la base). */
export type FilaDeAvance = {
  id: string
  unit_id: string | null
  floor_id: string | null
  task_id: string
  status: string
  progress_state: string
  submitted_at: string | null
  created_at: string
}

export type DatosCrudosDeTrabajo = {
  floors: FilaDePiso[]
  units: FilaDeUnidad[]
  rubroGroups: FilaDeGrupo[]
  assignmentsByUnit: Record<string, string[]>
  entries: FilaDeAvance[]
}

/** El estado que se ve en la lista según el último avance de la tarea. */
export function mapProgressStatus(status: string, progressState: string): TrabajoDiarioTaskStatus {
  if (status === "rejected") return "Bloqueado"
  if (status === "approved") return "Certificada"
  if (progressState === "completed") return "Completado"
  return "En Proceso"
}

export function armarTrabajoDiario(crudos: DatosCrudosDeTrabajo): TrabajoDiarioData {
  const { floors, units, entries } = crudos
  const assignments = { byUnit: crudos.assignmentsByUnit }
  const rubroGroupsRaw = crudos.rubroGroups

  const floorById = new Map(floors.map((floor) => [floor.id, floor.name]))
  const unitById = new Map(
    units.map((unit) => [
      unit.id,
      { code: unit.code, name: unit.name, floorId: unit.floor_id },
    ]),
  )

  const trabajoFloors: TrabajoDiarioFloor[] = floors.map((floor) => ({
    id: floor.id,
    name: floor.name,
    identifier: floor.identifier ?? null,
    level: floor.level,
    units: units
      .filter((unit) => unit.floor_id === floor.id)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((unit) => ({
        id: unit.id,
        code: unit.code,
        name: unit.name,
      })),
  }))

  const floorUnitsById = new Map(trabajoFloors.map((floor) => [floor.id, floor.units]))

  const rubroGroups: TrabajoDiarioRubroGroup[] = rubroGroupsRaw.map((group) => ({
    id: group.id,
    name: group.name,
    rubros: (group.rubros ?? [])
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((rubro) => ({
        id: rubro.id,
        name: rubro.name,
        tasks: (rubro.rubro_tasks ?? [])
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((task) => ({
            id: task.id,
            name: task.name,
            sortOrder: task.sort_order ?? 0,
            weightPercent: task.weight_percent ?? null,
          })),
      })),
  }))

  const tasks: TrabajoDiarioTask[] = []
  const loadedUnitTaskKeys = new Set<string>()
  const unitTaskStatuses: Record<string, CargarAvanceTaskStatus> = {}
  const taskCodeById = buildTaskCodeMap(rubroGroupsRaw)
  const taskLabelsById = buildTaskLabelMap(rubroGroupsRaw)

  for (const entry of entries) {
    if (!entry.unit_id || !entry.task_id) continue

    const unitTaskKey = getUnitTaskKey(entry.unit_id, entry.task_id)
    unitTaskStatuses[unitTaskKey] = mapDbProgressToCargarAvanceStatus(
      entry.status,
      entry.progress_state,
    )

    if (isUnitTaskCompletedForLoading(entry.status, entry.progress_state)) {
      loadedUnitTaskKeys.add(unitTaskKey)
    }

    if (!isTaskAssignedToUnit(assignments.byUnit, entry.unit_id, entry.task_id)) continue

    const unit = unitById.get(entry.unit_id)
    if (!unit) continue

    const floorId = entry.floor_id ?? unit.floorId
    const floorName = floorId ? floorById.get(floorId) ?? "—" : "—"
    const labels = taskLabelsById.get(entry.task_id)
    const floorUnits = floorId ? floorUnitsById.get(floorId) ?? [] : []

    tasks.push({
      id: entry.id,
      taskCode: taskCodeById.get(entry.task_id) ?? "—",
      name: labels?.taskName ?? "Tarea",
      category: labels?.rubroName ?? "Rubro",
      floorId,
      floorName,
      unitId: entry.unit_id,
      unitLabel: getUnitLabelInFloor(floorUnits, entry.unit_id),
      unitName: unit.name,
      occurredAt: entry.submitted_at ?? entry.created_at,
      date: formatArgentinaEntryDate(entry.submitted_at ?? entry.created_at),
      status: mapProgressStatus(entry.status, entry.progress_state),
    })
  }

  tasks.sort((a, b) => {
    const aTime = a.occurredAt ? new Date(a.occurredAt).getTime() : 0
    const bTime = b.occurredAt ? new Date(b.occurredAt).getTime() : 0
    return bTime - aTime
  })

  return {
    floors: trabajoFloors,
    tasks,
    rubroGroups,
    assignmentsByUnit: assignments.byUnit,
    loadedUnitTaskKeys: [...loadedUnitTaskKeys],
    unitTaskStatuses,
  }
}
