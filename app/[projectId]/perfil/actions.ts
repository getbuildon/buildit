"use server"

import { createClient } from "@/utils/supabase/server"
import { requireAuthenticatedUser } from "@/lib/authHelpers"

export type ProfileData = {
  first_name: string
  last_name: string
  email: string
  phone: string | null
  avatar_url: string | null
}

export type UpdateProfileResult = { ok: true } | { ok: false; error: string }

export async function getProfileData(): Promise<ProfileData | null> {
  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, phone, avatar_url")
    .eq("id", user.id)
    .maybeSingle()

  if (error || !data) return null

  return {
    first_name: data.first_name ?? "",
    last_name: data.last_name ?? "",
    email: data.email ?? "",
    phone: data.phone,
    avatar_url: data.avatar_url,
  }
}

export async function updateProfileData(
  firstName: string,
  lastName: string,
  phone: string | null,
): Promise<UpdateProfileResult> {
  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

  const trimmedFirst = firstName.trim()
  const trimmedLast = lastName.trim()
  const trimmedPhone = phone?.trim() || null

  if (!trimmedFirst || !trimmedLast) {
    return { ok: false, error: "El nombre y apellido son obligatorios." }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: trimmedFirst,
      last_name: trimmedLast,
      phone: trimmedPhone,
    })
    .eq("id", user.id)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
