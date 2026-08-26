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

export function parseBackofficeSection(
  section: string[] | undefined,
): BackofficeNavSegment | "index" | "unknown" {
  if (!section || section.length === 0) return "index"
  if (section.length === 1) {
    const [segment] = section
    if (BACKOFFICE_NAV_ITEMS.some((item) => item.segment === segment)) {
      return segment as BackofficeNavSegment
    }
  }
  return "unknown"
}

export function parseBackofficePath(
  href: string,
): BackofficeNavSegment | "index" | "unknown" {
  const path = href.split("?")[0] ?? href
  const normalized =
    path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path

  if (normalized === "/backoffice") return "index"
  if (!normalized.startsWith("/backoffice/")) return "unknown"

  const rest = normalized.slice("/backoffice/".length)
  return parseBackofficeSection(rest.split("/").filter(Boolean))
}

export function isBackofficeNavActive(
  pathname: string,
  segment: BackofficeNavSegment,
) {
  const href = backofficeHref(segment)
  return pathname === href || pathname.startsWith(`${href}/`)
}
