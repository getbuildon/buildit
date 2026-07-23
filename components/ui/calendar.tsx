"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { es } from "react-day-picker/locale"

import { cn } from "@/lib/utils"
import { CalendarDropdown } from "@/components/ui/calendar-dropdown"
import { CalendarNavButton } from "@/components/ui/calendar-nav-button"

import "react-day-picker/style.css"
import "./calendar.css"

function Calendar({
  className,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      locale={es}
      className={cn("build-on-calendar p-4", className)}
      components={{
        Dropdown: CalendarDropdown,
        PreviousMonthButton: CalendarNavButton,
        NextMonthButton: CalendarNavButton,
        ...components,
      }}
      {...props}
    />
  )
}

export { Calendar }
