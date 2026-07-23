import { LayoutGrid, ShieldCheck, type LucideIcon } from "lucide-react"

export type CompanyNavSegment = "informacion" | "suscripciones"

export type CompanyNavItem = {
  label: string
  segment: CompanyNavSegment
  icon: LucideIcon
}

export const COMPANY_NAV_ITEMS: CompanyNavItem[] = [
  { label: "Información", segment: "informacion", icon: LayoutGrid },
  { label: "Suscripciones", segment: "suscripciones", icon: ShieldCheck },
]

export function companyHref(companyId: string, segment?: CompanyNavSegment): string {
  if (!segment) return `/company/${companyId}/suscripciones`
  return `/company/${companyId}/${segment}`
}

export function isCompanyNavActive(
  pathname: string,
  companyId: string,
  segment: CompanyNavSegment,
): boolean {
  return pathname === companyHref(companyId, segment)
}
