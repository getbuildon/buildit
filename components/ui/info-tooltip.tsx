"use client"

import { useCallback, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

type InfoTooltipProps = {
  text: string
  className?: string
  iconClassName?: string
  side?: "top" | "bottom"
}

const TOOLTIP_WIDTH = 280
const TOOLTIP_GAP = 8
const VIEWPORT_PADDING = 8
const FLIP_THRESHOLD = 96

export function InfoTooltip({
  text,
  className,
  iconClassName,
  side = "bottom",
}: InfoTooltipProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    side: side,
  })
  const triggerRef = useRef<HTMLSpanElement>(null)

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    let nextSide = side
    if (side === "top" && rect.top < FLIP_THRESHOLD) nextSide = "bottom"
    if (side === "bottom" && window.innerHeight - rect.bottom < FLIP_THRESHOLD) {
      nextSide = "top"
    }

    const minLeft = VIEWPORT_PADDING + TOOLTIP_WIDTH / 2
    const maxLeft = window.innerWidth - VIEWPORT_PADDING - TOOLTIP_WIDTH / 2

    setPosition({
      top: nextSide === "top" ? rect.top - TOOLTIP_GAP : rect.bottom + TOOLTIP_GAP,
      left: Math.min(Math.max(rect.left + rect.width / 2, minLeft), maxLeft),
      side: nextSide,
    })
  }, [side])

  const show = () => {
    updatePosition()
    setVisible(true)
  }

  const hide = () => setVisible(false)

  return (
    <>
      <span
        ref={triggerRef}
        className={cn("inline-flex shrink-0 items-center", className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <Info
          className={cn("size-3 text-[#777b84]", iconClassName)}
          aria-label={text}
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
                transform:
                  position.side === "top"
                    ? "translate(-50%, -100%)"
                    : "translateX(-50%)",
              }}
              className="pointer-events-none fixed z-[9999] w-[280px] rounded-[8px] bg-[#111113] px-3 py-2 text-left text-[12px] font-normal leading-[1.4] tracking-[-0.36px] whitespace-pre-line text-white shadow-md"
            >
              {text}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
