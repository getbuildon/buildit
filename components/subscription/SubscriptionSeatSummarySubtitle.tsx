"use client"

import { Info } from "lucide-react"
import { TEAM_SEAT_SUMMARY_TOOLTIP } from "@/lib/company/projectSubscriptionLimits"

type SubscriptionSeatSummarySubtitleProps = {
  text: string
  tooltip?: string
}

export function SubscriptionSeatSummarySubtitle({
  text,
  tooltip = TEAM_SEAT_SUMMARY_TOOLTIP,
}: SubscriptionSeatSummarySubtitleProps) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-[14px] font-normal leading-[1.4] text-[#43484e]">{text}</p>
      <div className="group relative flex shrink-0 items-center">
        <Info
          className="size-4 text-[#43484e]"
          aria-label={tooltip}
          tabIndex={0}
        />
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-50 hidden w-max max-w-[280px] -translate-x-1/2 rounded-[8px] bg-[#111113] px-3 py-2 text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-white group-focus-within:block group-hover:block"
        >
          {tooltip}
        </div>
      </div>
    </div>
  )
}
