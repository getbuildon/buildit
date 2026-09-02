import type { SupabaseClient } from "@supabase/supabase-js"

export type ExistingProfile = {
  id: string
  email: string
  first_name: string
  last_name: string
}

export async function findProfileByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<ExistingProfile | null> {
  const normalized = email.trim().toLowerCase()
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, first_name, last_name")
    .eq("email", normalized)
    .maybeSingle()

  if (error || !data) return null
  return data
}
