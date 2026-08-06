"use client"

import gsap from "gsap"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react"

import { SolutionSlideCardDesktop } from "@/components/landing/SolutionSlideCardDesktop"
import {
  DESKTOP_CARD_HEIGHT_PX,
  DESKTOP_CARDS_TO_CONTROLS_PX,
  DESKTOP_CONTENT_WIDTH_PX,
  DESKTOP_HEADER_GAP_PX,
  DESKTOP_HEADER_TO_CARDS_PX,
  DESKTOP_HEADING_WIDTH_PX,
  DESKTOP_SECTION_HEIGHT_PX,
  DESKTOP_STACK_LEFT_PADDING_PX,
  DESKTOP_TRACK_WIDTH_PX,
  getDesktopCardTarget,
  getDesktopCardZIndex,
} from "@/lib/landing/solutionDesktopSlider"
import { SOLUTION_SLIDES } from "@/lib/landing/solutionSlides"
import { cn } from "@/lib/utils"

const SLIDE_COUNT = SOLUTION_SLIDES.length

function useSliderViewportWidth(
  viewportRef: RefObject<HTMLDivElement | null>,
) {
  const [viewportWidth, setViewportWidth] = useState(DESKTOP_CONTENT_WIDTH_PX)

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const update = () => {
      const left = viewport.getBoundingClientRect().left
      setViewportWidth(window.innerWidth - left)
    }

    update()

    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    window.addEventListener("resize", update)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", update)
    }
  }, [viewportRef])

  return viewportWidth
}

export function LandingSolutionsDesktop() {
  const [activeIndex, setActiveIndex] = useState(0)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const sliderViewportRef = useRef<HTMLDivElement>(null)
  const sliderViewportWidth = useSliderViewportWidth(sliderViewportRef)
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
          scale: target.scale,
          opacity: target.opacity,
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
        scale: target.scale,
        opacity: target.opacity,
        transformOrigin: "left center",
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
    <div
      className="relative"
      style={{ minHeight: DESKTOP_SECTION_HEIGHT_PX }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 w-px -translate-x-1/2 bg-[#363a3f]"
        style={{ height: DESKTOP_SECTION_HEIGHT_PX }}
      />

      <div className="relative z-10 mx-auto max-w-[1280px] px-20 py-28">
        <div
          className="flex items-end"
          style={{
            width: DESKTOP_CONTENT_WIDTH_PX,
            gap: DESKTOP_HEADER_GAP_PX,
          }}
        >
          <h2
            className="font-recoleta text-[48px] leading-[1.05] text-[#fefcfb]"
            style={{ width: DESKTOP_HEADING_WIDTH_PX }}
          >
            Todo el avance de obra. En un{" "}
            <span className="text-primary">solo lugar</span>.
          </h2>
          <p
            className="pt-5 text-lg leading-[1.2] tracking-[0.36px] text-[#afb3ba]"
            style={{ width: DESKTOP_HEADING_WIDTH_PX }}
          >
            Con BuildOn conectás cada etapa del proyecto, desde la carga en campo
            hasta la visualización para clientes.
          </p>
        </div>

        <div style={{ paddingTop: DESKTOP_HEADER_TO_CARDS_PX }}>
          <div
            ref={sliderViewportRef}
            className="overflow-hidden"
            style={{
              width: sliderViewportWidth + DESKTOP_STACK_LEFT_PADDING_PX,
              marginLeft: -DESKTOP_STACK_LEFT_PADDING_PX,
              paddingLeft: DESKTOP_STACK_LEFT_PADDING_PX,
            }}
          >
            <div
              className="relative"
              style={{
                width: DESKTOP_TRACK_WIDTH_PX,
                height: DESKTOP_CARD_HEIGHT_PX,
              }}
            >
              {SOLUTION_SLIDES.map((slide, index) => (
                <div
                  key={slide.number}
                  ref={(node) => {
                    cardRefs.current[index] = node
                  }}
                  className="absolute left-0 top-0 origin-left will-change-transform"
                  style={{ zIndex: getDesktopCardZIndex(index) }}
                >
                  <SolutionSlideCardDesktop
                    slide={slide}
                    stacked={index < activeIndex}
                  />
                </div>
              ))}
            </div>
          </div>

          <div
            className="flex items-center justify-center gap-6"
            style={{ paddingTop: DESKTOP_CARDS_TO_CONTROLS_PX }}
          >
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
    </div>
  )
}
