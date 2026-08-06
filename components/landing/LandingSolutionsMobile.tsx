"use client"

import { LandingSolutionsStack } from "@/components/landing/LandingSolutionsStack"

export function LandingSolutionsMobile() {
  return (
    <div className="lg:hidden">
      <LandingSolutionsStack />
    </div>
  )
}
