import { endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays } from "lucide-react"
import { useState } from "react"
import type { DateRange } from "react-day-picker"
import { cn } from "../../lib/cn"
import { Button } from "../../atoms/button/Button"
import { fieldStyles } from "../../atoms/input/Input"
import { Icon } from "../../atoms/icon/Icon"
import { Calendar } from "../calendar/Calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../popover/Popover"

export type { DateRange }

export type DateRangePreset = { label: string; range: () => DateRange }

/** Atajos habituales para reportes (como Stripe y Linear). */
export const defaultRangePresets: DateRangePreset[] = [
  { label: "Últimos 7 días", range: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: "Últimos 30 días", range: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: "Este mes", range: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  {
    label: "Mes pasado",
    range: () => {
      const last = subMonths(new Date(), 1)
      return { from: startOfMonth(last), to: endOfMonth(last) }
    },
  },
]

function label(range: DateRange | undefined): string | undefined {
  if (!range?.from) return undefined
  const short = (date: Date) => format(date, "d MMM yyyy", { locale: es }).replace(".", "")
  return range.to ? `${short(range.from)} – ${short(range.to)}` : `Desde ${short(range.from)}`
}

export type DateRangePickerProps = {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  placeholder?: string
  /** Atajos a la izquierda del calendario. [] para no mostrar ninguno. */
  presets?: DateRangePreset[]
  size?: "compact" | "default"
  disabled?: boolean
  id?: string
  "aria-label"?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean | "true" | "false"
  className?: string
}

/**
 * Rango de fechas: un período de reporte o de facturación. Dos meses a la vista en
 * pantallas grandes, uno en el celular. Con atajos (últimos 30 días, este mes).
 * Se aplica con «Aplicar»: elegir un rango son dos clics y no tiene que cerrarse a mitad.
 */
export function DateRangePicker({
  value,
  onChange,
  placeholder = "Elegí un período",
  presets = defaultRangePresets,
  size,
  disabled,
  className,
  "aria-invalid": ariaInvalid,
  ...props
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange | undefined>(value)
  const text = label(value)

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(value)
        setOpen(next)
      }}
    >
      <PopoverTrigger
        {...props}
        disabled={disabled}
        aria-invalid={ariaInvalid === true || ariaInvalid === "true" || undefined}
        className={cn(fieldStyles({ size }), "flex cursor-pointer items-center gap-compact text-left", !text && "text-ink-subtle", className)}
      >
        <Icon icon={CalendarDays} className="text-ink-muted" />
        <span className="min-w-0 flex-1 truncate">{text ?? placeholder}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-auto max-w-[calc(100vw-2*var(--space-group))] flex-col p-0 sm:flex-row">
        {presets.length > 0 ? (
          <ul className="flex shrink-0 gap-related overflow-x-auto border-b border-line p-snug sm:w-44 sm:flex-col sm:border-r sm:border-b-0">
            {presets.map((preset) => (
              <li key={preset.label}>
                <Button variant="ghost" size="compact" className="w-full justify-start" onClick={() => setDraft(preset.range())}>
                  {preset.label}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-col">
          <Calendar
            mode="range"
            selected={draft}
            onSelect={setDraft}
            numberOfMonths={2}
            // Sin días del mes vecino: con dos meses a la vista, aparecían pintados dos veces dentro del rango.
            showOutsideDays={false}
            defaultMonth={draft?.from ?? subMonths(new Date(), 1)}
            classNames={{ months: "flex flex-col gap-group md:flex-row" }}
          />
          <div className="flex items-center justify-between gap-snug border-t border-line p-snug">
            <p className="text-meta text-ink-muted" aria-live="polite">
              {label(draft) ?? "Elegí el primer día"}
            </p>
            <div className="flex gap-compact">
              <Button
                variant="ghost"
                size="compact"
                onClick={() => {
                  setDraft(undefined)
                  onChange(undefined)
                  setOpen(false)
                }}
              >
                Limpiar
              </Button>
              <Button
                size="compact"
                disabled={!draft?.from}
                onClick={() => {
                  onChange(draft?.from && !draft.to ? { from: draft.from, to: draft.from } : draft)
                  setOpen(false)
                }}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
