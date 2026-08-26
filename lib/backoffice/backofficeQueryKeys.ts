export const BACKOFFICE_QUERY_ROOT = "backoffice" as const

export const BACKOFFICE_QUERY_STALE_MS = 5 * 60 * 1000

export const BACKOFFICE_QUERY_GC_MS = 2 * 60 * 60 * 1000

export type BackofficeDashboardQueryParams = {
  period?: string
  from?: string
  to?: string
  comparePeriod?: string
  compareFrom?: string
  compareTo?: string
}

export type BackofficeProyectosQueryParams = {
  page: number
  search: string
  planSlugs: string[]
  statuses: string[]
}

export type BackofficeListQueryParams = {
  page: number
  search: string
}

export type BackofficeUsuariosQueryParams = BackofficeListQueryParams & {
  statuses: string[]
}

export const backofficeQueryKeys = {
  all: [BACKOFFICE_QUERY_ROOT] as const,
  dashboard: (params: BackofficeDashboardQueryParams) =>
    [BACKOFFICE_QUERY_ROOT, "dashboard", params] as const,
  clientes: (params: BackofficeListQueryParams) =>
    [BACKOFFICE_QUERY_ROOT, "clientes", params] as const,
  usuarios: (params: BackofficeUsuariosQueryParams) =>
    [BACKOFFICE_QUERY_ROOT, "usuarios", params] as const,
  empresas: (params: BackofficeListQueryParams) =>
    [BACKOFFICE_QUERY_ROOT, "empresas", params] as const,
  proyectos: (params: BackofficeProyectosQueryParams) =>
    [BACKOFFICE_QUERY_ROOT, "proyectos", params] as const,
}
