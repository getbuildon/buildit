"use client"

import { MAIN_ID } from "@/library/layouts/skip-link"
import { parseProjectPath } from "@/lib/project/routes"

/**
 * Navegar dentro de la misma obra sin pedirle nada al servidor de Next.
 *
 * Todas las secciones de la obra (Dashboard, Trabajo diario, Certificaciones, unidades…)
 * se dibujan en el navegador desde un mismo componente (ProjectTenantApp), con sus datos
 * del servidor de datos y la copia del dispositivo. El marco de la obra (layout) se armó
 * al entrar. Cambiar de sección con router.push igual iba al servidor (verificación de
 * sesión + función de Vercel) antes de mostrar nada.
 *
 * history.pushState cambia la dirección y Next actualiza usePathname, así la pantalla
 * cambia al instante. Atrás y adelante del navegador siguen funcionando.
 */
export function esLaMismaObra(desde: string, hacia: string): boolean {
  const a = parseProjectPath(desde.split("?")[0] ?? desde)
  const b = parseProjectPath(hacia.split("?")[0] ?? hacia)
  return a !== null && b !== null && a.projectId === b.projectId
}

export function irDentroDeLaObra(href: string) {
  if (`${window.location.pathname}${window.location.search}` !== href) {
    window.history.pushState(null, "", href)
  }
  // Cada sección arranca arriba, como al navegar normalmente.
  document.getElementById(MAIN_ID)?.scrollTo({ top: 0 })
}
