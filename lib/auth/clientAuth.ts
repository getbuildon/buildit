"use client"

import type { AppUser, AuthResult } from "@/lib/auth/types"
import { createClient } from "@/utils/supabase/client"

export const RECOVERY_PASSWORD_NEXT = "/recovery-password?paso=nueva"

export async function getClientSessionUser(): Promise<AppUser | null> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user
  if (!user?.email) return null
  return { id: user.id, email: user.email }
}

export async function signInWithPasswordClient(
  email: string,
  password: string,
): Promise<AuthResult> {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes("email not confirmed")) {
      return {
        error: "Confirmá tu correo antes de ingresar. Revisá tu bandeja de entrada.",
      }
    }
    if (
      msg.includes("invalid login credentials") ||
      msg.includes("invalid credentials")
    ) {
      return { error: "Correo electrónico o contraseña incorrectos" }
    }
    return { error: error.message }
  }
  return {}
}

export async function signInWithGoogleClient(): Promise<AuthResult> {
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

export async function signUpClient(email: string, password: string): Promise<AuthResult> {
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

export async function signOutClient(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
}

export async function requestPasswordResetClient(email: string): Promise<AuthResult> {
  const trimmed = email.trim()
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { error: "Ingresá un correo electrónico válido" }
  }

  const supabase = createClient()
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const next = encodeURIComponent(RECOVERY_PASSWORD_NEXT)
  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: `${origin}/auth/callback?next=${next}`,
  })
  if (error) return { error: error.message }
  return { needsEmailConfirmation: true }
}

export async function updatePasswordClient(password: string): Promise<AuthResult> {
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  return {}
}
