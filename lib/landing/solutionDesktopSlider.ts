import { STACK_PEEK_PX } from "@/lib/landing/solutionStackAnimation"

export const DESKTOP_CARD_WIDTH_PX = 900
export const DESKTOP_CARD_HEIGHT_PX = 600
export const DESKTOP_CARD_GAP_PX = 16
export const DESKTOP_STACK_PEEK_PX = STACK_PEEK_PX
export const DESKTOP_CARD_STEP_PX =
  DESKTOP_CARD_WIDTH_PX + DESKTOP_CARD_GAP_PX
export const DESKTOP_STACK_LEFT_PADDING_PX =
  (4 - 1) * DESKTOP_STACK_PEEK_PX
export const DESKTOP_STAGE_WIDTH_PX =
  DESKTOP_CARD_WIDTH_PX + DESKTOP_CARD_GAP_PX + DESKTOP_CARD_WIDTH_PX

export function getDesktopStackOffset(depthFromFront: number) {
  return -depthFromFront * DESKTOP_STACK_PEEK_PX
}

export function getDesktopCardTarget(index: number, activeIndex: number) {
  if (index < activeIndex) {
    const depth = activeIndex - index

    return {
      x: getDesktopStackOffset(depth),
      opacity: 1,
      zIndex: 10 + index,
      pointerEvents: "none" as const,
    }
  }

  if (index === activeIndex) {
    return {
      x: 0,
      opacity: 1,
      zIndex: 20 + index,
      pointerEvents: "auto" as const,
    }
  }

  if (index === activeIndex + 1) {
    return {
      x: DESKTOP_CARD_STEP_PX,
      opacity: 1,
      zIndex: 15 + index,
      pointerEvents: "none" as const,
    }
  }

  return {
    x: (index - activeIndex) * DESKTOP_CARD_STEP_PX,
    opacity: 0,
    zIndex: index,
    pointerEvents: "none" as const,
  }
}
