import { differenceInDays } from "date-fns"

import type {
  CertificacionesData,
  CertificacionMember,
  CertificacionTask,
} from "@/app/project/[projectId]/certificaciones/actions"
import { formatArgentinaTaskDate, formatArgentinaTaskTime } from "@/lib/datetime/argentinaDateTime"
import { getUnitPillLabel } from "@/lib/projects/floorLabels"
import { buildTaskCodeMap, buildTaskLabelMap } from "@/lib/projects/unitDetailTasks"
import { isTaskAssignedToUnit } from "@/lib/projects/unitTaskAssignments"

/**
 * Arma la lista de Certificaciones (tareas completadas para certificar y ya certificadas)
 * a partir de las filas de la base. Lo usan los dos caminos: la server action
 * (getCertificacionesData) y el servidor de datos (GET /obras/:id/certificaciones).
 */

type Grupos = Parameters<typeof buildTaskCodeMap>[0] & Parameters<typeof buildTaskLabelMap>[0]

export type CrudosDeCertificaciones = {
  floors: { id: string; name: string; identifier: string | null; sort_order: number | null }[]
  units: { id: string; floor_id: string; code: string | null; sort_order: number | null }[]
  rubroGroups: Grupos
  assignmentsByUnit: Record<string, string[]>
  /** Último avance de cada tarea en cada unidad, solo enviados o certificados. */
  entries: {
    id: string
    unit_id: string | null
    floor_id: string | null
    task_id: string
    status: string
    progress_state: string
    comment: string | null
    created_by: string
    submitted_at: string | null
    created_at: string
  }[]
  /** Certificaciones (aprobadas) de los avances certificados, la más nueva primero. */
  validations: { progress_entry_id: string; validated_at: string; validated_by: string; comment: string | null }[]
  /** Nombre para mostrar de cada autor y certificador. */
  nombres: Record<string, string>
}

export function armarCertificaciones(
  crudos: CrudosDeCertificaciones,
  canCertify: boolean,
  ahora: Date,
): CertificacionesData {
  const { floors, units, entries } = crudos
  const nombre = (id: string) => crudos.nombres[id] ?? "Usuario"
  const taskCodeById = buildTaskCodeMap(crudos.rubroGroups)
  const taskLabelsById = buildTaskLabelMap(crudos.rubroGroups)
  const floorById = new Map(floors.map((floor) => [floor.id, floor.name]))

  const unitsByFloor = new Map<string, typeof units>()
  for (const unit of units) {
    const list = unitsByFloor.get(unit.floor_id) ?? []
    list.push(unit)
    unitsByFloor.set(unit.floor_id, list)
  }
  const unitIndexById = new Map<string, { floorName: string; unitLabel: string }>()
  for (const floor of floors) {
    const floorUnits = [...(unitsByFloor.get(floor.id) ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    floorUnits.forEach((unit, index) => {
      const unitCode = getUnitPillLabel({ name: floor.name, identifier: floor.identifier }, { id: unit.id, code: unit.code }, index + 1)
      unitIndexById.set(unit.id, { floorName: floor.name, unitLabel: unitCode === "—" ? "—" : `Unidad ${unitCode}` })
    })
  }

  // La certificación vigente de cada avance (la más nueva).
  const certificacion = new Map<string, CrudosDeCertificaciones["validations"][number]>()
  for (const v of crudos.validations) if (!certificacion.has(v.progress_entry_id)) certificacion.set(v.progress_entry_id, v)

  const tasks: CertificacionTask[] = []
  const personas = new Set<string>()
  for (const entry of entries) {
    if (!entry.unit_id || !entry.task_id) continue
    if (!isTaskAssignedToUnit(crudos.assignmentsByUnit, entry.unit_id, entry.task_id)) continue
    if (entry.status !== "submitted" && entry.status !== "approved") continue
    if (entry.status === "submitted" && entry.progress_state !== "completed") continue

    const unitMeta = unitIndexById.get(entry.unit_id)
    const floorName = unitMeta?.floorName ?? (entry.floor_id ? (floorById.get(entry.floor_id) ?? "—") : "—")
    const labels = taskLabelsById.get(entry.task_id)
    const occurredAt = entry.submitted_at ?? entry.created_at
    const daysPending = Math.max(0, differenceInDays(ahora, new Date(occurredAt)))
    const certificada = entry.status === "approved"
    const v = certificada ? certificacion.get(entry.id) : undefined
    const fecha = certificada ? (v?.validated_at ?? occurredAt) : occurredAt
    personas.add(entry.created_by)
    if (v) personas.add(v.validated_by)

    tasks.push({
      entryId: entry.id,
      taskCode: taskCodeById.get(entry.task_id) ?? "—",
      taskName: labels?.taskName ?? "Tarea",
      rubroName: labels?.rubroName ?? "Rubro",
      floorName,
      unitLabel: unitMeta?.unitLabel ?? "—",
      authorId: entry.created_by,
      authorName: nombre(entry.created_by),
      certifiedById: v?.validated_by ?? null,
      certifiedByName: v ? nombre(v.validated_by) : null,
      occurredAt,
      certifiedAt: certificada ? fecha : null,
      formattedDate: formatArgentinaTaskDate(fecha),
      formattedTime: formatArgentinaTaskTime(fecha),
      comment: v !== undefined ? v.comment : entry.comment,
      daysPending,
      isUrgent: daysPending >= 7,
      status: certificada ? "certified" : "pending",
    })
  }

  const members: CertificacionMember[] = [...personas]
    .map((userId) => ({ userId, name: nombre(userId) }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"))

  return { tasks, members, canCertify }
}
