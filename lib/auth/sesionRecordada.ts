"use client"

import type { AppUser } from "@/lib/auth/types"

/**
 * Quién fue la última persona que inició sesión en este dispositivo.
 * Sirve solo para que la app abra sin señal: sin internet no se puede renovar la
 * sesión, pero la persona sigue siendo la misma y ve lo que quedó guardado.
 * No da acceso a nada: cada lectura y escritura la valida el servidor con el token.
 * Se borra al cerrar sesión o cuando el servidor dice que la sesión ya no vale.
 */
const CLAVE = "buildon:sesion-recordada"

export function recordarSesion(user: AppUser): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ id: user.id, email: user.email }))
  } catch {
    /* sin almacenamiento: sin señal pedirá iniciar sesión */
  }
}

export function sesionRecordada(): AppUser | null {
  try {
    const valor = JSON.parse(localStorage.getItem(CLAVE) ?? "null") as Partial<AppUser> | null
    return valor && typeof valor.id === "string" && typeof valor.email === "string"
      ? { id: valor.id, email: valor.email }
      : null
  } catch {
    return null
  }
}

export function olvidarSesion(): void {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    /* nada que borrar */
  }
}
