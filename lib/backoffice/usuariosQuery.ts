export const BACKOFFICE_USERS_PAGE_SIZE = 20

export type BackofficeUsersStatusKind = "active" | "inactive"

const BACKOFFICE_USERS_STATUS_KINDS = new Set<string>(["active", "inactive"])

export function parseBackofficeUsersPage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return parsed
}

export function parseBackofficeUsersStatusFilters(
  value: string | undefined,
): BackofficeUsersStatusKind[] {
  if (!value?.trim()) return []

  return [
    ...new Set(
      value
        .split(",")
        .map((status) => status.trim())
        .filter((status): status is BackofficeUsersStatusKind =>
          BACKOFFICE_USERS_STATUS_KINDS.has(status),
        ),
    ),
  ]
}

export function serializeBackofficeUsersStatusFilters(
  statuses: BackofficeUsersStatusKind[],
): string | undefined {
  if (statuses.length === 0) return undefined
  return statuses.join(",")
}

export function hasActiveUsuariosFilters(
  statuses: BackofficeUsersStatusKind[],
): boolean {
  return statuses.length > 0
}

export function resolveBackofficeUsersStatusFilter(
  statuses: BackofficeUsersStatusKind[],
): "all" | "active" | "inactive" {
  const hasActive = statuses.includes("active")
  const hasInactive = statuses.includes("inactive")

  if (hasActive && !hasInactive) return "active"
  if (hasInactive && !hasActive) return "inactive"
  return "all"
}
