export const BACKOFFICE_CLIENTES_PAGE_SIZE = 20

export function parseBackofficeClientesPage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return parsed
}
