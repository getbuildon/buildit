import { PricingBillingToggle } from "@/components/landing/PricingBillingToggle"
import { PricingPlanCard } from "@/components/landing/PricingPlanCard"
import type { BillingPeriod } from "@/lib/landing/pricingPlans"
import { PRICING_PLANS } from "@/lib/landing/pricingPlans"

type LandingPricingPlansProps = {
  billing: BillingPeriod
  onBillingChange: (billing: BillingPeriod) => void
}

export function LandingPricingPlans({
  billing,
  onBillingChange,
}: LandingPricingPlansProps) {
  return (
    <div className="px-6 pb-6">
      <PricingBillingToggle value={billing} onChange={onBillingChange} />

      <div className="flex flex-col gap-3 pt-6">
        {PRICING_PLANS.map((plan) => (
          <PricingPlanCard key={plan.id} plan={plan} billing={billing} />
        ))}
      </div>
    </div>
  )
}
