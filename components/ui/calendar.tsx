"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { es } from "react-day-picker/locale"

import { cn } from "@/lib/utils"

import "react-day-picker/style.css"
import "./calendar.css"

function Calendar({
  className,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      locale={es}
      className={cn("build-on-calendar p-3", className)}
      {...props}
    />
  )
}

export { Calendar }
