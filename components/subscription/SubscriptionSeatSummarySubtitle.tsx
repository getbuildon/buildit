"use client"

import { useCallback, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Info } from "lucide-react"
import { TEAM_SEAT_SUMMARY_TOOLTIP } from "@/lib/company/projectSubscriptionLimits"
import { cn } from "@/lib/utils"

const TOOLTIP_MAX_WIDTH = 280
const VIEWPORT_PADDING = 16

function clampTooltipCenterX(centerX: number, maxWidth: number): number {
  const width = Math.min(maxWidth, window.innerWidth - VIEWPORT_PADDING * 2)
  const halfWidth = width / 2
  return Math.max(
    VIEWPORT_PADDING + halfWidth,
    Math.min(centerX, window.innerWidth - VIEWPORT_PADDING - halfWidth),
  )
}

type SubscriptionSeatSummarySubtitleProps = {
  text: string
  tooltip?: string
}

export function SubscriptionSeatSummarySubtitle({
  text,
  tooltip = TEAM_SEAT_SUMMARY_TOOLTIP,
}: SubscriptionSeatSummarySubtitleProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, maxWidth: TOOLTIP_MAX_WIDTH })
  const triggerRef = useRef<HTMLSpanElement>(null)

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const maxWidth = Math.min(
      TOOLTIP_MAX_WIDTH,
      window.innerWidth - VIEWPORT_PADDING * 2,
    )

    setPosition({
      top: rect.top - 6,
      left: clampTooltipCenterX(rect.left + rect.width / 2, TOOLTIP_MAX_WIDTH),
      maxWidth,
    })
  }, [])

  const show = () => {
    updatePosition()
    setVisible(true)
  }

  const hide = () => setVisible(false)

  return (
    <div className="flex items-center gap-2">
      <p className="text-[14px] font-normal leading-[1.4] text-[#43484e]">{text}</p>
      <span
        ref={triggerRef}
        className="inline-flex shrink-0 items-center"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <Info
          className="size-4 text-[#43484e]"
          aria-label={tooltip}
          tabIndex={0}
        />
      </span>
      {visible && typeof document !== "undefined"
        ? createPortal(
            <div
              role="tooltip"
              style={{
                top: position.top,
                left: position.left,
                maxWidth: position.maxWidth,
                transform: "translate(-50%, -100%)",
              }}
              className={cn(
                "pointer-events-none fixed z-[9999] rounded-[8px] bg-[#111113] px-3 py-2",
                "text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-white shadow-md",
              )}
            >
              {tooltip}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
