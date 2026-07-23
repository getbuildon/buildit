"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const currentYear = new Date().getFullYear()
const DATE_PICKER_START_MONTH = new Date(currentYear - 50, 0, 1)
const DATE_PICKER_END_MONTH = new Date(currentYear + 30, 11, 31)

function resolveVisibleMonth(value?: Date, fromDate?: Date, toDate?: Date): Date {
  return value ?? fromDate ?? toDate ?? new Date()
}

type DatePickerProps = {
  id?: string
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  fromDate?: Date
  toDate?: Date
  popoverSide?: "top" | "bottom"
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled = false,
  className,
  fromDate,
  toDate,
  popoverSide = "top",
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => resolveVisibleMonth(value, fromDate, toDate))

  useEffect(() => {
    if (open) {
      setMonth(resolveVisibleMonth(value, fromDate, toDate))
    }
  }, [open, value, fromDate, toDate])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "inline-flex h-[42px] w-full min-w-0 items-center gap-2 overflow-hidden rounded-[10px] border border-[#afb3ba] bg-white px-3 text-left text-[14px] font-normal leading-[1.4] transition-[color,box-shadow,border-color] outline-none disabled:cursor-not-allowed disabled:opacity-50",
            "focus:border-[#ff7433] focus:ring-0",
            value ? "text-[#272a2d]" : "text-[#777b84]",
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-[#777b84]" aria-hidden />
          <span className="min-w-0 flex-1 truncate">
            {value ? format(value, "dd/MM/yyyy", { locale: es }) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side={popoverSide}
        sideOffset={8}
        avoidCollisions={false}
        className="w-auto p-0"
      >
        <Calendar
          mode="single"
          selected={value}
          month={month}
          onMonthChange={setMonth}
          onSelect={(date) => {
            onChange(date)
            if (date) setOpen(false)
          }}
          disabled={[
            fromDate ? { before: fromDate } : false,
            toDate ? { after: toDate } : false,
          ].filter(Boolean)}
          captionLayout="dropdown"
          navLayout="around"
          fixedWeeks
          reverseYears
          startMonth={DATE_PICKER_START_MONTH}
          endMonth={DATE_PICKER_END_MONTH}
        />
      </PopoverContent>
    </Popover>
  )
}
