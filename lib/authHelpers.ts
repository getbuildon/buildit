"use server"

import { getServerSessionUser } from "@/lib/auth/serverAuth"

export async function requireAuthenticatedUser() {
  const user = await getServerSessionUser()

  if (!user) {
    throw new Error("Unauthorized: No authenticated user")
  }

  return user
}

export async function getAuthenticatedUserOrNull() {
  return getServerSessionUser()
}
