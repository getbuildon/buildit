"use server"

import { redirect } from "next/navigation"
import { loginPathForAudience } from "@/lib/auth/loginAudience"
import { getLoginAudience } from "@/lib/auth/loginAudienceActions"
import { getServerSessionUser } from "@/lib/auth/serverAuth"

export async function requireAuthenticatedUser() {
  const user = await getServerSessionUser()

  if (!user) {
    const audience = await getLoginAudience()
    redirect(loginPathForAudience(audience ?? "equipo"))
  }

  return user
}

export async function getAuthenticatedUserOrNull() {
  return getServerSessionUser()
}
