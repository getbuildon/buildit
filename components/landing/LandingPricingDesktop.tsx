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
      <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-24 xl:px-20 xl:py-28">
        <div className="mx-auto max-w-[672px] text-center">
          <h2 className="font-recoleta text-4xl leading-[1.05] text-[#18191b] xl:text-[48px]">
            Planes que se adaptan a cada{" "}
            <span className="text-primary">proyecto</span>.
          </h2>
          <p className="pt-5 text-lg leading-[1.4] text-[#43484e] xl:text-xl">
            Desde obras pequeñas hasta operaciones multiobra, BuildOn escala con
            tu equipo y tu forma de trabajar.
          </p>
        </div>

        <div className="flex justify-center pt-10">
          <PricingBillingToggle value={billing} onChange={onBillingChange} />
        </div>

        <div className="mx-auto grid w-full max-w-[560px] grid-cols-1 gap-6 pt-12 xl:max-w-none xl:grid-cols-3 xl:items-start">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(plan.featured && "xl:-mt-4")}
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
