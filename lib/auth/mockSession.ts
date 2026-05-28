import {
  MOCK_AUTH_EMAIL,
  MOCK_AUTH_PASSWORD,
  MOCK_AUTH_USER_ID,
  MOCK_SESSION_COOKIE,
} from "@/lib/auth/config"
import type { AppUser } from "@/lib/auth/types"

type MockSessionPayload = {
  id: string
  email: string
}

function encodePayload(user: MockSessionPayload): string {
  return encodeURIComponent(JSON.stringify(user))
}

function decodePayload(raw: string | undefined): AppUser | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as MockSessionPayload
    if (!parsed.id || !parsed.email) return null
    return { id: parsed.id, email: parsed.email }
  } catch {
    return null
  }
}

export function createMockUser(email = MOCK_AUTH_EMAIL): AppUser {
  return {
    id: MOCK_AUTH_USER_ID,
    email,
  }
}

export function readMockUserFromCookieValue(cookieValue: string | undefined): AppUser | null {
  return decodePayload(cookieValue)
}

export function buildMockSessionCookie(user: AppUser): string {
  const maxAge = 60 * 60 * 24 * 7
  const secure = typeof window !== "undefined" && window.location.protocol === "https:"
  const parts = [
    `${MOCK_SESSION_COOKIE}=${encodePayload(user)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
  ]
  if (secure) parts.push("Secure")
  return parts.join("; ")
}

export function clearMockSessionCookie(): string {
  return `${MOCK_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
}

export function validateMockCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === MOCK_AUTH_EMAIL &&
    password === MOCK_AUTH_PASSWORD
  )
}
