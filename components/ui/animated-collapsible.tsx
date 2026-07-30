"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export const ANIMATED_COLLAPSE_DURATION_MS = 300

type AnimatedCollapsibleProps = {
  open: boolean
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function AnimatedCollapsible({
  open,
  children,
  className,
  contentClassName,
}: AnimatedCollapsibleProps) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows] ease-in-out",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        className,
      )}
      style={{ transitionDuration: `${ANIMATED_COLLAPSE_DURATION_MS}ms` }}
    >
      <div className={cn("min-h-0 overflow-hidden", contentClassName)}>
        {children}
      </div>
    </div>
  )
}
