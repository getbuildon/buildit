"use client"

/**
 * Cola de escrituras: lo que se carga en la obra se guarda primero en el dispositivo y
 * después se manda al servidor, en orden. Con señal sale enseguida; sin señal queda acá
 * (fotos incluidas) y sale sola cuando vuelve.
 *
 * Nunca se duplica: cada avance y cada foto llevan un id que pone la app al cargar. Si un
 * envío se corta en el medio y se repite, el servidor reconoce lo que ya tiene.
 *
 * Errores:
 *  - de red o del servidor (sin respuesta, 5xx): se reintenta más tarde, solo.
 *  - de datos (4xx: la tarea ya estaba terminada, perdió el permiso): no se reintenta;
 *    queda marcado con el motivo para que la persona lo vea y lo descarte.
 */
import { createClient } from "@/utils/supabase/client"
import { enTienda, TIENDA_ESCRITURAS } from "@/lib/api/disco"
import { enviarALaApi, ErrorDeApi } from "@/lib/api/navegador"
import { buildProgressPhotoStoragePath, PROGRESS_PHOTOS_BUCKET } from "@/lib/progress/progressPhotoConfig"

export type EstadoDeTarea = "completed" | "in_progress" | "blocked"

export type AvanceEnCola = {
  /** Id del envío: también es la carpeta de sus fotos. */
  id: string
  /**
   * avance: «Cargar avance» (una o varias tareas y unidades).
   * cambio: cambiar el estado de un trabajo ya cargado (una tarea en una unidad; se suma un
   * avance nuevo, con id en tareas[0].unidades[0].avanceId).
   */
  tipo: "avance" | "cambio"
  /** Solo en «cambio»: el trabajo que se cambia. */
  avanceBaseId?: string
  userId: string
  obraId: string
  /** Hora del dispositivo al cargar: es la hora del avance aunque salga más tarde. */
  hechoEn: string
  pisoId: string
  rubroId: string
  tareas: {
    tareaId: string
    estado: EstadoDeTarea
    comentario: string | null
    unidades: { unidadId: string; avanceId: string }[]
  }[]
  /** Fotos de cada tarea: se suben una vez y se vinculan a todos los avances de esa tarea. */
  fotos: { id: string; tareaId: string; archivo: Blob; nombre: string; tipo: string; tamano: number }[]
  /** Pasos ya hechos, para no repetirlos al reintentar. */
  avanceGuardado?: boolean
  fotosSubidas?: string[]
  /** Error de datos: no se reintenta solo. */
  error?: string
  intentos: number
}

/** Certificar una o varias tareas (con señal o cuando vuelva). */
export type CertificacionEnCola = {
  id: string
  tipo: "certificacion"
  userId: string
  obraId: string
  hechoEn: string
  certificaciones: { avanceId: string; validacionId: string; nota: string | null }[]
  avanceGuardado?: boolean
  error?: string
  intentos: number
}

/** Todo lo que puede esperar en la cola. */
export type EscrituraEnCola = AvanceEnCola | CertificacionEnCola

const EVENTO = "buildon:cola"
const avisar = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO))
}

export function escucharCola(alCambiar: () => void) {
  window.addEventListener(EVENTO, alCambiar)
  return () => window.removeEventListener(EVENTO, alCambiar)
}

const guardar = (item: EscrituraEnCola) => enTienda("readwrite", (t) => t.put(item), TIENDA_ESCRITURAS)
const borrar = (id: string) => enTienda("readwrite", (t) => t.delete(id), TIENDA_ESCRITURAS)

/** Lo que todavía no llegó al servidor, de una persona (y de una obra, si se pide), en orden de carga. */
export async function leerCola(userId: string, obraId?: string): Promise<EscrituraEnCola[]> {
  try {
    const todos = await enTienda<EscrituraEnCola[]>("readonly", (t) => t.getAll(), TIENDA_ESCRITURAS)
    return todos
      .filter((i) => i.userId === userId && (!obraId || i.obraId === obraId))
      .sort((a, b) => a.hechoEn.localeCompare(b.hechoEn))
  } catch {
    return []
  }
}

/** Guarda el avance en el dispositivo y, si hay señal, lo manda enseguida. */
export async function encolarAvance(
  item: Omit<AvanceEnCola, "tipo" | "intentos"> & { tipo?: AvanceEnCola["tipo"] },
): Promise<void> {
  await guardar({ ...item, tipo: item.tipo ?? "avance", intentos: 0 })
  avisar()
  void vaciarCola(item.userId)
}

/** Guarda la certificación en el dispositivo y, si hay señal, la manda enseguida. */
export async function encolarCertificacion(item: Omit<CertificacionEnCola, "tipo" | "intentos">): Promise<void> {
  await guardar({ ...item, tipo: "certificacion", intentos: 0 })
  avisar()
  void vaciarCola(item.userId)
}

/** La persona descarta algo que no se pudo enviar (por ejemplo, la tarea ya estaba terminada). */
export async function descartarDeLaCola(id: string): Promise<void> {
  await borrar(id).catch(() => undefined)
  avisar()
}

const yaExiste = (mensaje: string) => /exist|duplicate|already/i.test(mensaje)

