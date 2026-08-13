"use server"

import { requireAuthenticatedUser } from "@/lib/authHelpers"
import { getPasswordStrengthError, mapPasswordPolicyError } from "@/lib/auth/passwordValidation"
import { createClient } from "@/utils/supabase/server"

export type CompleteRegisterSetupResult =
  | { ok: true }
  | { ok: false; error: string }

export async function completeRegisterSetup(
  password: string,
): Promise<CompleteRegisterSetupResult> {
  await requireAuthenticatedUser()

  const trimmed = password.trim()
  const strengthError = getPasswordStrengthError(trimmed)
  if (strengthError) {
    return { ok: false, error: strengthError }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: trimmed,
    data: { password_setup_required: false },
  })

  if (error) {
    return {
      ok: false,
      error: mapPasswordPolicyError(error.message) ?? "No pudimos guardar la contraseña. Intentá de nuevo.",
    }
  }

  return { ok: true }
}
