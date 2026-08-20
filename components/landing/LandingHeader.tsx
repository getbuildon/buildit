"use client"

import { useEffect, useRef, useState } from "react"

import { LandingHeaderDesktop } from "@/components/landing/LandingHeaderDesktop"
import { LandingHeaderMobile } from "@/components/landing/LandingHeaderMobile"
import {
  LANDING_NAV_LOCK_EVENT,
  isLandingHeaderLocked,
} from "@/lib/landing/landingHeaderLock"
import {
  SOLUTIONS_PIN_EVENT,
  isSolutionsPinActive,
} from "@/lib/landing/solutionDesktopSlider"
import { cn } from "@/lib/utils"

const SCROLL_DIRECTION_DELTA = 8
const HEADER_TRANSITION =
  "transform 520ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 320ms ease"

export function LandingHeader() {
  const headerRef = useRef<HTMLElement>(null)
  const lastScrollY = useRef(0)
  const headerHeightRef = useRef(80)
  const [headerHeight, setHeaderHeight] = useState(80)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)

  useEffect(() => {
    const measure = () => {
      const nextHeight = headerRef.current?.offsetHeight ?? 80
      headerHeightRef.current = nextHeight
      setHeaderHeight(nextHeight)
    }

    measure()
    lastScrollY.current = window.scrollY

    const onScroll = () => {
      const currentScrollY = window.scrollY
      const scrollDelta = currentScrollY - lastScrollY.current
      const hideAfter = headerHeightRef.current

      setIsScrolled(currentScrollY > hideAfter)

      if (isSolutionsPinActive()) {
        setIsHeaderVisible(false)
      } else if (isLandingHeaderLocked() || currentScrollY <= hideAfter) {
        setIsHeaderVisible(true)
      } else if (scrollDelta > SCROLL_DIRECTION_DELTA) {
        setIsHeaderVisible(false)
      } else if (scrollDelta < -SCROLL_DIRECTION_DELTA) {
        setIsHeaderVisible(true)
      }

      lastScrollY.current = currentScrollY
    }

    const onPinToggle = () => {
      if (isSolutionsPinActive()) {
        setIsHeaderVisible(false)
        return
      }

      onScroll()
    }

    onScroll()
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener(SOLUTIONS_PIN_EVENT, onPinToggle)
    window.addEventListener(LANDING_NAV_LOCK_EVENT, onScroll)

    return () => {
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener(SOLUTIONS_PIN_EVENT, onPinToggle)
      window.removeEventListener(LANDING_NAV_LOCK_EVENT, onScroll)
    }
  }, [])

  return (
    <>
      <div aria-hidden className="shrink-0" style={{ height: headerHeight }} />
      <header
        ref={headerRef}
        data-landing-header
        className={cn(
          "fixed inset-x-0 top-0 z-50 bg-background",
          isScrolled && "shadow-[0_4px_16px_rgba(24,25,27,0.08)]",
        )}
        style={{
          transform: isHeaderVisible ? "translateY(0)" : "translateY(-100%)",
          transition: HEADER_TRANSITION,
        }}
      >
        <div className="lg:hidden">
          <LandingHeaderMobile />
        </div>
        <div className="hidden lg:block">
          <LandingHeaderDesktop />
        </div>
      </header>
    </>
  )
}
