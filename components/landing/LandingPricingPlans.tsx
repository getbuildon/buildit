"use client"

import { useState } from "react"

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
      <div className="px-6 pb-6">
        <div className="flex justify-center">
          <PricingBillingToggle value={billing} onChange={onBillingChange} />
        </div>

        <div className="flex flex-col gap-3 pt-6">
          {PRICING_PLANS.map((plan) => (
            <PricingPlanCard
              key={plan.id}
              plan={plan}
              billing={billing}
              onCtaClick={(surfaceTierId) =>
                setContractSelection({ plan, surfaceTierId })
              }
            />
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
