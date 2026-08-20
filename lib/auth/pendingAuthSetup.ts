import { REGISTER_CONFIRM_PATH } from "@/lib/auth/registerConfirmPath"

export function buildInviteSetupPath(invitationId: string): string {
  return `/invite/setup?invitation=${encodeURIComponent(invitationId)}`
}

export function readInvitationIdFromMetadata(
  userMetadata: Record<string, unknown> | undefined,
): string | null {
  const invitationId = userMetadata?.invitation_id
  if (typeof invitationId !== "string") return null
  const trimmed = invitationId.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function userNeedsPasswordSetup(
  userMetadata: Record<string, unknown> | undefined,
): boolean {
  if (!userMetadata) return false
  if (readInvitationIdFromMetadata(userMetadata)) return false
  return userMetadata.password_setup_required === true
}

export function resolvePendingAuthSetupPath(
  userMetadata: Record<string, unknown> | undefined,
): string | null {
  const invitationId = readInvitationIdFromMetadata(userMetadata)
  if (invitationId) {
    return buildInviteSetupPath(invitationId)
  }

  if (userNeedsPasswordSetup(userMetadata)) {
    return REGISTER_CONFIRM_PATH
  }

  return null
}

export const AUTH_SETUP_ALLOWED_PATH_PREFIXES = [
  REGISTER_CONFIRM_PATH,
  "/login",
  "/acceso-equipo",
  "/acceso-clientes",
  "/register",
  "/auth/",
  "/invite/setup",
  "/recovery-password",
] as const

export function isAuthSetupAllowedPath(pathname: string): boolean {
  return AUTH_SETUP_ALLOWED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}
