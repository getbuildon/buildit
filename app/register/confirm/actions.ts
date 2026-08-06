"use server"

import { requireAuthenticatedUser } from "@/lib/authHelpers"
import { createClient } from "@/utils/supabase/server"

export type CompleteRegisterSetupResult =
  | { ok: true }
  | { ok: false; error: string }

export async function completeRegisterSetup(
  password: string,
): Promise<CompleteRegisterSetupResult> {
  await requireAuthenticatedUser()

  const trimmed = password.trim()
  if (trimmed.length < 8) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: trimmed,
    data: { password_setup_required: false },
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
