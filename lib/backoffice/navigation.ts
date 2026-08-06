import {
  Building2,
  FolderKanban,
  LayoutDashboard,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react"

export type BackofficeNavSegment =
  | "dashboard"
  | "clientes"
  | "usuarios"
  | "empresas"
  | "proyectos"

export type BackofficeNavItem = {
  segment: BackofficeNavSegment
  label: string
  icon: LucideIcon
}

export const BACKOFFICE_NAV_ITEMS: BackofficeNavItem[] = [
  { segment: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { segment: "clientes", label: "Clientes", icon: Users },
  { segment: "usuarios", label: "Usuarios", icon: UserRound },
  { segment: "empresas", label: "Empresas", icon: Building2 },
  { segment: "proyectos", label: "Proyectos", icon: FolderKanban },
]

export function backofficeHref(segment: BackofficeNavSegment) {
  return `/backoffice/${segment}`
}

export function isBackofficeNavActive(
  pathname: string,
  segment: BackofficeNavSegment,
) {
  const href = backofficeHref(segment)
  return pathname === href || pathname.startsWith(`${href}/`)
}
