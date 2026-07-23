"use client"

import type { ChangeEventHandler } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type CalendarDropdownOption = {
  value: number
  label: string
  disabled?: boolean
}

type CalendarDropdownProps = {
  options?: CalendarDropdownOption[]
  value?: number | string | readonly string[]
  onChange?: ChangeEventHandler<HTMLSelectElement>
  disabled?: boolean
  className?: string
  "aria-label"?: string
}

export function CalendarDropdown({
  options = [],
  value,
  onChange,
  disabled,
  className,
  "aria-label": ariaLabel,
}: CalendarDropdownProps) {
  const isYearDropdown = className?.includes("years_dropdown") ?? false
  const selectedValue =
    typeof value === "number" ? value : value !== undefined ? Number(value) : undefined

  return (
    <Select
      value={selectedValue !== undefined && !Number.isNaN(selectedValue) ? String(selectedValue) : undefined}
      onValueChange={(nextValue) => {
        onChange?.({
          target: { value: nextValue },
        } as React.ChangeEvent<HTMLSelectElement>)
      }}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        className={cn(
          "h-9 shrink-0 border-[#afb3ba] px-2.5 text-[13px] shadow-none",
          isYearDropdown ? "w-[88px]" : "w-[118px] capitalize",
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" className="z-[70] max-h-60">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={String(option.value)}
            disabled={option.disabled}
            className={cn(!isYearDropdown && "capitalize")}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
