"use server"

import { createClient } from "@/utils/supabase/server"
import { requireAuthenticatedUser } from "@/lib/authHelpers"

export type ProfileData = {
  first_name: string
  last_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  role_badge: string | null
  role_label: string | null
}

export type UpdateProfileResult = { ok: true } | { ok: false; error: string }

export async function getProfileData(projectId?: string): Promise<ProfileData | null> {
  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, phone, avatar_url")
    .eq("id", user.id)
    .maybeSingle()

  if (error || !data) return null

  let roleBadge: string | null = null
  let roleLabel: string | null = null

  if (projectId) {
    const { data: member } = await supabase
      .from("project_members")
      .select("role_id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle()

    if (member?.role_id) {
      const { data: role } = await supabase
        .from("project_roles")
        .select("label, badge")
        .eq("id", member.role_id)
        .maybeSingle()

      roleBadge = role?.badge ?? null
      roleLabel = role?.label ?? null
    }
  }

  return {
    first_name: data.first_name ?? "",
    last_name: data.last_name ?? "",
    email: data.email ?? "",
    phone: data.phone,
    avatar_url: data.avatar_url,
    role_badge: roleBadge,
    role_label: roleLabel,
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
