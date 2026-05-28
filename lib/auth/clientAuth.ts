"use client"

import {
  buildMockSessionCookie,
  clearMockSessionCookie,
  createMockUser,
  readMockUserFromCookieValue,
  validateMockCredentials,
} from "@/lib/auth/mockSession"
import { MOCK_SESSION_COOKIE } from "@/lib/auth/config"
import type { AppUser, AuthResult } from "@/lib/auth/types"
import { createClient } from "@/utils/supabase/client"
import { isSupabaseConfigured } from "@/lib/auth/config"

export const RECOVERY_PASSWORD_NEXT = "/recovery-password?paso=nueva"

function readMockUserFromDocumentCookie(): AppUser | null {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${MOCK_SESSION_COOKIE}=`))
  const value = match?.slice(MOCK_SESSION_COOKIE.length + 1)
  return readMockUserFromCookieValue(value)
}

function persistMockUser(user: AppUser) {
  document.cookie = buildMockSessionCookie(user)
}

export async function getClientSessionUser(): Promise<AppUser | null> {
  if (isSupabaseConfigured()) {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    if (!user?.email) return null
    return { id: user.id, email: user.email }
  }

  return readMockUserFromDocumentCookie()
}

export async function signInWithPasswordClient(
  email: string,
  password: string,
): Promise<AuthResult> {
  if (isSupabaseConfigured()) {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) {
      const msg = error.message.toLowerCase()
      if (
        msg.includes("invalid login credentials") ||
        msg.includes("invalid credentials") ||
        msg.includes("email not confirmed")
      ) {
        return { error: "Correo electrónico o contraseña incorrectos" }
      }
      return { error: error.message }
    }
    return {}
  }

  if (!validateMockCredentials(email, password)) {
    return { error: "Correo electrónico o contraseña incorrectos" }
  }

  persistMockUser(createMockUser())
  return {}
}

export async function signInWithGoogleClient(): Promise<AuthResult> {
  if (isSupabaseConfigured()) {
    const supabase = createClient()
    const origin = window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=/home`,
      },
    })
    if (error) return { error: error.message }
    return {}
  }

  persistMockUser(createMockUser())
  return {}
}

export async function signUpClient(email: string, password: string): Promise<AuthResult> {
  if (isSupabaseConfigured()) {
    const supabase = createClient()
    const origin = window.location.origin
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/home`,
      },
    })
    if (error) return { error: error.message }
    if (data.session) return {}
    return { needsEmailConfirmation: true }
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres" }
  }

  persistMockUser(createMockUser(email.trim().toLowerCase()))
  return {}
}

export async function signOutClient(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = createClient()
    await supabase.auth.signOut()
    return
  }

  document.cookie = clearMockSessionCookie()
}

export async function requestPasswordResetClient(email: string): Promise<AuthResult> {
  const trimmed = email.trim()
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { error: "Ingresá un correo electrónico válido" }
  }

  if (isSupabaseConfigured()) {
    const supabase = createClient()
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const next = encodeURIComponent(RECOVERY_PASSWORD_NEXT)
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${origin}/auth/callback?next=${next}`,
    })
    if (error) return { error: error.message }
    return { needsEmailConfirmation: true }
  }

  return { needsEmailConfirmation: true }
}

export async function updatePasswordClient(password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { error: "La recuperación de contraseña requiere Supabase configurado." }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  return {}
}
