export const DESKTOP_SLIDE_DURATION_S = 0.72
export const DESKTOP_SLIDE_EASE = "power3.inOut"

/** Figma node 2211:3203 */
export const DESKTOP_SECTION_TOP_PX = 112
export const DESKTOP_SECTION_BOTTOM_PX = 112
export const DESKTOP_HEADER_TO_CARDS_PX = 80
export const DESKTOP_HEADER_GAP_PX = 180
export const DESKTOP_HEADING_WIDTH_PX = 470
export const DESKTOP_CARD_WIDTH_PX = 900
export const DESKTOP_CARD_HEIGHT_PX = 600
export const DESKTOP_TAB_WIDTH_PX = 72
export const DESKTOP_SLIDER_GAP_PX = 0

export type SliderPinEdge = "left" | "right"

/**
 * En un acordeón horizontal el ancho se transfiere entre paneles.
 * El borde estable (el que no se mueve en viewport) es:
 * - al ir hacia adelante: el que cierra se ancla a la izquierda, el que abre a la derecha
 * - al ir hacia atrás: el que cierra se ancla a la derecha, el que abre a la izquierda
 */
export function getSliderPinEdge(
  index: number,
  fromIndex: number,
  toIndex: number,
): SliderPinEdge {
  if (fromIndex === toIndex) return "left"

  const goingForward = toIndex > fromIndex

  if (index === fromIndex) return goingForward ? "left" : "right"
  if (index === toIndex) return goingForward ? "right" : "left"

  return "left"
}

export function railOpacityForWidth(width: number) {
  const span = DESKTOP_CARD_WIDTH_PX - DESKTOP_TAB_WIDTH_PX
  if (span <= 0) return 0

  const progress = (width - DESKTOP_TAB_WIDTH_PX) / span
  return 1 - Math.min(1, Math.max(0, progress))
}
