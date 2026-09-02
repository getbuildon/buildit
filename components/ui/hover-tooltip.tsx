"use client"

import { useCallback, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

type HoverTooltipProps = {
  text: string
  children: ReactNode
  className?: string
}

export function HoverTooltip({ text, children, className }: HoverTooltipProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLSpanElement>(null)

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const padding = 8
    setPosition({
      top: rect.top - 8,
      left: Math.min(
        Math.max(rect.left + rect.width / 2, padding),
        window.innerWidth - padding,
      ),
    })
  }, [])

  const show = () => {
    updatePosition()
    setVisible(true)
  }

  const hide = () => setVisible(false)

  return (
    <>
      <span
        ref={triggerRef}
        className={cn("inline-flex", className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {visible && typeof document !== "undefined"
        ? createPortal(
            <div
              role="tooltip"
              style={{
                top: position.top,
                left: position.left,
                transform: "translate(-50%, -100%)",
              }}
              className="pointer-events-none fixed z-[9999] whitespace-nowrap rounded-[8px] bg-[#111113] px-2.5 py-1.5 text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-white shadow-md"
            >
              {text}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
