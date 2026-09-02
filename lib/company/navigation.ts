import { LayoutGrid, ShieldCheck, Users, type LucideIcon } from "lucide-react"

export type CompanyNavSegment = "informacion" | "miembros" | "suscripciones"

export type CompanyNavItem = {
  label: string
  segment: CompanyNavSegment
  icon: LucideIcon
}

export const COMPANY_NAV_ITEMS: CompanyNavItem[] = [
  { label: "Información", segment: "informacion", icon: LayoutGrid },
  { label: "Miembros", segment: "miembros", icon: Users },
  { label: "Suscripciones", segment: "suscripciones", icon: ShieldCheck },
]

export function companyHref(companyId: string, segment?: CompanyNavSegment): string {
  if (!segment) return `/company/${companyId}/suscripciones`
  if (segment === "miembros") return `/company/${companyId}/members`
  return `/company/${companyId}/${segment}`
}

export function isCompanyNavActive(
  pathname: string,
  companyId: string,
  segment: CompanyNavSegment,
): boolean {
  return pathname === companyHref(companyId, segment)
}
