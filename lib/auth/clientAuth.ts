"use client"

import { mapAuthError, withAuthTimeout } from "@/lib/auth/mapAuthError"
import type { AppUser, AuthResult } from "@/lib/auth/types"
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
