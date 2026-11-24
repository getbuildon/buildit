import { useSyncExternalStore } from "react"
import type { TagTone } from "../../atoms/tag/Tag"

/**
 * Colores de los gráficos. Son los tonos de la librería en su versión sólida: todos
 * pasan 3:1 contra la superficie en claro y en oscuro (lo que pide WCAG para gráficos).
 * El naranja de marca puro no se usa para barras: da 2,6:1 contra el blanco.
 *
 * Se pasan como var(): el SVG los resuelve solo y cambian con el modo.
 */
export type ChartTone = TagTone | "neutral"

export function chartColor(tone: ChartTone): string {
  return tone === "neutral" ? "var(--color-ink-subtle)" : `var(--color-tono-${tone}-solido)`
}

/** Orden fijo de las series: la primera serie siempre es naranja, la segunda azul... */
export const seriesOrder: ChartTone[] = ["naranja", "azul", "verde", "violeta", "turquesa", "amarillo", "rosa", "rojo"]

export const axisTick = { fill: "var(--color-ink-muted)", fontSize: 12 }
export const gridStroke = "var(--color-line)"
export const cursorFill = "var(--color-surface-hover)"

function subscribe(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)")
  query.addEventListener("change", callback)
  return () => query.removeEventListener("change", callback)
}

/** Sin animación si la persona pidió menos movimiento. */
export function useChartAnimation(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  )
}
