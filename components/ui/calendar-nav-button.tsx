"use client"

import type { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type CalendarNavButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export function CalendarNavButton({
  className,
  children,
  ...props
}: CalendarNavButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-[#edeef0] bg-white transition-colors",
        "hover:border-[#ff7433] hover:bg-[#fffaf7]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7433]",
        "disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
