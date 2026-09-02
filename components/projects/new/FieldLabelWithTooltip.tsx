"use client"

import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

type FieldLabelWithTooltipProps = {
  label: string
  tooltip: string
  htmlFor?: string
  required?: boolean
  className?: string
  labelClassName?: string
  labelStyle?: React.CSSProperties
}

export function FieldLabelWithTooltip({
  label,
  tooltip,
  htmlFor,
  required = false,
  className,
  labelClassName,
  labelStyle,
}: FieldLabelWithTooltipProps) {
  const displayLabel = required ? `${label} *` : label

  return (
    <div className={cn("flex min-w-0 items-center gap-1", className)}>
      <label
        htmlFor={htmlFor}
        title={displayLabel}
        className={cn("min-w-0 truncate", labelClassName)}
        style={labelStyle}
      >
        {displayLabel}
      </label>
      <div className="group relative flex shrink-0 items-center">
        <Info
          className="size-3 text-[#45556c] outline-none"
          aria-label={tooltip}
        />
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-50 hidden w-[240px] -translate-x-1/2 rounded-[8px] bg-[#111113] px-3 py-2 text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-white group-focus-within:block group-hover:block"
        >
          {tooltip}
        </div>
      </div>
    </div>
  )
}

export const FLOOR_IDENTIFIER_TOOLTIP =
  "Nombre abreviado del nivel. Se utilizará para facilitar su identificación. Ej: P01 , P02, PB, SS. (max. 4 caracteres)"

export const UNIT_CODE_TOOLTIP =
  "Nombre abreviado de la unidad. Se utilizará para facilitar su identificación. Ej: 101, 1B. (max. 4 caracteres)"
