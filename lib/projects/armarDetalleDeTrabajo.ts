import type {
  TrabajoDiarioTaskAttachment,
  TrabajoDiarioTaskDetail,
  TrabajoDiarioTaskHistoryItem,
  TrabajoDiarioTaskHistoryStatus,
} from "@/app/project/[projectId]/trabajo-diario/actions"
import { formatArgentinaDateTime, formatArgentinaLongDate } from "@/lib/datetime/argentinaDateTime"
import { mapProgressStatus } from "@/lib/projects/armarTrabajoDiario"
import { getUnitLabelInFloor } from "@/lib/projects/floorLabels"

/**
 * Arma el detalle de un trabajo cargado (lo que se ve al tocarlo en la lista) a partir de
 * las filas de la base. Lo usan los dos caminos: la server action
 * (getTrabajoDiarioTaskDetail) y el servidor de datos (GET /obras/:id/avances/:avance).
 */

/** En el historial, el avance certificado sigue siendo el avance «Completado». */
export function mapHistoryWorkStatus(
  status: string,
  progressState: string,
): Exclude<TrabajoDiarioTaskHistoryStatus, "Certificada"> {
  if (status === "rejected") return "Bloqueado"
  if (progressState === "completed" || status === "approved") return "Completado"
  return "En Proceso"
}

type FilaDeHistorial = {
  id: string
  status: string
  progress_state: string
  comment: string | null
  created_at: string
  submitted_at: string | null
  created_by: string
}

export type CrudosDelDetalle = {
  avance: {
    id: string
    unit_id: string
    /** Vienen del servidor de datos: hacen falta para cambiar el estado sin señal. */
    floor_id?: string | null
    task_id?: string
    category_id?: string
    status: string
    progress_state: string
    comment: string | null
    created_at: string
    submitted_at: string | null
    rubro: string | null
    tarea: string | null
    piso: { name: string; identifier: string | null } | null
  }
  /** Unidades del piso del avance, en orden (para la etiqueta «Unidad 1A»). null: sin piso. */
  unidadesDelPiso: { id: string; code: string | null }[] | null
  /** Sin permiso de ver el historial, viene vacío. */
  historial: FilaDeHistorial[]
  validaciones: { id: string; validated_by: string; validated_at: string; comment: string | null }[]
  adjuntos: Record<string, TrabajoDiarioTaskAttachment[]>
  /** Nombre para mostrar de cada autor o certificador. */
  nombres: Record<string, string>
  veHistorial: boolean
}

export function armarDetalleDeTrabajo(crudos: CrudosDelDetalle): TrabajoDiarioTaskDetail {
  const { avance } = crudos
  const nombre = (id: string) => crudos.nombres[id] ?? "Usuario"

  let unitLabel = "—"
  if (crudos.unidadesDelPiso) {
    const codigo = getUnitLabelInFloor(crudos.unidadesDelPiso, avance.unit_id)
    unitLabel = codigo === "—" ? "—" : `Unidad ${codigo}`
  }

  const deAvances: TrabajoDiarioTaskHistoryItem[] = crudos.historial.map((fila) => {
    const cuando = fila.submitted_at ?? fila.created_at
    return {
      id: fila.id,
      status: mapHistoryWorkStatus(fila.status, fila.progress_state),
      comment: fila.comment,
      occurredAt: cuando,
      formattedDate: formatArgentinaDateTime(cuando),
      authorName: nombre(fila.created_by),
      attachments: crudos.adjuntos[fila.id] ?? [],
    }
  })
  const deCertificaciones: TrabajoDiarioTaskHistoryItem[] = crudos.validaciones.map((v) => ({
    id: `certification-${v.id}`,
    status: "Certificada",
    comment: v.comment,
    occurredAt: v.validated_at,
    formattedDate: formatArgentinaDateTime(v.validated_at),
    authorName: nombre(v.validated_by),
    attachments: [],
  }))

  const historial = crudos.veHistorial
    ? [...deAvances, ...deCertificaciones].sort(
        (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      )
    : []

  const ultimo = historial[0]
  const cuando = ultimo?.occurredAt ?? avance.submitted_at ?? avance.created_at
  return {
    entryId: avance.id,
    taskName: avance.tarea ?? "Tarea",
    rubroName: avance.rubro ?? "Rubro",
    floorName: avance.piso?.name ?? "—",
    floorIdentifier: avance.piso?.identifier ?? null,
    unitLabel,
    occurredAt: cuando,
    formattedLongDate: formatArgentinaLongDate(cuando),
    registeredByName: ultimo?.authorName ?? "Usuario",
    status: mapProgressStatus(avance.status, avance.progress_state),
    comment: ultimo ? ultimo.comment : avance.comment,
    attachments: ultimo?.attachments ?? [],
    history: historial.slice(1),
  }
}
