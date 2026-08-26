export const PROJECT_QUERY_ROOT = "project" as const

export const PROJECT_QUERY_STALE_MS = 5 * 60 * 1000

export const PROJECT_QUERY_GC_MS = 2 * 60 * 60 * 1000

export const projectQueryKeys = {
  all: (projectId: string) => [PROJECT_QUERY_ROOT, projectId] as const,
  dashboard: (projectId: string) =>
    [PROJECT_QUERY_ROOT, projectId, "dashboard"] as const,
  trabajoDiario: (projectId: string) =>
    [PROJECT_QUERY_ROOT, projectId, "trabajo-diario"] as const,
  certificaciones: (projectId: string) =>
    [PROJECT_QUERY_ROOT, projectId, "certificaciones"] as const,
  equipo: (projectId: string) => [PROJECT_QUERY_ROOT, projectId, "equipo"] as const,
  clientes: (projectId: string) =>
    [PROJECT_QUERY_ROOT, projectId, "clientes"] as const,
  configuracion: (projectId: string) =>
    [PROJECT_QUERY_ROOT, projectId, "configuracion"] as const,
  portal: (projectId: string) =>
    [PROJECT_QUERY_ROOT, projectId, "portal-clientes"] as const,
  miUnidad: (projectId: string) =>
    [PROJECT_QUERY_ROOT, projectId, "mi-unidad"] as const,
  unit: (projectId: string, unitId: string) =>
    [PROJECT_QUERY_ROOT, projectId, "unit", unitId] as const,
}
