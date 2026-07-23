"use client"

import { CERTIFICACION_CHECKBOX } from "@/lib/project/certificacionesDesignTokens"
import { cn } from "@/lib/utils"

type CertificacionCheckboxProps = {
  checked: boolean
  indeterminate?: boolean
  disabled?: boolean
  onCheckedChange?: (checked: boolean) => void
  ariaLabel: string
  className?: string
}

export function CertificacionCheckbox({
  checked,
  indeterminate = false,
  disabled = false,
  onCheckedChange,
  ariaLabel,
  className,
}: CertificacionCheckboxProps) {
  const isActive = checked || indeterminate

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        if (disabled || !onCheckedChange) return
        onCheckedChange(!checked)
      }}
      className={cn(
        CERTIFICACION_CHECKBOX.base,
        isActive ? CERTIFICACION_CHECKBOX.checked : CERTIFICACION_CHECKBOX.unchecked,
        disabled && CERTIFICACION_CHECKBOX.disabled,
        className,
      )}
    >
      {checked && !indeterminate ? (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
      {indeterminate ? <span className="h-0.5 w-2 rounded-full bg-white" aria-hidden /> : null}
    </button>
  )
}
