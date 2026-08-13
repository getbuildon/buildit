import type { ProjectNavIconId } from "@/components/project-shell/ProjectNavIcons"
import {
  isNavSegmentAllowed,
  type ProjectPermissions,
} from "@/lib/project/projectPermissions"

export type ProjectNavItem = {
  label: string
  segment: string
  icon: ProjectNavIconId
}

export const PROJECT_NAV_ITEMS: ProjectNavItem[] = [
  { label: "Dashboard", segment: "", icon: "dashboard" },
  { label: "Mi Unidad", segment: "mi-unidad", icon: "mi-unidad" },
  { label: "Trabajo Diario", segment: "trabajo-diario", icon: "trabajo-diario" },
  { label: "Certificaciones", segment: "certificaciones", icon: "certificaciones" },
  { label: "Equipo", segment: "equipo", icon: "equipo" },
  { label: "Clientes", segment: "clientes", icon: "clientes" },
  { label: "Configuración", segment: "configuracion", icon: "configuracion" },
  { label: "Portal Clientes", segment: "portal-clientes", icon: "portal-clientes" },
]

export function getAllowedProjectNavItems(
  permissions: ProjectPermissions,
): ProjectNavItem[] {
  return PROJECT_NAV_ITEMS.filter((item) => isNavSegmentAllowed(permissions, item.segment))
}

export function isProjectNavActive(
  pathname: string,
  projectId: string,
  segment: string,
): boolean {
  const base = `/${projectId}`
  if (!segment) {
    return pathname === base || pathname === `${base}/`
  }
  return pathname === `${base}/${segment}` || pathname.startsWith(`${base}/${segment}/`)
}
