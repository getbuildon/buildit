"use client"

import { InfoTooltip } from "@/components/ui/info-tooltip"
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
      <InfoTooltip
        text={tooltip}
        side="top"
        iconClassName="size-3 text-[#45556c]"
      />
    </div>
  )
}

export const FLOOR_IDENTIFIER_TOOLTIP =
  "Nombre abreviado del nivel. Se utilizará para facilitar su identificación. Ej: P01, P02, PB, SS."

export const UNIT_CODE_TOOLTIP =
  "Nombre abreviado de la unidad. Se utilizará para facilitar su identificación. Ej: 101, 1B."
