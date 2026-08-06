import { STACK_PEEK_PX } from "@/lib/landing/solutionStackAnimation"

export const DESKTOP_SECTION_HEIGHT_PX = 996
export const DESKTOP_CONTENT_WIDTH_PX = 1120
export const DESKTOP_HEADER_GAP_PX = 180
export const DESKTOP_HEADING_WIDTH_PX = 470
export const DESKTOP_CARD_WIDTH_PX = 900
export const DESKTOP_CARD_HEIGHT_PX = 600
export const DESKTOP_CARD_GAP_PX = 16
export const DESKTOP_STACK_PEEK_PX = STACK_PEEK_PX
export const DESKTOP_CARD_STEP_PX =
  DESKTOP_CARD_WIDTH_PX + DESKTOP_CARD_GAP_PX
export const DESKTOP_STACK_LEFT_PADDING_PX =
  (4 - 1) * DESKTOP_STACK_PEEK_PX
export const DESKTOP_TRACK_WIDTH_PX =
  DESKTOP_CARD_WIDTH_PX + DESKTOP_CARD_GAP_PX + DESKTOP_CARD_WIDTH_PX
export const DESKTOP_HEADER_TO_CARDS_PX = 80
export const DESKTOP_CARDS_TO_CONTROLS_PX = 29
export const DESKTOP_STACK_SCALE_STEP = 0.02
export const DESKTOP_STACK_SCALE_MIN = 0.94

export function getDesktopStackOffset(depthFromFront: number) {
  return -depthFromFront * DESKTOP_STACK_PEEK_PX
}

export function getDesktopStackScale(depthFromFront: number) {
  return Math.max(
    DESKTOP_STACK_SCALE_MIN,
    1 - depthFromFront * DESKTOP_STACK_SCALE_STEP,
  )
}

export function getDesktopCardTarget(index: number, activeIndex: number) {
  if (index < activeIndex) {
    const depth = activeIndex - index

    return {
      x: getDesktopStackOffset(depth),
      scale: getDesktopStackScale(depth),
      opacity: 1,
      pointerEvents: "none" as const,
    }
  }

  if (index === activeIndex) {
    return {
      x: 0,
      scale: 1,
      opacity: 1,
      pointerEvents: "auto" as const,
    }
  }

  if (index === activeIndex + 1) {
    return {
      x: DESKTOP_CARD_STEP_PX,
      scale: 1,
      opacity: 1,
      pointerEvents: "none" as const,
    }
  }

  return {
    x: (index - activeIndex) * DESKTOP_CARD_STEP_PX,
    scale: 1,
    opacity: 0,
    pointerEvents: "none" as const,
  }
}

export function getDesktopCardZIndex(index: number) {
  return 10 + index
}
