"use client"

import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useLayoutEffect, useRef, useState } from "react"

import { LandingHeroMobile } from "@/components/landing/LandingHeroMobile"
import { LandingProblemMobile } from "@/components/landing/LandingProblemMobile"
import { LandingSolutionsHeader } from "@/components/landing/LandingSolutionsHeader"
import { SolutionSlideCard } from "@/components/landing/SolutionSlideCard"
import { SOLUTION_SLIDES } from "@/lib/landing/solutionSlides"
import {
  CARD_ENTER_PX,
  CARD_ENTER_SCALE,
  CARD_HEIGHT_PX,
  CARD_STACK_STAGE_WIDTH_PX,
  CARD_WIDTH_PX,
  getPeekOffset,
  getStackedCardVars,
  SCROLL_DISTANCE_PX,
} from "@/lib/landing/solutionStackAnimation"

gsap.registerPlugin(ScrollTrigger)

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)")
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  return isMobile
}

function setInitialCardState(cards: HTMLDivElement[]) {
  gsap.set(cards[0], {
    y: 0,
    scale: 1,
    opacity: 1,
    pointerEvents: "auto",
    force3D: true,
  })
  gsap.set(cards.slice(1), {
    y: CARD_ENTER_PX,
    scale: CARD_ENTER_SCALE,
    opacity: 1,
    pointerEvents: "none",
    force3D: true,
  })
}

function buildTimeline(cards: HTMLDivElement[]) {
  const timeline = gsap.timeline({
    defaults: { ease: "none", duration: 1 },
  })

  for (let index = 1; index < cards.length; index++) {
    const entering = cards[index]
    const cardsBefore = cards.slice(0, index)

    timeline.to(
      entering,
      { y: 0, scale: 1, opacity: 1, pointerEvents: "auto", force3D: true },
      index === 1 ? 0 : ">",
    )

    cardsBefore.forEach((card, depth) => {
      const cardsAbove = index - depth
      const { scale, opacity } = getStackedCardVars(cardsAbove)

      timeline.to(
        card,
        {
          y: getPeekOffset(cardsAbove),
          scale,
          opacity,
          pointerEvents: "none",
          force3D: true,
        },
        "<",
      )
    })
  }

  return timeline
}

function refreshAfterImages(container: HTMLElement) {
  const pending = Array.from(container.querySelectorAll("img")).filter(
    (img) => !img.complete,
  )

  if (pending.length === 0) {
    ScrollTrigger.refresh()
    return
  }

  let remaining = pending.length
  const done = () => {
    remaining -= 1
    if (remaining <= 0) ScrollTrigger.refresh()
  }

  pending.forEach((img) => {
    img.addEventListener("load", done, { once: true })
    img.addEventListener("error", done, { once: true })
  })
}

export function LandingSolutionsStack() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [initError, setInitError] = useState<string | null>(null)
  const isMobile = useIsMobile()

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!isMobile || !root) return

    let ctx: gsap.Context | undefined
    let cancelled = false

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    const setup = () => {
      if (cancelled) return

      try {
        const cards = gsap.utils.toArray<HTMLDivElement>(
          "[data-solution-card]",
          root,
        )

        if (cards.length !== SOLUTION_SLIDES.length) {
          setInitError("Tarjetas no encontradas")
          return
        }

        setInitialCardState(cards)

        ctx?.revert()
        ctx = gsap.context(() => {
          const timeline = buildTimeline(cards)

          ScrollTrigger.create({
            id: "solutions-stack",
            trigger: root,
            pin: true,
            start: "bottom bottom",
            end: `+=${SCROLL_DISTANCE_PX}`,
            scrub: true,
            animation: timeline,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onLeaveBack(self) {
              if (self.scroll() <= self.start) {
                timeline.progress(0)
              }
            },
          })
        }, root)

        ScrollTrigger.refresh()
        refreshAfterImages(root)
      } catch (error) {
        setInitError(
          error instanceof Error ? error.message : "Error ScrollTrigger",
        )
      }
    }

    requestAnimationFrame(setup)

    return () => {
      cancelled = true
      ctx?.revert()
    }
  }, [isMobile])

  return (
    <div className="relative w-full lg:hidden">
      <LandingHeroMobile />

      <div ref={rootRef}>
        <LandingProblemMobile />

        <div
          data-landing-section="soluciones"
          className="w-full bg-[#272a2d]"
        >
          <div className="relative z-10 mx-auto w-full max-w-[390px] px-6 pt-10 md:max-w-[480px]">
            <LandingSolutionsHeader />
          </div>

          <div className="mt-[52px] flex justify-center px-6">
            <div
              className="relative overflow-hidden pt-2"
              style={{
                width: CARD_STACK_STAGE_WIDTH_PX,
                height: CARD_HEIGHT_PX + 8,
              }}
            >
              <div
                className="invisible pointer-events-none mx-auto"
                style={{ width: CARD_WIDTH_PX, height: CARD_HEIGHT_PX }}
                aria-hidden
              >
                <SolutionSlideCard fixedSize slide={SOLUTION_SLIDES[0]} />
              </div>

              {SOLUTION_SLIDES.map((slide, index) => (
                <div
                  key={slide.number}
                  className="absolute top-2 left-1/2 -translate-x-1/2"
                  style={{
                    width: CARD_WIDTH_PX,
                    zIndex: 10 + index,
                  }}
                >
                  <div
                    data-solution-card
                    className="origin-top will-change-transform"
                    style={{
                      opacity: 1,
                      transform:
                        index === 0
                          ? undefined
                          : `translate3d(0, ${CARD_ENTER_PX}px, 0)`,
                      pointerEvents: index === 0 ? "auto" : "none",
                    }}
                  >
                    <SolutionSlideCard fixedSize slide={slide} stacked={index > 0} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {initError ? (
            <p className="px-6 pb-4 text-center text-xs text-red-300">
              Stack: {initError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
