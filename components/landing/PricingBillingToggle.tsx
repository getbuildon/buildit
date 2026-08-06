"use client"

import { cn } from "@/lib/utils"
import type { BillingPeriod } from "@/lib/landing/pricingPlans"

const TOGGLE_WIDTH_PX = 283
const TAB_HEIGHT_PX = 43
const TAB_ANNUAL_WIDTH_PX = 164
const TAB_MONTHLY_WIDTH_PX = 109

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
    <div
      className="flex flex-col items-center gap-1"
      style={{ width: TOGGLE_WIDTH_PX }}
      role="tablist"
      aria-label="Modalidad de pago"
    >
      <p className="w-full text-center text-sm leading-[1.4] text-[#43484e]">
        Modalidad de pago:
      </p>

      <div className="relative box-border w-full rounded-full bg-white p-[5px] shadow-[inset_0_0_0_1px_#afb3ba]">
        <div className="relative flex h-[43px] w-[273px]">
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 rounded-full bg-[#272a2d] transition-[transform,width] duration-300 ease-in-out motion-reduce:transition-none"
            style={{
              width: isAnnual ? TAB_ANNUAL_WIDTH_PX : TAB_MONTHLY_WIDTH_PX,
              transform: `translateX(${isAnnual ? 0 : TAB_ANNUAL_WIDTH_PX}px)`,
            }}
          />

          <button
            type="button"
            role="tab"
            aria-selected={isAnnual}
            onClick={() => onChange("annual")}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1 rounded-full transition-colors duration-300 ease-out motion-reduce:transition-none",
              isAnnual ? "text-white" : "text-[#696e77]",
            )}
            style={{ width: TAB_ANNUAL_WIDTH_PX, height: TAB_HEIGHT_PX }}
          >
            <span className="text-[15px] font-medium leading-none">Anual</span>
            <span className="text-xs font-normal leading-none tracking-[-0.36px]">
              ahorrás 20%
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={!isAnnual}
            onClick={() => onChange("monthly")}
            className={cn(
              "relative z-10 flex items-center justify-center rounded-full text-[15px] font-medium leading-none transition-colors duration-300 ease-out motion-reduce:transition-none",
              isAnnual ? "text-[#696e77]" : "text-white",
            )}
            style={{ width: TAB_MONTHLY_WIDTH_PX, height: TAB_HEIGHT_PX }}
          >
            Mensual
          </button>
        </div>
      </div>
    </div>
  )
}
