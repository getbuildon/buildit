"use client"

import { useState } from "react"

import { LandingPricingPlans } from "@/components/landing/LandingPricingPlans"
import { TeamRolesPanel } from "@/components/landing/TeamRolesPanel"
import type { BillingPeriod } from "@/lib/landing/pricingPlans"

export function LandingPricingSection() {
  const [billing, setBilling] = useState<BillingPeriod>("annual")

  return (
    <section id="planes" className="scroll-mt-[80px] bg-[#fefcfb]">
      <div className="px-6 pb-6 pt-10 text-center">
        <h2 className="font-recoleta text-2xl leading-[1.05] text-[#272a2d]">
          Planes que se adaptan a cada{" "}
          <span className="text-primary">proyecto.</span>
        </h2>
        <p className="mx-auto max-w-[342px] pt-3 text-sm leading-[1.4] text-[#111113]">
          Desde obras pequeñas hasta operaciones multiobra, BuildOn escala con
          tu equipo y tu forma de trabajar.
        </p>
      </div>

      <LandingPricingPlans billing={billing} onBillingChange={setBilling} />
      <TeamRolesPanel />
    </section>
  )
}
