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
  start?: string
  /** Reproduce al montar, sin esperar scroll. Útil para contenido above-the-fold. */
  immediate?: boolean
}

export function LandingReveal({
  children,
  direction = "up",
  delay = 0,
  className,
  start = LANDING_REVEAL_DEFAULTS.start,
  immediate = false,
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

      gsap.set(node, { x: from.x, y: from.y, opacity: 0 })

      const play = () => {
        gsap.to(node, {
          x: 0,
          y: 0,
          opacity: 1,
          duration: LANDING_REVEAL_DEFAULTS.duration,
          delay,
          ease: LANDING_REVEAL_DEFAULTS.ease,
          overwrite: "auto",
        })
      }

      if (immediate) {
        play()
        return
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return
          play()
          observer.disconnect()
        },
        { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
      )

      observer.observe(node)

      return () => observer.disconnect()
    },
    { scope: ref, dependencies: [delay, direction, immediate, start] },
  )

  return (
    <div
      ref={ref}
      data-reveal={direction}
      className={cn("landing-reveal", className)}
    >
      {children}
    </div>
  )
}
