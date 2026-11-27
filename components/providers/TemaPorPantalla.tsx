"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { forzarClaro } from "@/lib/tema"

/**
 * Pantallas que ya pasaron a la librería BuildOn: ahí se respeta el modo claro u oscuro
 * elegido. Todas las demás tienen colores fijos de modo claro y se ven en claro (si no,
 * las piezas nuevas que llevan adentro se pondrían oscuras sobre un fondo blanco).
 * Al migrar una pantalla se suma acá.
 */
const MIGRADAS: RegExp[] = [
  /^\/home\/?$/,
  /^\/acceso-(equipo|clientes)\/?$/,
  /^\/recovery-password\/?$/,
  /^\/perfil\/?$/,
  // La obra: el resumen y las secciones ya migradas.
  /^\/project\/[^/]+\/?$/,
  /^\/project\/[^/]+\/(trabajo-diario|certificaciones|unidades|equipo|clientes|configuracion|mi-unidad|perfil|portal-clientes)(\/|$)/,
]

export function TemaPorPantalla() {
  const pathname = usePathname()
  const migrada = MIGRADAS.some((patron) => patron.test(pathname))
  useEffect(() => {
    forzarClaro(!migrada)
  }, [migrada])
  return null
}
