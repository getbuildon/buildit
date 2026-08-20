"use client"

import { useRef, type ReactNode } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

import {
  LANDING_REVEAL_DEFAULTS,
  LANDING_REVEAL_FROM,
  type LandingRevealDirection,
} from "@/lib/landing/landingReveal"
import { cn } from "@/lib/utils"

type LandingRevealProps = {
  children: ReactNode
  direction?: LandingRevealDirection
  delay?: number
  className?: string
}

export function LandingReveal({
  children,
  direction = "up",
  delay = 0,
  className,
}: LandingRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const node = ref.current
      if (!node) return

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(node, { x: 0, y: 0, opacity: 1 })
        return
      }

      const from = LANDING_REVEAL_FROM[direction]

      gsap.fromTo(
        node,
        { x: from.x, y: from.y, opacity: 0 },
        {
          x: 0,
          y: 0,
          opacity: 1,
          duration: LANDING_REVEAL_DEFAULTS.duration,
          delay,
          ease: LANDING_REVEAL_DEFAULTS.ease,
          immediateRender: true,
          scrollTrigger: {
            trigger: node,
            start: LANDING_REVEAL_DEFAULTS.start,
            once: true,
          },
        },
      )
    },
    { scope: ref, dependencies: [direction, delay] },
  )

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  )
}
