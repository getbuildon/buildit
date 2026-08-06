"use client"

import gsap from "gsap"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useLayoutEffect, useRef, useState } from "react"

import { SolutionSlideCardDesktop } from "@/components/landing/SolutionSlideCardDesktop"
import {
  DESKTOP_CARD_HEIGHT_PX,
  DESKTOP_STAGE_WIDTH_PX,
  DESKTOP_STACK_LEFT_PADDING_PX,
  getDesktopCardTarget,
} from "@/lib/landing/solutionDesktopSlider"
import { SOLUTION_SLIDES } from "@/lib/landing/solutionSlides"
import { cn } from "@/lib/utils"

const SLIDE_COUNT = SOLUTION_SLIDES.length

export function LandingSolutionsDesktop() {
  const [activeIndex, setActiveIndex] = useState(0)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const prefersReducedMotionRef = useRef(false)
  const isFirstRenderRef = useRef(true)

  const applySlideState = useCallback(
    (index: number, animate: boolean) => {
      const duration = animate && !prefersReducedMotionRef.current ? 0.55 : 0

      cardRefs.current.forEach((card, cardIndex) => {
        if (!card) return

        const target = getDesktopCardTarget(cardIndex, index)

        gsap.to(card, {
          x: target.x,
          opacity: target.opacity,
          zIndex: target.zIndex,
          duration,
          ease: "power3.out",
          overwrite: true,
          onStart: () => {
            card.style.pointerEvents = target.pointerEvents
          },
        })
      })
    },
    [],
  )

  useLayoutEffect(() => {
    prefersReducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches

    cardRefs.current.forEach((card, index) => {
      if (!card) return

      const target = getDesktopCardTarget(index, 0)
      gsap.set(card, {
        x: target.x,
        opacity: target.opacity,
        zIndex: target.zIndex,
        force3D: true,
      })
      card.style.pointerEvents = target.pointerEvents
    })
  }, [])

  useLayoutEffect(() => {
    applySlideState(activeIndex, !isFirstRenderRef.current)
    isFirstRenderRef.current = false
  }, [activeIndex, applySlideState])

  const goToSlide = (index: number) => {
    if (index < 0 || index >= SLIDE_COUNT || index === activeIndex) return
    setActiveIndex(index)
  }

  return (
    <div className="mx-auto max-w-[1280px] px-20 py-28">
      <div className="flex items-end gap-[180px]">
        <h2 className="flex-1 font-recoleta text-[48px] leading-[1.05] text-[#fefcfb]">
          Todo el avance de obra. En un{" "}
          <span className="text-primary">solo lugar</span>.
        </h2>
        <p className="flex-1 pt-5 text-lg leading-[1.2] tracking-[0.36px] text-[#afb3ba]">
          Con BuildOn conectás cada etapa del proyecto, desde la carga en campo
          hasta la visualización para clientes.
        </p>
      </div>

      <div className="pt-20">
        <div
          className="overflow-visible"
          style={{ paddingLeft: DESKTOP_STACK_LEFT_PADDING_PX }}
        >
          <div
            className="relative overflow-visible"
            style={{
              width: DESKTOP_STAGE_WIDTH_PX,
              height: DESKTOP_CARD_HEIGHT_PX,
            }}
          >
            {SOLUTION_SLIDES.map((slide, index) => (
              <div
                key={slide.number}
                ref={(node) => {
                  cardRefs.current[index] = node
                }}
                className="absolute left-0 top-0 will-change-transform"
              >
                <SolutionSlideCardDesktop slide={slide} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 px-6 pt-10">
          <button
            type="button"
            aria-label="Solución anterior"
            disabled={activeIndex === 0}
            onClick={() => goToSlide(activeIndex - 1)}
            className="grid size-10 place-items-center rounded-full border border-white/20 text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="size-5" strokeWidth={1.75} />
          </button>

          <div className="flex items-center gap-2">
            {SOLUTION_SLIDES.map((slide, index) => {
              const isActive = index === activeIndex

              return (
                <button
                  key={slide.number}
                  type="button"
                  aria-label={`Ir a solución ${index + 1}`}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    isActive
                      ? "h-2 w-6 bg-primary"
                      : "size-2 bg-white/25 hover:bg-white/40",
                  )}
                />
              )
            })}
          </div>

          <button
            type="button"
            aria-label="Solución siguiente"
            disabled={activeIndex === SLIDE_COUNT - 1}
            onClick={() => goToSlide(activeIndex + 1)}
            className="grid size-10 place-items-center rounded-full border border-white/20 text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="size-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  )
}
