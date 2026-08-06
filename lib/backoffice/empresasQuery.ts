export const BACKOFFICE_EMPRESAS_PAGE_SIZE = 20

export function parseBackofficeEmpresasPage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return parsed
}
