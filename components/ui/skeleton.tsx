import { cn } from "@/lib/utils"

type SkeletonProps = {
  className?: string
  /** Placeholders sobre fondos claros (tarjetas). */
  tone?: "light" | "dark"
}

export function Skeleton({ className, tone = "light" }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "skeleton-block rounded-md",
        tone === "dark" ? "skeleton-tone-dark" : "skeleton-tone-light",
        className,
      )}
    />
  )
}
