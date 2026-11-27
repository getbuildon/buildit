"use client"

import { certifyProgressEntries } from "@/app/project/[projectId]/certificaciones/actions"
import { encolarCertificacion } from "@/lib/api/cola"
import { apiDisponible } from "@/lib/api/navegador"

export type ResultadoDeCertificar = { ok: true; enCola: boolean; cantidad: number } | { ok: false; error: string }

/**
 * Certificar una o varias tareas. Con el servidor de datos va a la cola del dispositivo
 * (sale con señal o cuando vuelva; repetirlo no duplica); sin él, la server action.
 * La misma nota vale para todas (como hoy).
 */
export async function certificarAvances(input: {
  projectId: string
  userId: string
  avanceIds: string[]
  nota: string
}): Promise<ResultadoDeCertificar> {
  const ids = [...new Set(input.avanceIds)]
  if (ids.length === 0) return { ok: false, error: "Seleccioná al menos una tarea." }
  const nota = input.nota.trim()
  if (apiDisponible()) {
    try {
      await encolarCertificacion({
        id: crypto.randomUUID(),
        userId: input.userId,
        obraId: input.projectId,
        hechoEn: new Date().toISOString(),
        certificaciones: ids.map((avanceId) => ({ avanceId, validacionId: crypto.randomUUID(), nota: nota || null })),
      })
    } catch {
      return { ok: false, error: "No pudimos guardar la certificación en este dispositivo. Probá de nuevo." }
    }
    return { ok: true, enCola: typeof navigator !== "undefined" && navigator.onLine === false, cantidad: ids.length }
  }
  const resultado = await certifyProgressEntries(
    input.projectId,
    ids,
    nota ? Object.fromEntries(ids.map((id) => [id, nota])) : undefined,
  )
  return resultado.ok ? { ok: true, enCola: false, cantidad: resultado.certifiedCount } : resultado
}
