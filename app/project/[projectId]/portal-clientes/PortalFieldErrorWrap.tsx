"use client"

import type { ReactNode } from "react"
import { FieldErrorTooltip } from "@/components/ui/field-error-tooltip"
import { cn } from "@/lib/utils"

export const PORTAL_FIELD_ERROR_BORDER_CLASSNAME =
  "border-[#eb8e90] focus-visible:border-[#eb8e90] focus-visible:ring-0"

type PortalFieldErrorWrapProps = {
  error?: string | null
  children: ReactNode
  className?: string
  fieldClassName?: string
  tooltipClassName?: string
  reserveRightSpace?: boolean
}

export function PortalFieldErrorWrap({
  error,
  children,
  className,
  fieldClassName,
  tooltipClassName = "top-1/2 right-3 -translate-y-1/2",
  reserveRightSpace = true,
}: PortalFieldErrorWrapProps) {
  const hasError = Boolean(error)

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className={cn(
          "w-full",
          hasError &&
            reserveRightSpace &&
            "[&_input]:pr-10 [&_textarea]:pr-10 [&_button]:pr-10",
          fieldClassName,
        )}
      >
        {children}
      </div>
      {hasError && error ? (
        <span
          className={cn(
            "pointer-events-auto absolute z-10",
            tooltipClassName,
          )}
        >
          <FieldErrorTooltip message={error} />
        </span>
      ) : null}
    </div>
  )
}
