export const BACKOFFICE_USERS_PAGE_SIZE = 20

export type BackofficeUsersStatusFilter = "all" | "active" | "inactive"

export function parseBackofficeUsersStatusFilter(
  value: string | undefined,
): BackofficeUsersStatusFilter {
  if (value === "active" || value === "inactive") return value
  return "all"
}

export function parseBackofficeUsersPage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return parsed
}
