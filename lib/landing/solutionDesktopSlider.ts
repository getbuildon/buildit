export const DESKTOP_SLIDE_DURATION_S = 0.48
export const DESKTOP_SLIDE_EASE = "power2.out"
export const DESKTOP_SLIDE_SCROLL_PX = 420
export const DESKTOP_SLIDE_STICKY_OFFSET_PX = 50
export const SOLUTIONS_PIN_BODY_CLASS = "is-solutions-pinned"
export const SOLUTIONS_PIN_EVENT = "buildon:solutions-pin"

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

export function desktopAccordionWidthPx(slideCount: number) {
  return (
    DESKTOP_CARD_WIDTH_PX +
    Math.max(0, slideCount - 1) * DESKTOP_TAB_WIDTH_PX
  )
}

export function desktopAccordionScale(
  availableWidth: number,
  slideCount: number,
) {
  const width = desktopAccordionWidthPx(slideCount)
  if (width <= 0 || availableWidth <= 0) return 1
  return Math.min(1, availableWidth / width)
}

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

export function slideIndexFromProgress(progress: number, count: number) {
  if (count <= 1) return 0

  return Math.min(count - 1, Math.max(0, Math.floor(progress * count)))
}

export function scrollProgressForIndex(index: number, count: number) {
  if (count <= 0) return 0

  return (index + 0.5) / count
}

export function setSolutionsPinActive(active: boolean) {
  document.body.classList.toggle(SOLUTIONS_PIN_BODY_CLASS, active)
  window.dispatchEvent(new Event(SOLUTIONS_PIN_EVENT))
}

export function isSolutionsPinActive() {
  return document.body.classList.contains(SOLUTIONS_PIN_BODY_CLASS)
}
