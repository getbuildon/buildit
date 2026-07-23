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
