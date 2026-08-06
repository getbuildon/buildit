import { BACKOFFICE_PLAN_FILTER_SLUGS } from "@/lib/backoffice/proyectosFilters"

export const BACKOFFICE_PROYECTOS_PAGE_SIZE = 20

export type BackofficeProjectStatusKind =
  | "active"
  | "inactive"
  | "expired"
  | "disabled"

const BACKOFFICE_PROJECT_STATUS_KINDS = new Set<string>([
  "active",
  "inactive",
  "expired",
  "disabled",
])

export function parseBackofficeProyectosPage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return parsed
}

export function parseBackofficeProyectosPlanSlugFilters(
  value: string | undefined,
): string[] {
  if (!value?.trim()) return []

  return [
    ...new Set(
      value
        .split(",")
        .map((slug) => slug.trim())
        .filter((slug) => BACKOFFICE_PLAN_FILTER_SLUGS.has(slug)),
    ),
  ]
}

export function parseBackofficeProyectosStatusFilters(
  value: string | undefined,
): BackofficeProjectStatusKind[] {
  if (!value?.trim()) return []

  return [
    ...new Set(
      value
        .split(",")
        .map((status) => status.trim())
        .filter((status): status is BackofficeProjectStatusKind =>
          BACKOFFICE_PROJECT_STATUS_KINDS.has(status),
        ),
    ),
  ]
}

export function serializeBackofficeProyectosPlanSlugFilters(
  planSlugs: string[],
): string | undefined {
  if (planSlugs.length === 0) return undefined
  return planSlugs.join(",")
}

export function serializeBackofficeProyectosStatusFilters(
  statuses: BackofficeProjectStatusKind[],
): string | undefined {
  if (statuses.length === 0) return undefined
  return statuses.join(",")
}

export function hasActiveProyectosFilters(
  planSlugs: string[],
  statuses: BackofficeProjectStatusKind[],
): boolean {
  return planSlugs.length > 0 || statuses.length > 0
}
