const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Miembro",
}

export function formatCompanyRole(role: string): string {
  const normalized = role.trim().toLowerCase()
  return ROLE_LABELS[normalized] ?? role.charAt(0).toUpperCase() + role.slice(1)
}
