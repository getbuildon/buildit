"use client"

import { useState } from "react"

import { PricingBillingToggle } from "@/components/landing/PricingBillingToggle"
import { PricingContractModal } from "@/components/landing/PricingContractModal"
import { PricingPlanCard } from "@/components/landing/PricingPlanCard"
import { TeamRolesPanelDesktop } from "@/components/landing/TeamRolesPanelDesktop"
import type { BillingPeriod, PricingPlan } from "@/lib/landing/pricingPlans"
import { PRICING_PLANS } from "@/lib/landing/pricingPlans"
import { cn } from "@/lib/utils"

type LandingPricingDesktopProps = {
  billing: BillingPeriod
  onBillingChange: (billing: BillingPeriod) => void
}

type ContractSelection = {
  plan: PricingPlan
  surfaceTierId: string
}

export function LandingPricingDesktop({
  billing,
  onBillingChange,
}: LandingPricingDesktopProps) {
  const [contractSelection, setContractSelection] =
    useState<ContractSelection | null>(null)

  return (
    <>
      <div className="mx-auto max-w-[1280px] px-20 py-28">
        <div className="mx-auto max-w-[672px] text-center">
          <h2 className="font-recoleta text-[48px] leading-[1.05] text-[#18191b]">
            Planes que se adaptan a cada{" "}
            <span className="text-primary">proyecto</span>.
          </h2>
          <p className="pt-5 text-xl leading-[1.4] text-[#43484e]">
            Desde obras pequeñas hasta operaciones multiobra, BuildOn escala con
            tu equipo y tu forma de trabajar.
          </p>
        </div>

        <div className="flex justify-center pt-10">
          <PricingBillingToggle value={billing} onChange={onBillingChange} />
        </div>

        <div className="grid grid-cols-3 gap-6 pt-12">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(plan.featured && "-mt-4 self-start")}
            >
              <PricingPlanCard
                plan={plan}
                billing={billing}
                onCtaClick={(surfaceTierId) =>
                  setContractSelection({ plan, surfaceTierId })
                }
              />
            </div>
          ))}
        </div>

        <div className="pt-16">
          <TeamRolesPanelDesktop />
        </div>
      </div>

      <PricingContractModal
        open={contractSelection != null}
        onOpenChange={(open) => {
          if (!open) setContractSelection(null)
        }}
        plan={contractSelection?.plan ?? null}
        billing={billing}
        surfaceTierId={contractSelection?.surfaceTierId}
      />
    </>
  )
}
