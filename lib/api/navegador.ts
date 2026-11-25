"use client"

import { createClient } from "@/utils/supabase/client"

/**
 * Cliente del servidor de datos (Worker de Cloudflare, repo getbuildon/buildon-api).
 * Las lecturas y escrituras con sesión van directo ahí con el token de la persona;
 * el Worker lee la base con ese token, así que aplica la RLS por rol.
 *
 * La dirección sale de NEXT_PUBLIC_API_URL. Si no está definida (hoy: producción),
 * `apiDisponible()` da false y cada pantalla sigue con su camino anterior.
 */
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "")

/** Cuánto se espera una respuesta antes de darla por perdida. */
const CORTE_MS = 12_000

export function apiDisponible(): boolean {
  return API_URL.length > 0
}

export class ErrorDeApi extends Error {
  constructor(
    /** 0 = no hubo respuesta (sin señal, corte por tiempo). */
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = "ErrorDeApi"
  }

  /** No llegó al servidor o el servidor no pudo: vale la copia del dispositivo y reintentar. */
  get esDeRed(): boolean {
    return this.status === 0 || this.status >= 500
  }
}

const SIN_SENAL = new ErrorDeApi(0, "red", "No pudimos conectarnos. Revisá tu conexión.")

async function tokenDeLaSesion(): Promise<string> {
  // Sin señal no se puede renovar el token y supabase reintenta ~30 s: se corta acá.
  if (typeof navigator !== "undefined" && navigator.onLine === false) throw SIN_SENAL
  // getSession lee la sesión guardada (y la renueva si venció): no viaja si no hace falta.
  const resultado = await Promise.race([
    createClient().auth.getSession(),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 8_000)),
  ])
  if (!resultado) throw SIN_SENAL
  const token = resultado.data.session?.access_token
  if (token) return token
  if (resultado.error?.name === "AuthRetryableFetchError") throw SIN_SENAL
  throw new ErrorDeApi(401, "sin_sesion", "Tu sesión venció. Volvé a iniciar sesión.")
}

export async function pedirALaApi<T>(ruta: string, opciones: { signal?: AbortSignal } = {}): Promise<T> {
  if (!apiDisponible()) throw new ErrorDeApi(0, "sin_api", "El servidor de datos no está configurado.")
  const corte = new AbortController()
  const reloj = setTimeout(() => corte.abort(), CORTE_MS)
  const alCancelar = () => corte.abort()
  opciones.signal?.addEventListener("abort", alCancelar)

  let respuesta: Response
  try {
    const token = await tokenDeLaSesion()
    respuesta = await fetch(`${API_URL}${ruta}`, {
      headers: { authorization: `Bearer ${token}` },
      signal: corte.signal,
      cache: "no-store",
    })
  } catch (error) {
    if (error instanceof ErrorDeApi) throw error
    throw SIN_SENAL
  } finally {
    clearTimeout(reloj)
    opciones.signal?.removeEventListener("abort", alCancelar)
  }

  const cuerpo = (await respuesta.json().catch(() => null)) as
    | (T & { code?: string; message?: string })
    | null
  if (!respuesta.ok) {
    throw new ErrorDeApi(
      respuesta.status,
      cuerpo?.code ?? "error",
      cuerpo?.message ?? "Algo salió mal. Probá de nuevo.",
    )
  }
  if (cuerpo == null) throw new ErrorDeApi(502, "respuesta", "Algo salió mal. Probá de nuevo.")
  return cuerpo
}
