import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(useGSAP, ScrollTrigger)

export type LandingRevealDirection = "up" | "down" | "left" | "right"

export const LANDING_REVEAL_OFFSET_PX = 48

export const LANDING_REVEAL_FROM: Record<
  LandingRevealDirection,
  { x: number; y: number }
> = {
  up: { x: 0, y: LANDING_REVEAL_OFFSET_PX },
  down: { x: 0, y: -LANDING_REVEAL_OFFSET_PX },
  left: { x: -LANDING_REVEAL_OFFSET_PX, y: 0 },
  right: { x: LANDING_REVEAL_OFFSET_PX, y: 0 },
}

export const LANDING_REVEAL_DEFAULTS = {
  duration: 0.8,
  ease: "power3.out",
  start: "top 88%",
} as const
