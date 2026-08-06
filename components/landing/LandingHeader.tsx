"use client"

import { useEffect, useState } from "react"

import { LandingHeaderDesktop } from "@/components/landing/LandingHeaderDesktop"
import { LandingHeaderMobile } from "@/components/landing/LandingHeaderMobile"
import { cn } from "@/lib/utils"

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "z-50 bg-background transition-shadow duration-200 lg:sticky lg:top-0",
        isScrolled && "lg:shadow-[0_4px_16px_rgba(24,25,27,0.08)]",
      )}
    >
      <div className="lg:hidden">
        <LandingHeaderMobile />
      </div>
      <div className="hidden lg:block">
        <LandingHeaderDesktop />
      </div>
    </header>
  )
}
