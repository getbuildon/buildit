"use client"

import { useRef } from "react"

import { LandingHero } from "@/components/landing/LandingHero"
import { LandingSolutionsStack } from "@/components/landing/LandingSolutionsStack"

export function LandingSolutionsMobile() {
  const sequenceRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={sequenceRef} className="relative lg:hidden">
      <LandingHero />
      <LandingSolutionsStack sequenceRef={sequenceRef} />
    </div>
  )
}
