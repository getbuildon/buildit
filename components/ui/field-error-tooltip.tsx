"use client"

import { useCallback, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { CircleAlert } from "lucide-react"
import { cn } from "@/lib/utils"

type FieldErrorTooltipProps = {
  message: string
  className?: string
  iconClassName?: string
}

export function FieldErrorTooltip({
  message,
  className,
  iconClassName,
}: FieldErrorTooltipProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLSpanElement>(null)

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    setPosition({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
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
        className={cn("inline-flex shrink-0 items-center", className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <CircleAlert
          className={cn("size-3.5 text-[#ce2c31]", iconClassName)}
          aria-label={message}
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
                transform: "translateX(-50%)",
              }}
              className="pointer-events-none fixed z-[9999] w-max max-w-[240px] rounded-[8px] bg-[#111113] px-3 py-2 text-left text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-white shadow-md"
            >
              {message}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
