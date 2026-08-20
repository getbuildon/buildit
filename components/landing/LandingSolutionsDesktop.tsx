"use client"

import { useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import { LandingReveal } from "@/components/landing/LandingReveal"
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
  DESKTOP_SLIDE_STICKY_OFFSET_PX,
  DESKTOP_TAB_WIDTH_PX,
  railOpacityForWidth,
  scrollProgressForIndex,
  setSolutionsPinActive,
  slideIndexFromProgress,
} from "@/lib/landing/solutionDesktopSlider"
import { SOLUTION_SLIDES, type SolutionSlide } from "@/lib/landing/solutionSlides"
import { cn } from "@/lib/utils"

gsap.registerPlugin(ScrollTrigger)

function syncRails(panels: HTMLElement[]) {
  panels.forEach((panel) => {
    const rail = panel.querySelector<HTMLElement>("[data-slide-rail]")
    if (!rail) return

    gsap.set(rail, {
      autoAlpha: railOpacityForWidth(Number(gsap.getProperty(panel, "width"))),
    })
  })
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
        "absolute top-0 left-0 z-10 flex h-full flex-col items-center overflow-hidden border-r border-solid border-[#363a3f] bg-[#272a2d] pt-6 transition-colors",
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
  const wrapRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const didAnimate = useRef(false)
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null)

  const goToSlide = (index: number) => {
    const trigger = scrollTriggerRef.current

    if (!trigger) {
      setActiveIndex(index)
      return
    }

    if (index === activeIndex && trigger.isActive) return

    const progress = scrollProgressForIndex(index, SOLUTION_SLIDES.length)
    const targetY = trigger.start + (trigger.end - trigger.start) * progress
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches

    window.scrollTo({
      top: targetY,
      behavior: reducedMotion ? "auto" : "smooth",
    })
  }

  useGSAP(
    () => {
      const wrap = wrapRef.current
      const sticky = stickyRef.current
      if (!wrap || !sticky) return

      const media = gsap.matchMedia()

      media.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          const extraScroll =
            SOLUTION_SLIDES.length * DESKTOP_SLIDE_SCROLL_PX

          const applyHeight = () => {
            wrap.style.height = `${sticky.offsetHeight + extraScroll}px`
          }

          applyHeight()

          const trigger = ScrollTrigger.create({
            trigger: wrap,
            start: `top -${DESKTOP_SLIDE_STICKY_OFFSET_PX}px`,
            end: `+=${extraScroll}`,
            invalidateOnRefresh: true,
            onRefresh: applyHeight,
            onToggle: (self) => {
              setSolutionsPinActive(self.isActive)
            },
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
            wrap.style.height = ""
            setSolutionsPinActive(false)
            trigger.kill()
          }
        },
      )

      return () => media.revert()
    },
    { scope: wrapRef },
  )

  useGSAP(
    () => {
      const panels = gsap.utils.toArray<HTMLElement>("[data-slide-panel]")
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
      const instant = reducedMotion || !didAnimate.current
      didAnimate.current = true

      gsap.killTweensOf(panels)

      const duration = instant ? 0 : DESKTOP_SLIDE_DURATION_S
      const timeline = gsap.timeline({
        defaults: { duration, ease: DESKTOP_SLIDE_EASE, overwrite: "auto" },
        onUpdate: () => syncRails(panels),
        onComplete: () => syncRails(panels),
      })

      panels.forEach((panel, index) => {
        const card = panel.querySelector<HTMLElement>("[data-slide-card]")

        if (card) {
          gsap.set(card, {
            left: 0,
            right: "auto",
            x: 0,
            y: 0,
            scale: 1,
            autoAlpha: 1,
          })
        }

        timeline.to(
          panel,
          {
            width:
              index === activeIndex
                ? DESKTOP_CARD_WIDTH_PX
                : DESKTOP_TAB_WIDTH_PX,
            minWidth: 0,
          },
          0,
        )
      })
    },
    { scope: trackRef, dependencies: [activeIndex], revertOnUpdate: false },
  )

  return (
    <div ref={wrapRef} className="relative bg-[#272a2d]">
      <div
        ref={stickyRef}
        data-solutions-pin
        className="sticky bg-[#272a2d]"
        style={{ top: -DESKTOP_SLIDE_STICKY_OFFSET_PX }}
      >
        <div
          className="relative overflow-x-clip"
          style={{
            paddingTop: DESKTOP_SECTION_TOP_PX,
            paddingBottom: DESKTOP_SECTION_BOTTOM_PX,
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-1/2 z-0 w-px -translate-x-1/2 bg-[#363a3f]"
          />
      <div className="relative z-10 mx-auto max-w-[1280px] px-6 lg:px-10 xl:px-20">
        <div
          className="flex max-w-full flex-col xl:flex-row xl:items-end"
          style={{ gap: DESKTOP_HEADER_GAP_PX }}
        >
          <LandingReveal direction="up">
            <h2
              className="shrink-0 font-recoleta text-4xl leading-[1.05] text-[#fefcfb] xl:text-[48px]"
              style={{ maxWidth: DESKTOP_HEADING_WIDTH_PX }}
            >
              Todo el avance de obra. En un{" "}
              <span className="text-primary">solo lugar</span>.
            </h2>
          </LandingReveal>
          <LandingReveal direction="up" delay={0.12}>
            <p
              className="pt-5 text-lg leading-[1.2] tracking-[0.36px] text-[#afb3ba] xl:pt-0"
              style={{ maxWidth: DESKTOP_HEADING_WIDTH_PX }}
            >
              Con BuildOn conectás cada etapa del proyecto, desde la carga en campo
              hasta la visualización para clientes.
            </p>
          </LandingReveal>
        </div>

        <LandingReveal direction="up" delay={0.22}>
        <div
          ref={trackRef}
          className="flex w-max flex-nowrap items-stretch xl:-mr-11"
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
                className={cn(
                  "relative isolate h-full min-w-0 shrink-0 overflow-hidden",
                  index === 0 ? "w-[900px]" : "w-[72px]",
                )}
              >
                <div
                  data-slide-card
                  className="absolute top-0 left-0 h-full overflow-hidden"
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
        </LandingReveal>
      </div>
        </div>
      </div>
    </div>
  )
}
