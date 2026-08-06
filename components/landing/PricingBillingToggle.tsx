"use client"

import { cn } from "@/lib/utils"
import type { BillingPeriod } from "@/lib/landing/pricingPlans"

type PricingBillingToggleProps = {
  value: BillingPeriod
  onChange: (value: BillingPeriod) => void
}

export function PricingBillingToggle({
  value,
  onChange,
}: PricingBillingToggleProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-center text-sm leading-[1.4] text-[#43484e]">
        Modalidad de pago:
      </p>
      <div className="flex w-full max-w-[283px] rounded-full border border-[#afb3ba] bg-white p-[5px]">
        <button
          type="button"
          onClick={() => onChange("annual")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1 rounded-full px-6 py-2.5 text-[15px] font-medium leading-[22.5px] transition-colors",
            value === "annual"
              ? "bg-[#272a2d] text-white"
              : "text-[#696e77]",
          )}
        >
          Anual
          <span
            className={cn(
              "text-xs leading-[1.4] tracking-[-0.36px]",
              value === "annual" ? "font-normal" : "hidden",
            )}
          >
            ahorrás 20%
          </span>
        </button>
        <button
          type="button"
          onClick={() => onChange("monthly")}
          className={cn(
            "flex flex-1 items-center justify-center rounded-full px-6 py-2.5 text-[15px] font-medium leading-[22.5px] transition-colors",
            value === "monthly"
              ? "bg-[#272a2d] text-white"
              : "text-[#696e77]",
          )}
        >
          Mensual
        </button>
      </div>
    </div>
  )
}
