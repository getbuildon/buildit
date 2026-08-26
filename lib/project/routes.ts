import { isReservedProjectRouteSegment } from "@/lib/project/reservedRouteSegments"

export const PROJECT_ROUTE_PREFIX = "/project"

const PROJECT_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type ParsedProjectPath = {
  projectId: string
  rest: string
}

export function isProjectId(value: string): boolean {
  return PROJECT_ID_RE.test(value.trim())
}

function normalizeSegment(segment?: string): string {
  if (!segment) return ""
  return segment.startsWith("/") ? segment.slice(1) : segment
}

function pathWithPrefix(prefix: string, projectId: string, segment?: string): string {
  const id = projectId.trim()
  const rest = normalizeSegment(segment)
  return rest ? `${prefix}/${id}/${rest}` : `${prefix}/${id}`
}

export function projectHref(projectId: string, segment?: string): string {
  return pathWithPrefix(PROJECT_ROUTE_PREFIX, projectId, segment)
}

export function projectDashboardHref(projectId: string): string {
  return projectHref(projectId)
}

function splitPath(pathname: string): string[] {
  return pathname.split("/").filter(Boolean)
}

export function parseProjectPath(pathname: string): ParsedProjectPath | null {
  const parts = splitPath(pathname)
  if (parts[0] !== "project" || !parts[1]) return null
  if (isReservedProjectRouteSegment(parts[1])) return null
  return { projectId: parts[1], rest: parts.slice(2).join("/") }
}

export function parseLegacyProjectPath(pathname: string): ParsedProjectPath | null {
  const parts = splitPath(pathname)
  if (parts.length === 0) return null

  const [projectId, ...restParts] = parts
  if (projectId === "project") return null
  if (isReservedProjectRouteSegment(projectId)) return null
  if (!isProjectId(projectId)) return null

  return { projectId, rest: restParts.join("/") }
}

export function legacyProjectRedirectPath(pathname: string): string | null {
  const parsed = parseLegacyProjectPath(pathname)
  if (!parsed) return null
  return projectHref(parsed.projectId, parsed.rest || undefined)
}

export function isProjectDashboardPath(pathname: string): boolean {
  const parsed = parseProjectPath(pathname)
  return parsed !== null && parsed.rest === ""
}
