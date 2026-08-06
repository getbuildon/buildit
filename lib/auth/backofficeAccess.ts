import { redirect } from "next/navigation"

import { requireAuthenticatedUser } from "@/lib/authHelpers"

let cachedAllowedEmails: Set<string> | null = null

function parseBackofficeAllowedEmails(raw: string | undefined): string[] {
  if (!raw?.trim()) return []

  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

function getAllowedEmails(): Set<string> {
  if (cachedAllowedEmails) return cachedAllowedEmails

  cachedAllowedEmails = new Set(parseBackofficeAllowedEmails(process.env.BACKOFFICE_ALLOWED_EMAILS))
  return cachedAllowedEmails
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
