"use server"

import { createClient } from "@/utils/supabase/server"
import { getAuthenticatedUserOrNull } from "@/lib/authHelpers"

export async function getProfileName(): Promise<string | null> {
  const user = await getAuthenticatedUserOrNull()
  if (!user) return null

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .maybeSingle()

  if (error || !data) return null

  const firstName = data.first_name?.trim()
  const lastName = data.last_name?.trim()

  if (firstName && lastName) {
    return `${firstName} ${lastName}`
  }

  return null
}
