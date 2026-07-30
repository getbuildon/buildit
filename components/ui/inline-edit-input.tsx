import * as React from "react"

import { cn } from "@/lib/utils"

export const inlineFieldContainerClassName = cn(
  "flex h-8 min-w-0 items-center overflow-hidden rounded-lg border bg-white transition-[border-color,box-shadow]",
  "border-[#edeef0] focus-within:border-[#ff7433] focus-within:ring-2 focus-within:ring-[#ff7433]/15",
)

export const inlineFieldInputClassName = cn(
  "min-w-0 flex-1 border-0 bg-transparent px-2.5 text-[14px] font-normal text-[#363a3f] outline-none",
  "placeholder:text-[#afb3ba]",
)

type InlineEditInputProps = {
  value: string
  onChange: (value: string) => void
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  autoFocus?: boolean
  placeholder?: string
  invalid?: boolean
  disabled?: boolean
  className?: string
  inputClassName?: string
  "aria-label"?: string
}

const InlineEditInput = React.forwardRef<HTMLInputElement, InlineEditInputProps>(
  function InlineEditInput(
    {
      value,
      onChange,
      onKeyDown,
      autoFocus = false,
      placeholder,
      invalid = false,
      disabled = false,
      className,
      inputClassName,
      "aria-label": ariaLabel,
    },
    ref,
  ) {
    return (
      <div
        className={cn(
          inlineFieldContainerClassName,
          invalid && "border-[#ce2c31] focus-within:border-[#ce2c31] focus-within:ring-[#ce2c31]/15",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <input
          ref={ref}
          type="text"
          autoFocus={autoFocus}
          autoComplete="off"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-invalid={invalid}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          className={cn(inlineFieldInputClassName, inputClassName)}
        />
      </div>
    )
  },
)

export { InlineEditInput }
