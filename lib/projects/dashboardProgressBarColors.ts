/** Colores de barra de progreso del dashboard (Figma: Neutral / Brand / Success). */
export const DASHBOARD_PROGRESS_BAR_COLORS = {
  neutral900: "#212225",
  brand400: "#ffd7c2",
  brand600: "#ff9650",
  brand700: "#ff7433",
  brand800: "#d04c00",
  success800: "#29a383",
} as const

/** Track de fondo compartido por todas las barras. */
export const DASHBOARD_PROGRESS_TRACK_COLOR = "#e5e7eb"

/**
 * Progresión Neutral para barras de unidades en el dashboard (Figma 1061:548).
 * A mayor avance, tono más oscuro.
 */
export const UNIT_BLOCK_PROGRESS_BAR_COLORS = {
  complete: "#363a3f",
  high: "#43484e",
  mediumHigh: "#5a6169",
  medium: "#696e77",
  low: "#777b84",
  minimal: "#afb3ba",
} as const

/**
 * Devuelve el color de relleno según el porcentaje de avance.
 * 0–10% Neutral 900 · 10–25% Brand 400 · 25–50% Brand 600
 * 50–75% Brand 700 · 75–99% Brand 800 · 100% Success 800
 */
export function getDashboardProgressBarColor(percent: number): string {
  const value = Math.max(0, Math.min(100, Math.round(percent)))

  if (value === 100) return DASHBOARD_PROGRESS_BAR_COLORS.success800
  if (value > 75) return DASHBOARD_PROGRESS_BAR_COLORS.brand800
  if (value > 50) return DASHBOARD_PROGRESS_BAR_COLORS.brand700
  if (value > 25) return DASHBOARD_PROGRESS_BAR_COLORS.brand600
  if (value > 10) return DASHBOARD_PROGRESS_BAR_COLORS.brand400
  return DASHBOARD_PROGRESS_BAR_COLORS.neutral900
}

/** Color de barra para tarjetas de unidad (bloques del dashboard). */
export function getUnitBlockProgressBarColor(percent: number): string {
  const value = Math.max(0, Math.min(100, Math.round(percent)))

  if (value === 100) return UNIT_BLOCK_PROGRESS_BAR_COLORS.complete
  if (value >= 90) return UNIT_BLOCK_PROGRESS_BAR_COLORS.high
  if (value >= 70) return UNIT_BLOCK_PROGRESS_BAR_COLORS.mediumHigh
  if (value >= 45) return UNIT_BLOCK_PROGRESS_BAR_COLORS.medium
  if (value >= 20) return UNIT_BLOCK_PROGRESS_BAR_COLORS.low
  return UNIT_BLOCK_PROGRESS_BAR_COLORS.minimal
}
