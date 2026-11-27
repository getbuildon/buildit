import type { AvanceEnCola, EscrituraEnCola } from "@/lib/api/cola"
import type { FilaDeAvance } from "@/lib/projects/armarTrabajoDiario"
import { mapTaskStatusToDb } from "@/lib/projects/cargarAvance"

/** Un avance que todavía no llegó al servidor: el id del envío y, si falló por los datos, el motivo. */
export type Pendiente = {
  envioId: string
  error?: string
  /** Es una certificación de algo que ya está en el servidor (se puede abrir el detalle). */
  soloCertificacion?: boolean
}

/**
 * Suma a las filas del servidor lo que está en la cola, como si ya hubiera llegado: la
 * lista lo muestra al instante y «Cargar avance» no vuelve a ofrecer lo ya cargado.
 * Si el servidor ya tiene un avance de esa tarea en esa unidad, manda el de la cola (es
 * más nuevo).
 */
export function conLaCola<F extends Pick<FilaDeAvance, "id" | "unit_id" | "task_id" | "status" | "progress_state">>(avances: F[], cola: EscrituraEnCola[]): F[] {
  if (cola.length === 0) return avances
  // Lo certificado en la cola se ve certificado.
  const certificados = new Set(cola.flatMap((i) => (i.tipo === "certificacion" ? i.certificaciones.map((c) => c.avanceId) : [])))
  const conCertificados = certificados.size
    ? avances.map((a) => (certificados.has(a.id) ? { ...a, status: "approved", progress_state: "completed" } : a))
    : avances
  const cargas = cola.filter((i): i is AvanceEnCola => i.tipo !== "certificacion")
  if (cargas.length === 0) return conCertificados
  const deLaCola = cargas.flatMap((item) =>
    item.tareas.flatMap((tarea) => {
      const estado = mapTaskStatusToDb(tarea.estado)
      return tarea.unidades.map((u) => ({
        id: u.avanceId,
        unit_id: u.unidadId,
        floor_id: item.pisoId,
        task_id: tarea.tareaId,
        status: estado.status,
        progress_state: estado.progress_state,
        submitted_at: item.hechoEn,
        created_at: item.hechoEn,
        // Para las pantallas que muestran autor y comentario (Certificaciones).
        created_by: item.userId,
        comment: tarea.comentario,
      }))
    }),
  )
  const reemplazadas = new Set(deLaCola.map((a) => `${a.unit_id}:${a.task_id}`))
  // Las filas nuevas llevan los campos de las del servidor que no se conocen (comentario, autor…).
  return [...conCertificados.filter((a) => !reemplazadas.has(`${a.unit_id}:${a.task_id}`)), ...(deLaCola as unknown as F[])]
}

/** Qué filas de la lista están sin enviar (por id de avance). */
export function pendientesDeLaCola(cola: EscrituraEnCola[]): Map<string, Pendiente> {
  const mapa = new Map<string, Pendiente>()
  for (const item of cola) {
    if (item.tipo === "certificacion") {
      for (const c of item.certificaciones) mapa.set(c.avanceId, { envioId: item.id, error: item.error, soloCertificacion: true })
      continue
    }
    for (const tarea of item.tareas) {
      for (const u of tarea.unidades) mapa.set(u.avanceId, { envioId: item.id, error: item.error })
    }
  }
  return mapa
}

/** Las certificaciones en la cola, como si ya estuvieran (para mostrar quién y cuándo). */
export function certificacionesDeLaCola(cola: EscrituraEnCola[]) {
  return cola.flatMap((item) =>
    item.tipo === "certificacion"
      ? item.certificaciones.map((c) => ({
          progress_entry_id: c.avanceId,
          validated_at: item.hechoEn,
          validated_by: item.userId,
          comment: c.nota,
        }))
      : [],
  )
}
