import type { ProjectAccessContext } from "@/lib/project/projectAccessContext"
import { canAccessUnitProgress } from "@/lib/project/projectAccessContext"
import {
  hasStrictProjectPermission,
  isNavSegmentAllowed,
} from "@/lib/project/projectPermissions"
import { projectHref } from "@/lib/project/routes"

export const TENANT_NAV_SEGMENTS = [
  "trabajo-diario",
  "certificaciones",
  "equipo",
  "clientes",
  "configuracion",
  "portal-clientes",
] as const

export type TenantNavSegment = (typeof TENANT_NAV_SEGMENTS)[number]

export type TenantRoute =
  | { type: "dashboard" }
  | { type: "mi-unidad" }
  | { type: "perfil" }
  | { type: "section"; segment: TenantNavSegment }
  | { type: "unit"; unitId: string }
  | { type: "unknown" }

const NAV_SEGMENT_SET = new Set<string>(TENANT_NAV_SEGMENTS)

function isTenantNavSegment(value: string): value is TenantNavSegment {
  return NAV_SEGMENT_SET.has(value)
}

export function parseTenantSection(section: string[] | undefined): TenantRoute {
  if (!section || section.length === 0) return { type: "dashboard" }
  if (section.length === 1 && section[0] === "perfil") return { type: "perfil" }
  if (section.length === 1 && section[0] === "mi-unidad") return { type: "mi-unidad" }
  if (section.length === 1 && isTenantNavSegment(section[0])) {
    return { type: "section", segment: section[0] }
  }
  if (section.length === 2 && section[0] === "unidades" && section[1]) {
    return { type: "unit", unitId: section[1] }
  }
  return { type: "unknown" }
}

export function tenantRouteFromSegment(segment: string): TenantRoute {
  if (segment === "") return { type: "dashboard" }
  return parseTenantSection([segment])
}

function usesClientHome(context: ProjectAccessContext): boolean {
  if (context.loginAudience === "cliente") return true
  return (
    context.permissions.clientPortal === true &&
    !hasStrictProjectPermission(context.permissions, "viewDashboard")
  )
}

export function fallbackTenantHref(
  context: ProjectAccessContext,
  projectId: string,
): string {
  if (usesClientHome(context)) {
    return projectHref(projectId, "mi-unidad")
  }
  return projectHref(projectId)
}

export function isTenantRouteAllowed(
  context: ProjectAccessContext,
  route: TenantRoute,
): boolean {
  if (route.type === "unknown") return false
  if (route.type === "perfil") return true

  if (context.loginAudience === "cliente") {
    if (route.type === "mi-unidad") return true
    if (route.type === "unit") return canAccessUnitProgress(context, route.unitId)
    return false
  }

  if (route.type === "mi-unidad") {
    return usesClientHome(context)
  }

  if (route.type === "dashboard") {
    return isNavSegmentAllowed(context.permissions, "")
  }

  if (route.type === "section") {
    return isNavSegmentAllowed(context.permissions, route.segment)
  }

  return canAccessUnitProgress(context, route.unitId)
}

export function tenantRouteRedirectHref(
  context: ProjectAccessContext,
  projectId: string,
  route: TenantRoute,
): string | null {
  if (isTenantRouteAllowed(context, route)) return null
  return fallbackTenantHref(context, projectId)
}

export function tenantSegmentFromRoute(route: TenantRoute): string | null {
  if (route.type === "dashboard") return ""
  if (route.type === "mi-unidad") return "mi-unidad"
  if (route.type === "section") return route.segment
  return null
}
