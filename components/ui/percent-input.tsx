import * as React from "react"

import { cn } from "@/lib/utils"

type PercentInputProps = {
  value: string
  onChange: (value: string) => void
  min?: number
  max?: number
  disabled?: boolean
  invalid?: boolean
  className?: string
  "aria-label"?: string
}

function sanitizePercentInput(raw: string): string {
  const normalized = raw.replace(",", ".")
  if (normalized === "") return ""

  const cleaned = normalized.replace(/[^\d.]/g, "")
  const [whole, ...rest] = cleaned.split(".")
  if (rest.length === 0) return whole

  return `${whole}.${rest.join("").slice(0, 1)}`
}

const PercentInput = React.forwardRef<HTMLInputElement, PercentInputProps>(
  function PercentInput(
    {
      value,
      onChange,
      min = 0.1,
      max = 100,
      disabled = false,
      invalid = false,
      className,
      "aria-label": ariaLabel = "Porcentaje",
    },
    ref,
  ) {
    return (
      <div
        className={cn(
          "inline-flex h-8 items-stretch overflow-hidden rounded-lg border bg-white transition-[border-color,box-shadow]",
          invalid
            ? "border-[#ce2c31] focus-within:border-[#ce2c31] focus-within:ring-2 focus-within:ring-[#ce2c31]/15"
            : disabled
              ? "border-[#edeef0] bg-[#f8f9fa]"
              : "border-[#edeef0] focus-within:border-[#ff7433] focus-within:ring-2 focus-within:ring-[#ff7433]/15",
          className,
        )}
      >
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          disabled={disabled}
          readOnly={disabled}
          aria-label={ariaLabel}
          aria-invalid={invalid}
          value={value}
          onChange={(event) => onChange(sanitizePercentInput(event.target.value))}
          onBlur={() => {
            if (disabled || !value.trim()) return
            const num = Number.parseFloat(value)
            if (!Number.isFinite(num)) {
              onChange("")
              return
            }
            const clamped = Math.min(max, Math.max(min, num))
            const rounded = Math.round(clamped * 10) / 10
            onChange(Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1))
          }}
          className={cn(
            "w-10 shrink-0 border-0 bg-transparent px-2 text-right text-[12px] font-medium tabular-nums outline-none placeholder:text-[#afb3ba]",
            disabled ? "cursor-not-allowed text-[#777b84]" : "text-[#363a3f]",
          )}
          placeholder="0"
        />
        <span className="flex w-7 shrink-0 items-center justify-center border-l border-[#edeef0] bg-[#f8f9fa] text-[12px] font-normal text-[#777b84]">
          %
        </span>
      </div>
    )
  },
)

export { PercentInput }
