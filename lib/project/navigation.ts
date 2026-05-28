import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  FileCheck2,
  Users,
  UserCircle2,
  Settings,
} from "lucide-react"

export type ProjectNavItem = {
  label: string
  segment: string
  icon: LucideIcon
}

export const PROJECT_NAV_ITEMS: ProjectNavItem[] = [
  { label: "Dashboard", segment: "", icon: LayoutDashboard },
  { label: "Certificaciones", segment: "certificaciones", icon: FileCheck2 },
  { label: "Equipo", segment: "equipo", icon: Users },
  { label: "Clientes", segment: "clientes", icon: UserCircle2 },
  { label: "Configuración", segment: "configuracion", icon: Settings },
]

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
