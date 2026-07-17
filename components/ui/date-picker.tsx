"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DatePickerProps = {
  id?: string
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  fromDate?: Date
  toDate?: Date
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
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

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
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date)
            if (date) setOpen(false)
          }}
          disabled={[
            fromDate ? { before: fromDate } : false,
            toDate ? { after: toDate } : false,
          ].filter(Boolean)}
          defaultMonth={value ?? fromDate ?? toDate}
        />
      </PopoverContent>
    </Popover>
  )
}
