"use client"

import { useState } from "react"

import { LandingReveal } from "@/components/landing/LandingReveal"
import { LandingPricingDesktop } from "@/components/landing/LandingPricingDesktop"
import { LandingPricingPlans } from "@/components/landing/LandingPricingPlans"
import { TeamRolesPanel } from "@/components/landing/TeamRolesPanel"
import type { BillingPeriod } from "@/lib/landing/pricingPlans"

export function LandingPricingSection() {
  const [billing, setBilling] = useState<BillingPeriod>("annual")

  return (
    <section
      id="planes"
      data-landing-section="planes"
      className="scroll-mt-[80px] bg-[#fefcfb]"
    >
      <div className="lg:hidden">
        <div className="px-6 pb-6 pt-10 text-center md:px-10 md:pt-14">
          <LandingReveal direction="up">
            <h2 className="mx-auto max-w-[560px] font-recoleta text-2xl leading-[1.05] text-[#272a2d] md:text-3xl">
              Planes que se adaptan a cada{" "}
              <span className="text-primary">proyecto.</span>
            </h2>
          </LandingReveal>
          <LandingReveal direction="up" delay={0.12}>
            <p className="mx-auto max-w-[480px] pt-3 text-sm leading-[1.4] text-[#111113] md:text-base">
              Desde obras pequeñas hasta operaciones multiobra, BuildOn escala con
              tu equipo y tu forma de trabajar.
            </p>
          </LandingReveal>
        </div>

        <LandingPricingPlans billing={billing} onBillingChange={setBilling} />
        <TeamRolesPanel />
      </div>

      <div className="hidden lg:block">
        <LandingPricingDesktop
          billing={billing}
          onBillingChange={setBilling}
        />
      </div>
    </section>
  )
}
