export const BACKOFFICE_PROYECTOS_PAGE_SIZE = 20

export type BackofficeProjectsPlanFilter =
  | "all"
  | "compacto"
  | "gran-escala"
  | "multiobra"

export type BackofficeProjectsStatusFilter = "all" | "active" | "inactive"

export function parseBackofficeProyectosPage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return parsed
}

export function parseBackofficeProyectosPlanFilter(
  value: string | undefined,
): BackofficeProjectsPlanFilter {
  if (value === "compacto" || value === "gran-escala" || value === "multiobra") {
    return value
  }
  return "all"
}

export function parseBackofficeProyectosStatusFilter(
  value: string | undefined,
): BackofficeProjectsStatusFilter {
  if (value === "active" || value === "inactive") return value
  return "all"
}
