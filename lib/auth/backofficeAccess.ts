import { redirect } from "next/navigation"

import { requireAuthenticatedUser } from "@/lib/authHelpers"

const BASE_ALLOWED_EMAILS = ["arianfernandez@gmail.com"] as const

function getAllowedEmails(): Set<string> {
  const fromEnv =
    process.env.BACKOFFICE_ALLOWED_EMAILS?.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean) ?? []

  return new Set(
    [...BASE_ALLOWED_EMAILS, ...fromEnv].map((email) => email.toLowerCase()),
  )
}

export function isBackofficeEmail(email: string): boolean {
  return getAllowedEmails().has(email.trim().toLowerCase())
}

export async function requireBackofficeUser() {
  const user = await requireAuthenticatedUser()

  if (!isBackofficeEmail(user.email)) {
    redirect("/home")
  }

  return user
}
