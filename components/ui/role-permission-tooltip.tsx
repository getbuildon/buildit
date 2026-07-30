"use client"

import { useCallback, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

type RolePermissionTooltipProps = {
  description: string
  roles: string
  className?: string
  iconClassName?: string
}

export function RolePermissionTooltip({
  description,
  roles,
  className,
  iconClassName,
}: RolePermissionTooltipProps) {
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
        <Info
          className={cn("size-3.5 text-[#777b84]", iconClassName)}
          aria-label={description}
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
              className="pointer-events-none fixed z-[9999] flex w-[257px] flex-col gap-2 rounded-[8px] bg-[#111113] px-3 py-2 shadow-md"
            >
              <p className="text-center text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-white">
                {description}
              </p>
              <p className="text-center text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#afb3ba]">
                {roles}
              </p>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
