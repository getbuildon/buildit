export const RESERVED_PROJECT_ROUTE_SEGMENTS = new Set([
  "admin",
  "api",
  "auth",
  "backoffice",
  "company",
  "dashboard",
  "home",
  "invite",
  "login",
  "perfil",
  "projects",
  "recovery-password",
  "register",
])

export function isReservedProjectRouteSegment(segment: string): boolean {
  return RESERVED_PROJECT_ROUTE_SEGMENTS.has(segment.trim().toLowerCase())
}
