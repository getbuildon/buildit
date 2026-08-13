export const MAX_TOTAL_SURFACE_DIGITS = 8

export function extractTotalSurfaceDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, MAX_TOTAL_SURFACE_DIGITS)
}

export function formatTotalSurfaceDigits(digits: string): string {
  if (!digits) return ""
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

export function normalizeTotalSurfaceInput(raw: string): string {
  return formatTotalSurfaceDigits(extractTotalSurfaceDigits(raw))
}

export function hasTotalSurfaceValue(value: string): boolean {
  return extractTotalSurfaceDigits(value).length > 0
}

export function formatTotalSurfaceFromNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return ""
  const digits = Math.trunc(value).toString().slice(0, MAX_TOTAL_SURFACE_DIGITS)
  return formatTotalSurfaceDigits(digits)
}
