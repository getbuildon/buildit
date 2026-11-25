"use client"

import { mapAuthError, withAuthTimeout } from "@/lib/auth/mapAuthError"
import type { AppUser, AuthResult } from "@/lib/auth/types"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { resolveClientSupabaseConfig } from "@/lib/auth/clientSupabaseConfig"
import { olvidarSesion, recordarSesion, sesionRecordada } from "@/lib/auth/sesionRecordada"
import { createClient } from "@/utils/supabase/client"

export const RECOVERY_PASSWORD_NEXT = "/recovery-password?paso=nueva"

function userFromSession(session: { user: { id: string; email?: string | null } } | null): AppUser | null {
  const email = session?.user.email
  if (!email) return null
  return { id: session.user.id, email }
}

export async function getClientSessionUser(): Promise<AppUser | null> {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await withAuthTimeout(supabase.auth.getUser())
  if (error) return null
  return userFromSession(user ? { user } : null)
}

function sinSenal(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false
}

/** El error fue por no llegar al servidor (no porque la sesión no valga). */
function esFallaDeRed(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const { name, message, status } = error as { name?: string; message?: string; status?: number }
  if (name === "AuthRetryableFetchError") return true
  if (typeof status === "number" && status >= 500) return true
  const texto = (message ?? "").toLowerCase()
  return (
    texto.includes("failed to fetch") ||
    texto.includes("networkerror") ||
    texto.includes("load failed") ||
    texto.includes("fetch failed") ||
    texto.includes("no respondió a tiempo")
  )
}

/**
 * La persona de la sesión guardada en el dispositivo, sin viajar si no hace falta.
 * Es lo que usa la app para decidir si muestra las pantallas con sesión:
 *  - con señal: la sesión guardada (se renueva sola si venció);
 *  - sin señal o si el servidor de sesiones no contesta: la última persona que entró,
 *    para que la app abra con lo guardado. El servidor valida igual cada pedido.
 */
export async function getDeviceSessionUser(): Promise<AppUser | null> {
  const recordada = sesionRecordada()
  if (sinSenal() && recordada) return recordada

  try {
    const supabase = createClient()
    const { data, error } = await withAuthTimeout(supabase.auth.getSession(), 8000)
    const user = userFromSession(data.session)
    if (user) {
      recordarSesion(user)
      return user
    }
    if (error && esFallaDeRed(error)) return recordada
    olvidarSesion()
    return null
  } catch (error) {
    return esFallaDeRed(error) || sinSenal() ? recordada : null
  }
}

export async function signInWithPasswordClient(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const supabase = createClient()
    const { data, error } = await withAuthTimeout(
      supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      }),
    )
    if (error) {
      return { error: mapAuthError(error, "Error al iniciar sesión") }
    }
    if (!data.session?.user?.email) {
      return { error: "No pudimos iniciar sesión. Intentá de nuevo." }
    }
    return { signedIn: true }
  } catch (err) {
    return { error: mapAuthError(err, "Error al iniciar sesión") }
  }
}

export async function signInWithGoogleClient(): Promise<AuthResult> {
  try {
    const supabase = createClient()
    const origin = window.location.origin
    const { error } = await withAuthTimeout(
      supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=/home`,
        },
      }),
    )
    if (error) return { error: mapAuthError(error, "Error al iniciar sesión con Google") }
    return {}
  } catch (err) {
    return { error: mapAuthError(err, "Error al iniciar sesión con Google") }
  }
}

export async function signUpClient(email: string, password: string): Promise<AuthResult> {
  try {
    const supabase = createClient()
    const origin = window.location.origin
    const trimmedEmail = email.trim()
    const { data, error } = await withAuthTimeout(
      supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=/home`,
        },
      }),
    )
    if (error) return { error: mapAuthError(error, "Error al registrarse") }

    const identities = data.user?.identities ?? []
    if (identities.length === 0) {
      return {
        error: "Ya existe una cuenta con ese correo. Probá iniciar sesión o recuperar tu contraseña.",
      }
    }

    if (data.session?.user?.email) {
      return { signedIn: true }
    }

    return { needsEmailConfirmation: true }
  } catch (err) {
    return { error: mapAuthError(err, "Error al registrarse") }
  }
}

export async function signOutClient(): Promise<void> {
  const supabase = createClient()
  olvidarSesion()
  await withAuthTimeout(supabase.auth.signOut())
}

export async function requestPasswordResetClient(email: string): Promise<AuthResult> {
  const trimmed = email.trim()
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { error: "Ingresá un correo electrónico válido" }
  }

  try {
    const supabase = createClient()
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const next = encodeURIComponent(RECOVERY_PASSWORD_NEXT)
    const { error } = await withAuthTimeout(
      supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${origin}/auth/callback?next=${next}`,
      }),
    )
    if (error) return { error: mapAuthError(error, "Error al enviar el correo de recuperación") }
    return { needsEmailConfirmation: true }
  } catch (err) {
    return { error: mapAuthError(err, "Error al enviar el correo de recuperación") }
  }
}

/**
 * Comprueba la contraseña actual sin tocar la sesión abierta: usa un cliente
 * aparte que no guarda nada en el navegador. No se llama a signOut porque por
 * defecto cerraría todas las sesiones del usuario.
 */
export async function verifyCurrentPasswordClient(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const config = resolveClientSupabaseConfig()
    if (!config) return { error: "Supabase no está configurado" }
    const verifier = createSupabaseClient(config.url, config.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
    const { error } = await withAuthTimeout(
      verifier.auth.signInWithPassword({ email: email.trim(), password }),
    )
    if (error) {
      if (error.code === "invalid_credentials" || /invalid login credentials/i.test(error.message)) {
        return { error: "La contraseña actual no es correcta." }
      }
      return { error: mapAuthError(error, "No pudimos verificar tu contraseña actual") }
    }
    return {}
  } catch (err) {
    return { error: mapAuthError(err, "No pudimos verificar tu contraseña actual") }
  }
}

export async function updatePasswordClient(password: string): Promise<AuthResult> {
  try {
    const supabase = createClient()
    const { error } = await withAuthTimeout(supabase.auth.updateUser({ password }))
    if (error) return { error: mapAuthError(error, "Error al actualizar la contraseña") }
    return {}
  } catch (err) {
    return { error: mapAuthError(err, "Error al actualizar la contraseña") }
  }
}

export async function updateEmailClient(email: string): Promise<AuthResult> {
  try {
    const supabase = createClient()
    const { error } = await withAuthTimeout(supabase.auth.updateUser({ email: email.trim() }))
    if (error) return { error: mapAuthError(error, "Error al actualizar el correo") }
    return { needsEmailConfirmation: true }
  } catch (err) {
    return { error: mapAuthError(err, "Error al actualizar el correo") }
  }
}
