"use client"

import { useLayoutEffect, useRef, useState } from "react"

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
  const isAnnual = value === "annual"
  const trackRef = useRef<HTMLDivElement>(null)
  const annualRef = useRef<HTMLButtonElement>(null)
  const monthlyRef = useRef<HTMLButtonElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0, height: 0 })

  useLayoutEffect(() => {
    const track = trackRef.current
    const active = isAnnual ? annualRef.current : monthlyRef.current
    if (!track || !active) return

    const update = () => {
      const trackRect = track.getBoundingClientRect()
      const activeRect = active.getBoundingClientRect()
      setIndicator({
        left: activeRect.left - trackRect.left,
        width: activeRect.width,
        height: activeRect.height,
      })
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(track)
    observer.observe(active)
    return () => observer.disconnect()
  }, [isAnnual])

  return (
    <div
      className="flex flex-col items-center gap-1"
      role="tablist"
      aria-label="Modalidad de pago"
    >
      <p className="w-full text-center text-sm leading-[1.4] text-[#43484e]">
        Modalidad de pago:
      </p>

      <div
        ref={trackRef}
        className="relative flex rounded-full border border-[#afb3ba] bg-white p-[5px]"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute top-[5px] rounded-full bg-[#272a2d] transition-[left,width] duration-300 ease-in-out motion-reduce:transition-none"
          style={{
            left: indicator.left,
            width: indicator.width,
            height: indicator.height,
          }}
        />

        <button
          ref={annualRef}
          type="button"
          role="tab"
          aria-selected={isAnnual}
          onClick={() => onChange("annual")}
          className={cn(
            "relative z-10 flex items-center justify-center gap-1 rounded-full px-4 py-2.5 text-[15px] font-medium leading-[22.5px] transition-colors duration-300",
            isAnnual ? "text-white" : "text-[#696e77]",
          )}
        >
          Anual
          <span className="rounded-[20px] bg-[#111113] px-1.5 py-1 text-center text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#ffc9ae]">
            ahorrás 20%
          </span>
        </button>

        <button
          ref={monthlyRef}
          type="button"
          role="tab"
          aria-selected={!isAnnual}
          onClick={() => onChange("monthly")}
          className={cn(
            "relative z-10 rounded-full px-6 py-2.5 text-[15px] font-medium leading-[22.5px] transition-colors duration-300",
            isAnnual ? "text-[#696e77]" : "text-white",
          )}
        >
          Mensual
        </button>
      </div>
    </div>
  )
}
