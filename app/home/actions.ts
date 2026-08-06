"use server"

import { isBackofficeEmail } from "@/lib/auth/backofficeAccess"
import { getAuthenticatedUserOrNull } from "@/lib/authHelpers"

export async function getHomeBackofficeAccess(): Promise<boolean> {
  const user = await getAuthenticatedUserOrNull()
  if (!user?.email) return false
  return isBackofficeEmail(user.email)
}
