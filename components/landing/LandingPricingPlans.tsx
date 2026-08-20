"use client"

import { useState } from "react"

import { LandingReveal } from "@/components/landing/LandingReveal"
import { PricingBillingToggle } from "@/components/landing/PricingBillingToggle"
import { PricingContractModal } from "@/components/landing/PricingContractModal"
import { PricingPlanCard } from "@/components/landing/PricingPlanCard"
import type { BillingPeriod, PricingPlan } from "@/lib/landing/pricingPlans"
import { PRICING_PLANS } from "@/lib/landing/pricingPlans"

type LandingPricingPlansProps = {
  billing: BillingPeriod
  onBillingChange: (billing: BillingPeriod) => void
}

type ContractSelection = {
  plan: PricingPlan
  surfaceTierId: string
}

export function LandingPricingPlans({
  billing,
  onBillingChange,
}: LandingPricingPlansProps) {
  const [contractSelection, setContractSelection] =
    useState<ContractSelection | null>(null)

  return (
    <>
      <div className="px-6 pb-6 md:px-10">
        <LandingReveal direction="up" delay={0.22}>
          <div className="flex justify-center">
            <PricingBillingToggle value={billing} onChange={onBillingChange} />
          </div>
        </LandingReveal>

        <div className="mx-auto flex w-full max-w-[480px] flex-col gap-3 pt-6 md:max-w-[560px]">
          {PRICING_PLANS.map((plan, index) => (
            <LandingReveal key={plan.id} direction="up" delay={0.08 * index}>
              <PricingPlanCard
                plan={plan}
                billing={billing}
                onCtaClick={(surfaceTierId) =>
                  setContractSelection({ plan, surfaceTierId })
                }
              />
            </LandingReveal>
          ))}
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
