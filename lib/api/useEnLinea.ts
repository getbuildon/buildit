"use client"

import { useSyncExternalStore } from "react"

const escuchar = (alCambiar: () => void) => {
  window.addEventListener("online", alCambiar)
  window.addEventListener("offline", alCambiar)
  return () => {
    window.removeEventListener("online", alCambiar)
    window.removeEventListener("offline", alCambiar)
  }
}

/**
 * ¿Hay señal? Para las pantallas cuyas acciones necesitan conexión (invitar, quitar,
 * cambiar permisos): sin señal se desactivan y se avisa, en vez de fallar al tocar.
 */
export function useEnLinea(): boolean {
  return useSyncExternalStore(
    escuchar,
    () => navigator.onLine,
    () => true,
  )
}

export const AVISO_SIN_SENAL_PARA_CAMBIOS = "Sin conexión. Podés ver la información, pero para hacer cambios necesitás señal."

/** Para las pantallas donde sin señal se puede seguir editando (Configuración, Portal Clientes). */
export const AVISO_SIN_SENAL_PARA_GUARDAR = "Sin conexión. Podés seguir editando, pero para guardar necesitás señal."
