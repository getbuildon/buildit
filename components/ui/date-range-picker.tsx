"use client"

import { useEffect, useState } from "react"
import type { DateRange } from "react-day-picker"

import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const currentYear = new Date().getFullYear()
const DATE_PICKER_START_MONTH = new Date(currentYear - 50, 0, 1)
const DATE_PICKER_END_MONTH = new Date(currentYear + 30, 11, 31)

function resolveVisibleMonth(value?: DateRange): Date {
  return value?.from ?? value?.to ?? new Date()
}

type DateRangePickerProps = {
  value?: DateRange
  onApply: (range: { from: Date; to: Date }) => void
  disabled?: boolean
  trigger: React.ReactNode
  align?: "start" | "center" | "end"
}

export function DateRangePicker({
  value,
  onApply,
  disabled = false,
  trigger,
  align = "end",
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange | undefined>(value)
  const [month, setMonth] = useState(() => resolveVisibleMonth(value))

  useEffect(() => {
    if (open) {
      setDraft(value)
      setMonth(resolveVisibleMonth(value))
    }
  }, [open, value])

  const handleSelect = (range: DateRange | undefined) => {
    setDraft(range)

    if (!range?.from || !range?.to) return

    const from = range.from <= range.to ? range.from : range.to
    const to = range.from <= range.to ? range.to : range.from

    onApply({ from, to })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        {trigger}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={6}
        className="w-auto border-[#edeef0] p-0 shadow-[0_0_10px_rgba(243,103,31,0.08)]"
      >
        <Calendar
          mode="range"
          selected={draft}
          month={month}
          onMonthChange={setMonth}
          onSelect={handleSelect}
          numberOfMonths={1}
          captionLayout="dropdown"
          navLayout="around"
          fixedWeeks
          reverseYears
          startMonth={DATE_PICKER_START_MONTH}
          endMonth={DATE_PICKER_END_MONTH}
          disabled={{ after: new Date() }}
          className="build-on-calendar-compact p-2"
        />
      </PopoverContent>
    </Popover>
  )
}

export function periodFilterPillClassName(selected: boolean) {
  return cn(
    "rounded-[7px] px-2.5 py-1.5 text-xs font-medium leading-4 transition-colors disabled:opacity-60",
    selected
      ? "bg-[#111113] text-white"
      : "text-[#777b84] hover:text-[#363a3f]",
  )
}
