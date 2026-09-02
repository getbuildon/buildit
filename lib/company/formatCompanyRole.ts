export const COMPANY_ROLES = ["owner", "admin", "billing", "member"] as const

export type CompanyRole = (typeof COMPANY_ROLES)[number]

const ROLE_LABELS: Record<CompanyRole, string> = {
  owner: "Owner",
  admin: "Admin",
  billing: "Billing",
  member: "Miembro",
}

export function formatCompanyRole(role: string): string {
  const normalized = role.trim().toLowerCase()
  return ROLE_LABELS[normalized as CompanyRole] ?? role.charAt(0).toUpperCase() + role.slice(1)
}
