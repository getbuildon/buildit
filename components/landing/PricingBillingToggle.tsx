"use client"

import { cn } from "@/lib/utils"
import type { BillingPeriod } from "@/lib/landing/pricingPlans"

const TOGGLE_WIDTH_PX = 283
const TAB_HEIGHT_PX = 43
const TAB_ANNUAL_WIDTH_PX = 164
const TAB_MONTHLY_WIDTH_PX = 109
const TAB_ANNUAL_LEFT_PX = 5
const TAB_MONTHLY_LEFT_PX = 169

type PricingBillingToggleProps = {
  value: BillingPeriod
  onChange: (value: BillingPeriod) => void
}

export function PricingBillingToggle({
  value,
  onChange,
}: PricingBillingToggleProps) {
  const isAnnual = value === "annual"

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-center text-sm leading-[1.4] text-[#43484e]">
        Modalidad de pago:
      </p>

      <div
        className="relative flex rounded-full border border-[#afb3ba] bg-white p-[5px]"
        style={{ width: TOGGLE_WIDTH_PX }}
        role="tablist"
        aria-label="Modalidad de pago"
      >
        <span
          aria-hidden
          className="absolute rounded-full bg-[#272a2d] transition-[left,width] duration-300 ease-out motion-reduce:transition-none"
          style={{
            top: 5,
            height: TAB_HEIGHT_PX,
            left: isAnnual ? TAB_ANNUAL_LEFT_PX : TAB_MONTHLY_LEFT_PX,
            width: isAnnual ? TAB_ANNUAL_WIDTH_PX : TAB_MONTHLY_WIDTH_PX,
          }}
        />

        <button
          type="button"
          role="tab"
          aria-selected={isAnnual}
          onClick={() => onChange("annual")}
          className={cn(
            "relative z-10 flex shrink-0 items-center justify-center gap-1 rounded-full px-6 py-2.5 text-[15px] font-medium leading-[22.5px] transition-colors duration-300 ease-out motion-reduce:transition-none",
            isAnnual ? "text-white" : "text-[#696e77]",
          )}
          style={{ width: TAB_ANNUAL_WIDTH_PX, height: TAB_HEIGHT_PX }}
        >
          Anual
          <span className="text-xs font-normal leading-[1.4] tracking-[-0.36px]">
            ahorrás 20%
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={!isAnnual}
          onClick={() => onChange("monthly")}
          className={cn(
            "relative z-10 flex shrink-0 items-center justify-center rounded-full px-6 py-2.5 text-[15px] font-medium leading-[22.5px] transition-colors duration-300 ease-out motion-reduce:transition-none",
            isAnnual ? "text-[#696e77]" : "text-white",
          )}
          style={{ width: TAB_MONTHLY_WIDTH_PX, height: TAB_HEIGHT_PX }}
        >
          Mensual
        </button>
      </div>
    </div>
  )
}