async function subirFotos(item: AvanceEnCola): Promise<void> {
  const supabase = createClient()
  const subidas = new Set(item.fotosSubidas ?? [])
  for (const foto of item.fotos) {
    if (subidas.has(foto.id)) continue
    const ruta = buildProgressPhotoStoragePath(item.obraId, item.id, foto.id)
    const { error } = await supabase.storage.from(PROGRESS_PHOTOS_BUCKET).upload(ruta, foto.archivo, {
      cacheControl: "3600",
      contentType: foto.tipo || "image/webp",
      upsert: false,
    })
    // Si ya estaba (un intento anterior la subió y se cortó antes de anotarlo), vale.
    if (error && !yaExiste(error.message)) throw new ErrorDeApi(0, "fotos", `No se pudo subir «${foto.nombre}».`)
    subidas.add(foto.id)
    item.fotosSubidas = [...subidas]
    await guardar(item)
  }
}

async function enviar(item: EscrituraEnCola): Promise<void> {
  const base = `/obras/${item.obraId}`
  if (item.tipo === "certificacion") {
    await enviarALaApi(`${base}/certificaciones`, { hechoEn: item.hechoEn, certificaciones: item.certificaciones })
    return
  }
  if (!item.avanceGuardado) {
    if (item.tipo === "cambio") {
      const tarea = item.tareas[0]!
      await enviarALaApi(`${base}/avances/${item.avanceBaseId}/cambio`, {
        nuevoId: tarea.unidades[0]!.avanceId,
        hechoEn: item.hechoEn,
        estado: tarea.estado,
        comentario: tarea.comentario,
      })
    } else {
      await enviarALaApi(`${base}/avances`, {
        hechoEn: item.hechoEn,
        pisoId: item.pisoId,
        rubroId: item.rubroId,
        tareas: item.tareas,
      })
    }
    item.avanceGuardado = true
    await guardar(item)
  }
  if (item.fotos.length === 0) return
  await subirFotos(item)
  // Cada foto va con todos los avances de su tarea. El id del vínculo sale del avance y la
  // foto, así repetir el envío no lo duplica.
  const adjuntos = item.fotos.flatMap((foto) => {
    const tarea = item.tareas.find((t) => t.tareaId === foto.tareaId)
    return (tarea?.unidades ?? []).map((u) => ({
      id: idDeVinculo(u.avanceId, foto.id),
      avanceId: u.avanceId,
      ruta: buildProgressPhotoStoragePath(item.obraId, item.id, foto.id),
      nombre: foto.nombre,
      tipo: foto.tipo || "image/webp",
      tamano: foto.tamano,
    }))
  })
  if (adjuntos.length > 0) await enviarALaApi(`${base}/adjuntos`, { adjuntos })
}

/** Un uuid fijo a partir de dos (avance + foto): mismo par, mismo id. */
function idDeVinculo(avanceId: string, fotoId: string): string {
  const a = avanceId.replace(/-/g, "")
  const b = fotoId.replace(/-/g, "")
  let hex = ""
  for (let i = 0; i < 32; i++) hex += (parseInt(a[i]!, 16) ^ parseInt(b[(i * 7) % 32]!, 16)).toString(16)
  // Formato de uuid v4 válido (versión 4, variante 10xx).
  const v = `${hex.slice(0, 12)}4${hex.slice(13, 16)}${((parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16)}${hex.slice(17)}`
  return `${v.slice(0, 8)}-${v.slice(8, 12)}-${v.slice(12, 16)}-${v.slice(16, 20)}-${v.slice(20, 32)}`
}

let vaciando: Promise<void> | null = null
let alEnviar: ((item: EscrituraEnCola) => Promise<unknown>) | null = null

/**
 * Qué hacer cuando algo llegó al servidor, antes de sacarlo de la cola: volver a leer
 * las pantallas de esa obra. Así lo enviado no «parpadea» entre la cola y la copia nueva.
 * Lo configura una sola pieza de la app (VaciarColaDeEscrituras).
 */
export function alEnviarDeLaCola(accion: typeof alEnviar) {
  alEnviar = accion
}

/**
 * Manda lo pendiente de la persona, de a uno y en orden. Un solo vaciado a la vez.
 * Devuelve cuando terminó (o se cortó la señal).
 */
export function vaciarCola(userId: string): Promise<void> {
  if (vaciando) return vaciando
  vaciando = (async () => {
    try {
      for (const item of await leerCola(userId)) {
        if (item.error) continue
        if (typeof navigator !== "undefined" && navigator.onLine === false) return
        try {
          await enviar(item)
          await alEnviar?.(item)
          await borrar(item.id)
          avisar()
        } catch (error) {
          const deDatos = error instanceof ErrorDeApi && error.status >= 400 && error.status < 500 && error.status !== 401 && error.status !== 429
          if (deDatos) {
            await guardar({ ...item, error: error.message, intentos: item.intentos + 1 })
            avisar()
            continue
          }
          // Red, sesión o servidor: se reintenta más tarde, sin tocar el orden.
          await guardar({ ...item, intentos: item.intentos + 1 }).catch(() => undefined)
          avisar()
          return
        }
      }
    } finally {
      vaciando = null
    }
  })()
  return vaciando
}
