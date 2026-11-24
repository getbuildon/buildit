import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ComponentProps } from "react"
import { DayPicker } from "react-day-picker"
import { es } from "react-day-picker/locale"
import { cn } from "../../lib/cn"
import { Icon } from "../../atoms/icon/Icon"

export type CalendarProps = ComponentProps<typeof DayPicker>

/**
 * Calendario en español, con los colores y medidas de la librería (reemplaza el
 * calendar.css de 143 líneas de la app). Días de 40 px, flechas de 36 con foco
 * visible, hoy en naranja, rangos con fondo continuo. Se navega con las flechas del
 * teclado (PageUp/PageDown cambian de mes).
 */
export function Calendar({ className, classNames, components, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={es}
      showOutsideDays={showOutsideDays}
      className={cn("relative select-none p-snug text-ink", className)}
      classNames={{
        months: "flex flex-col gap-group sm:flex-row",
        month: "flex flex-col gap-compact",
        month_caption: "flex h-control-compact items-center justify-center",
        caption_label: "text-label first-letter:uppercase",
        nav: "pointer-events-none absolute inset-x-snug top-snug flex h-control-compact items-center justify-between",
        button_previous:
          "focus-ring state-veil pointer-events-auto inline-flex size-control-compact cursor-pointer items-center justify-center rounded-control text-ink-muted disabled:cursor-not-allowed disabled:opacity-(--state-disabled-opacity)",
        button_next:
          "focus-ring state-veil pointer-events-auto inline-flex size-control-compact cursor-pointer items-center justify-center rounded-control text-ink-muted disabled:cursor-not-allowed disabled:opacity-(--state-disabled-opacity)",
        month_grid: "border-collapse",
        weekdays: "",
        weekday: "h-8 w-10 text-meta font-regular text-ink-muted first-letter:uppercase",
        week: "",
        day: "p-0 text-center",
        day_button:
          "focus-ring state-veil inline-flex size-10 cursor-pointer items-center justify-center rounded-control text-body tabular-nums disabled:cursor-not-allowed",
        today: "[&>button]:font-semibold [&>button]:text-action-text",
        outside: "[&>button]:text-ink-subtle",
        disabled: "[&>button]:text-ink-disabled [&>button]:opacity-(--state-disabled-opacity)",
        selected: "[&>button]:bg-action [&>button]:text-action-ink! [&>button]:font-medium",
        range_start: "rounded-l-control bg-action-soft",
        range_end: "rounded-r-control bg-action-soft",
        range_middle: "bg-action-soft [&>button]:bg-transparent! [&>button]:text-ink! [&>button]:font-regular!",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => <Icon icon={orientation === "left" ? ChevronLeft : ChevronRight} />,
        ...components,
      }}
      {...props}
    />
  )
}
