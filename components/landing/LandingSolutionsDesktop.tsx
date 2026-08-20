"use client"

import { useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import { SolutionSlideCardDesktop } from "@/components/landing/SolutionSlideCardDesktop"
import {
  DESKTOP_CARD_HEIGHT_PX,
  DESKTOP_CARD_WIDTH_PX,
  DESKTOP_HEADER_GAP_PX,
  DESKTOP_HEADER_TO_CARDS_PX,
  DESKTOP_HEADING_WIDTH_PX,
  DESKTOP_SECTION_BOTTOM_PX,
  DESKTOP_SECTION_TOP_PX,
  DESKTOP_SLIDER_GAP_PX,
  DESKTOP_SLIDE_DURATION_S,
  DESKTOP_SLIDE_EASE,
  DESKTOP_SLIDE_SCROLL_PX,
  DESKTOP_TAB_WIDTH_PX,
  getSliderPinEdge,
  railOpacityForWidth,
  scrollProgressForIndex,
  slideIndexFromProgress,
  type SliderPinEdge,
} from "@/lib/landing/solutionDesktopSlider"
import { SOLUTION_SLIDES, type SolutionSlide } from "@/lib/landing/solutionSlides"
import { cn } from "@/lib/utils"

gsap.registerPlugin(ScrollTrigger)

function pinLayer(node: HTMLElement, edge: SliderPinEdge) {
  if (edge === "left") {
    gsap.set(node, {
      left: 0,
      x: 0,
      y: 0,
      scale: 1,
      scaleX: 1,
      clearProps: "right",
    })
    return
  }

  gsap.set(node, {
    right: 0,
    x: 0,
    y: 0,
    scale: 1,
    scaleX: 1,
    clearProps: "left",
  })
}

function syncRailToWidth(panel: HTMLElement, rail: HTMLElement) {
  const width = Number(gsap.getProperty(panel, "width"))
  gsap.set(rail, { autoAlpha: railOpacityForWidth(width) })
}

function SolutionCollapsedTab({
  slide,
  isActive,
  onSelect,
}: {
  slide: SolutionSlide
  isActive: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      data-slide-rail
      onClick={onSelect}
      tabIndex={isActive ? -1 : 0}
      aria-hidden={isActive}
      aria-expanded={isActive}
      aria-label={`Ver solución ${slide.number}: ${slide.title}`}
      className={cn(
        "absolute top-0 z-10 flex h-full flex-col items-center overflow-hidden border-r border-solid border-[#363a3f] bg-[#272a2d] pt-6 transition-colors",
        isActive ? "pointer-events-none" : "hover:bg-[#2d3034]",
      )}
      style={{ width: DESKTOP_TAB_WIDTH_PX }}
    >
      <span className="font-recoleta text-[17px] leading-[17px] text-[#ff7433]">
        {slide.number}
      </span>
      <span
        className="mt-5 font-recoleta text-[15px] leading-[15px] text-white/50"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        {slide.title}
      </span>
    </button>
  )
}

export function LandingSolutionsDesktop() {
  const [activeIndex, setActiveIndex] = useState(0)
  const pinRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const prevIndexRef = useRef(0)
  const didAnimate = useRef(false)
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null)

  const goToSlide = (index: number) => {
    if (index === activeIndex) return

    setActiveIndex(index)

    const trigger = scrollTriggerRef.current
    if (!trigger?.isActive) return

    const progress = scrollProgressForIndex(index, SOLUTION_SLIDES.length)
    trigger.scroll(trigger.start + (trigger.end - trigger.start) * progress)
  }

  useGSAP(
    () => {
      const pin = pinRef.current
      if (!pin) return

      const media = gsap.matchMedia()

      media.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          const trigger = ScrollTrigger.create({
            trigger: pin,
            pin: true,
            start: "top top",
            end: `+=${SOLUTION_SLIDES.length * DESKTOP_SLIDE_SCROLL_PX}`,
            anticipatePin: 1,
            pinSpacing: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const nextIndex = slideIndexFromProgress(
                self.progress,
                SOLUTION_SLIDES.length,
              )

              setActiveIndex((current) =>
                current === nextIndex ? current : nextIndex,
              )
            },
          })

          scrollTriggerRef.current = trigger

          return () => {
            if (scrollTriggerRef.current === trigger) {
              scrollTriggerRef.current = null
            }
            trigger.kill()
          }
        },
      )

      return () => media.revert()
    },
    { scope: pinRef },
  )

  useGSAP(
    () => {
      const panels = gsap.utils.toArray<HTMLElement>("[data-slide-panel]")
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
      const fromIndex = prevIndexRef.current
      const instant = reducedMotion || !didAnimate.current
      didAnimate.current = true
      prevIndexRef.current = activeIndex

      gsap.killTweensOf(panels)

      const openingPanel = panels[activeIndex]
      const closingPanel =
        fromIndex === activeIndex ? undefined : panels[fromIndex]
      const openingRail =
        openingPanel?.querySelector<HTMLElement>("[data-slide-rail]") ?? null
      const closingRail =
        closingPanel?.querySelector<HTMLElement>("[data-slide-rail]") ?? null

      panels.forEach((panel, index) => {
        const rail = panel.querySelector<HTMLElement>("[data-slide-rail]")
        const card = panel.querySelector<HTMLElement>("[data-slide-card]")
        const edge = getSliderPinEdge(index, fromIndex, activeIndex)

        if (card) {
          pinLayer(card, edge)
          gsap.set(card, { autoAlpha: 1 })
        }

        if (rail) {
          pinLayer(rail, edge)
          gsap.set(rail, {
            borderLeftWidth: edge === "right" ? 1 : 0,
            borderRightWidth: edge === "left" ? 1 : 0,
          })
        }
      })

      const duration = instant ? 0 : DESKTOP_SLIDE_DURATION_S
      const timeline = gsap.timeline({
        defaults: { duration, ease: DESKTOP_SLIDE_EASE, overwrite: "auto" },
        onUpdate: () => {
          if (openingPanel && openingRail) {
            syncRailToWidth(openingPanel, openingRail)
          }
          if (closingPanel && closingRail) {
            syncRailToWidth(closingPanel, closingRail)
          }
        },
      })

      panels.forEach((panel, index) => {
        const rail = panel.querySelector<HTMLElement>("[data-slide-rail]")
        const isActive = index === activeIndex
        const isTransferring = index === activeIndex || index === fromIndex

        timeline.to(
          panel,
          {
            width: isActive ? DESKTOP_CARD_WIDTH_PX : DESKTOP_TAB_WIDTH_PX,
          },
          0,
        )

        if (rail && (instant || !isTransferring)) {
          gsap.set(rail, { autoAlpha: isActive ? 0 : 1 })
        }
      })
    },
    { scope: trackRef, dependencies: [activeIndex], revertOnUpdate: false },
  )

  return (
    <div ref={pinRef} data-solutions-pin className="relative bg-[#272a2d]">
    <div
      className="relative overflow-x-clip"
      style={{
        paddingTop: DESKTOP_SECTION_TOP_PX,
        paddingBottom: DESKTOP_SECTION_BOTTOM_PX,
      }}
    >
      <div className="relative z-10 mx-auto max-w-[1280px] px-6 lg:px-10 xl:px-20">
        <div
          className="flex max-w-full flex-col xl:flex-row xl:items-end"
          style={{ gap: DESKTOP_HEADER_GAP_PX }}
        >
          <h2
            className="shrink-0 font-recoleta text-4xl leading-[1.05] text-[#fefcfb] xl:text-[48px]"
            style={{ maxWidth: DESKTOP_HEADING_WIDTH_PX }}
          >
            Todo el avance de obra. En un{" "}
            <span className="text-primary">solo lugar</span>.
          </h2>
          <p
            className="pt-5 text-lg leading-[1.2] tracking-[0.36px] text-[#afb3ba] xl:pt-0"
            style={{ maxWidth: DESKTOP_HEADING_WIDTH_PX }}
          >
            Con BuildOn conectás cada etapa del proyecto, desde la carga en campo
            hasta la visualización para clientes.
          </p>
        </div>

        <div
          ref={trackRef}
          className="flex w-max items-stretch xl:-mr-11"
          style={{
            marginTop: DESKTOP_HEADER_TO_CARDS_PX,
            height: DESKTOP_CARD_HEIGHT_PX,
            gap: DESKTOP_SLIDER_GAP_PX,
          }}
        >
          {SOLUTION_SLIDES.map((slide, index) => {
            const isActive = index === activeIndex

            return (
              <div
                key={slide.number}
                data-slide-panel
                className="relative h-full shrink-0 overflow-hidden"
                style={{
                  width:
                    index === 0 ? DESKTOP_CARD_WIDTH_PX : DESKTOP_TAB_WIDTH_PX,
                }}
              >
                <div
                  data-slide-card
                  className="absolute top-0 h-full"
                  style={{ width: DESKTOP_CARD_WIDTH_PX }}
                >
                  <SolutionSlideCardDesktop slide={slide} />
                </div>
                <SolutionCollapsedTab
                  slide={slide}
                  isActive={isActive}
                  onSelect={() => goToSlide(index)}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
    </div>
  )
}
