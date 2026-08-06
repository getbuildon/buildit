"use client"

import { useLayoutEffect, useRef, useState, type RefObject } from "react"

import { LandingSolutionsHeader } from "@/components/landing/LandingSolutionsHeader"
import { SolutionSlideCard } from "@/components/landing/SolutionSlideCard"
import { SOLUTION_SLIDES } from "@/lib/landing/solutionSlides"
import {
  CARD_ENTER_PX,
  getPeekOffset,
  getStackedCardVars,
  SCROLL_DISTANCE_PX,
} from "@/lib/landing/solutionStackAnimation"

type LandingSolutionsStackProps = {
  sequenceRef: RefObject<HTMLDivElement | null>
}

function setInitialCardState(
  gsap: typeof import("gsap").default,
  cards: HTMLDivElement[],
) {
  gsap.set(cards[0], {
    y: 0,
    scale: 1,
    opacity: 1,
    pointerEvents: "auto",
    force3D: true,
  })
  gsap.set(cards.slice(1), {
    y: CARD_ENTER_PX,
    scale: 1,
    opacity: 0,
    pointerEvents: "none",
    force3D: true,
  })
}

function buildTimeline(
  gsap: typeof import("gsap").default,
  cards: HTMLDivElement[],
) {
  const timeline = gsap.timeline({
    defaults: { ease: "none", duration: 1 },
  })

  for (let index = 1; index < cards.length; index++) {
    const entering = cards[index]
    const cardsBefore = cards.slice(0, index)

    timeline.to(
      entering,
      { y: 0, opacity: 1, pointerEvents: "auto", force3D: true },
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

function refreshScrollTriggerAfterImages(container: HTMLElement) {
  const images = container.querySelectorAll("img")
  if (images.length === 0) return

  let pending = 0
  const done = () => {
    pending -= 1
    if (pending <= 0) {
      void import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        ScrollTrigger.refresh()
      })
    }
  }

  images.forEach((img) => {
    if (img.complete) return
    pending += 1
    img.addEventListener("load", done, { once: true })
    img.addEventListener("error", done, { once: true })
  })
}

export function LandingSolutionsStack({
  sequenceRef,
}: LandingSolutionsStackProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [initError, setInitError] = useState<string | null>(null)

  useLayoutEffect(() => {
    const sequence = sequenceRef.current
    const content = contentRef.current
    if (!sequence || !content) return

    let ctx: ReturnType<typeof import("gsap").default.context> | undefined
    let refreshTimer: ReturnType<typeof setTimeout> | undefined
    let resizeObserver: ResizeObserver | undefined
    let cancelled = false

    const scheduleRefresh = () => {
      clearTimeout(refreshTimer)
      refreshTimer = setTimeout(() => {
        void import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
          ScrollTrigger.refresh()
        })
      }, 200)
    }

    const init = async () => {
      try {
        const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ])

        if (cancelled) return

        gsap.registerPlugin(ScrollTrigger)
        ScrollTrigger.config({ ignoreMobileResize: true })

        const cards = gsap.utils.toArray<HTMLDivElement>(
          "[data-solution-card]",
          content,
        )

        if (cards.length !== SOLUTION_SLIDES.length) {
          setInitError("Tarjetas no encontradas")
          return
        }

        setInitialCardState(gsap, cards)

        if (
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          return
        }

        ctx = gsap.context(() => {
          const timeline = buildTimeline(gsap, cards)

          // Hero + soluciones en un solo pin (trigger = pin = sequence)
          ScrollTrigger.create({
            trigger: sequence,
            pin: sequence,
            start: "bottom bottom",
            end: `+=${SCROLL_DISTANCE_PX}`,
            scrub: true,
            animation: timeline,
            pinSpacing: true,
            invalidateOnRefresh: true,
            onLeaveBack(self) {
              if (self.scroll() <= self.start) {
                timeline.progress(0)
              }
            },
          })
        }, sequence)

        refreshScrollTriggerAfterImages(sequence)
        ScrollTrigger.refresh()
      } catch (error) {
        setInitError(
          error instanceof Error ? error.message : "Error ScrollTrigger",
        )
      }
    }

    void init()

    resizeObserver = new ResizeObserver(scheduleRefresh)
    resizeObserver.observe(sequence)
    resizeObserver.observe(content)

    window.addEventListener("orientationchange", scheduleRefresh)

    return () => {
      cancelled = true
      clearTimeout(refreshTimer)
      resizeObserver?.disconnect()
      window.removeEventListener("orientationchange", scheduleRefresh)
      ctx?.revert()
    }
  }, [sequenceRef])

  return (
    <div
      ref={contentRef}
      className="relative z-10 mx-auto w-full max-w-[390px] bg-[#272a2d] pt-10"
    >
      <LandingSolutionsHeader />

      <div className="mt-[52px] px-6">
        <div className="relative mx-auto w-full max-w-[324px] overflow-x-hidden overflow-y-visible pt-2">
          <div className="invisible pointer-events-none" aria-hidden>
            <SolutionSlideCard slide={SOLUTION_SLIDES[0]} />
          </div>

          {SOLUTION_SLIDES.map((slide, index) => (
            <div
              key={slide.number}
              data-solution-card
              className="absolute inset-x-0 top-2 origin-top will-change-transform"
              style={{
                zIndex: 10 + index,
                opacity: index === 0 ? 1 : 0,
                pointerEvents: index === 0 ? "auto" : "none",
              }}
            >
              <SolutionSlideCard slide={slide} stacked={index > 0} />
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
  )
}
