import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type CompanyLogoMarkProps = {
  logoUrl?: string | null
  alt: string
  className?: string
  imageClassName?: string
  fallback: ReactNode
}

export function CompanyLogoMark({
  logoUrl,
  alt,
  className,
  imageClassName,
  fallback,
}: CompanyLogoMarkProps) {
  if (!logoUrl) {
    return (
      <div className={cn("flex items-center justify-center overflow-hidden", className)}>
        {fallback}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden",
        className,
        "bg-transparent",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={alt}
        className={cn(
          "absolute inset-0 size-full object-cover object-center",
          imageClassName,
        )}
      />
    </div>
  )
}
