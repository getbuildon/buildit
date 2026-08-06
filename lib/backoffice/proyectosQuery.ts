export const BACKOFFICE_PROYECTOS_PAGE_SIZE = 20

export function parseBackofficeProyectosPage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return parsed
}
