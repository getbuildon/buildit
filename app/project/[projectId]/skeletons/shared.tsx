import type { ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export const PAGE_CARD_SHADOW = "0 0 5px rgba(243, 103, 31, 0.08)"
export const PAGE_CARD_SHADOW_SOFT = "0 0 10px rgba(243, 103, 31, 0.08)"

export function GhostPage({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn("flex flex-col", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      {children}
      <span className="sr-only">{label}</span>
    </div>
  )
}

export function GhostCard({
  className,
  shadow = PAGE_CARD_SHADOW,
  children,
}: {
  className?: string
  shadow?: string
  children?: ReactNode
}) {
  return (
    <div
      className={cn("rounded-[14px] border border-[#edeef0] bg-white", className)}
      style={{ boxShadow: shadow }}
      aria-hidden
    >
      {children}
    </div>
  )
}

export function GhostBar({ className }: { className?: string }) {
  return <Skeleton className={cn("rounded-[8px]", className)} />
}
