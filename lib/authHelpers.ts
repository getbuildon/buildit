"use server"

import { redirect } from "next/navigation"
import { getServerSessionUser } from "@/lib/auth/serverAuth"

export async function requireAuthenticatedUser() {
  const user = await getServerSessionUser()

  if (!user) {
    redirect("/login")
  }

  return user
}

export async function getAuthenticatedUserOrNull() {
  return getServerSessionUser()
}
