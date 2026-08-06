export const STACK_PEEK_PX = 12
export const CARD_ENTER_PX = 80
/** Escala inicial de la tarjeta que entra (zoom-in al aparecer) */
export const CARD_ENTER_SCALE = 1.16
/** px de scroll anclado para completar las 3 transiciones de tarjetas */
export const SCROLL_DISTANCE_PX = 540
export const STACK_SCALE_MIN = 0.89
export const STACK_OPACITY_MIN = 0.68

/** Escala y opacidad de una tarjeta según cuántas hay encima */
export function getStackedCardVars(cardsAbove: number) {
  return {
    scale: Math.max(STACK_SCALE_MIN, 1 - cardsAbove * 0.035),
    opacity: Math.max(STACK_OPACITY_MIN, 1 - cardsAbove * 0.06),
  }
}

export function getPeekOffset(depthFromFront: number) {
  return -depthFromFront * STACK_PEEK_PX
}
