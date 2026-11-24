import { format, isValid, parse } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays } from "lucide-react"
import { useState, type ComponentProps } from "react"
import { cn } from "../../lib/cn"
import { Icon } from "../../atoms/icon/Icon"
import { Calendar } from "../calendar/Calendar"
import { InputGroup } from "../input-group/InputGroup"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "../popover/Popover"

const PATTERN = "dd/MM/yyyy"

/** "30072026" o "30/07/2026" → "30/07/2026" mientras se escribe. */
function maskDate(text: string): string {
  const digits = text.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function parseDate(text: string): Date | undefined {
  const date = parse(text, PATTERN, new Date())
  return isValid(date) && date.getFullYear() > 1900 ? date : undefined
}

export type DatePickerProps = Omit<ComponentProps<"input">, "value" | "onChange" | "defaultValue" | "size" | "min" | "max"> & {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  /** Primera y última fecha que se pueden elegir. */
  min?: Date
  max?: Date
  size?: "compact" | "default"
  invalid?: boolean
}

/**
 * Fecha: se escribe (30/07/2026, las barras se ponen solas) o se elige en el
 * calendario. Hoy la app solo deja elegir en el calendario: para una fecha de hace
 * dos años había que tocar 24 veces la flecha.
 *
 * Devuelve una fecha local a las 00:00 (sin hora ni zona). Para mostrarla en otra
 * parte, formatDate(fecha, "table").
 */
export function DatePicker({
  value,
  onChange,
  min,
  max,
  size,
  invalid,
  disabled,
  placeholder = "dd/mm/aaaa",
  className,
  "aria-invalid": ariaInvalid,
  ...props
}: DatePickerProps) {
  const [text, setText] = useState(value ? format(value, PATTERN) : "")
  const [lastValue, setLastValue] = useState(value)
  const [open, setOpen] = useState(false)
  const [typedInvalid, setTypedInvalid] = useState(false)

  // Si el valor cambia desde afuera (calendario, reset del form), se actualiza el texto.
  if (value !== lastValue) {
    setLastValue(value)
    setText(value ? format(value, PATTERN) : "")
    setTypedInvalid(false)
  }

  const outOfRange = (date: Date) => (min && date < min) || (max && date > max)

  const commit = () => {
    if (text === "") {
      setTypedInvalid(false)
      if (value) onChange(undefined)
      return
    }
    const date = parseDate(text)
    if (!date || outOfRange(date)) {
      setTypedInvalid(true)
      return
    }
    setTypedInvalid(false)
    if (!value || date.getTime() !== value.getTime()) onChange(date)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* El calendario se alinea con el campo entero, no con el botón chico. */}
      <PopoverAnchor asChild>
        <div className={cn("w-full", className)}>
          <InputGroup
            {...props}
            value={text}
            placeholder={placeholder}
            inputMode="numeric"
            autoComplete="off"
            size={size}
            disabled={disabled}
            invalid={invalid || typedInvalid || ariaInvalid === true || ariaInvalid === "true"}
            onChange={(event) => setText(maskDate(event.target.value))}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") commit()
              if (event.key === "ArrowDown" && event.altKey) setOpen(true)
            }}
            end={
              <PopoverTrigger
                disabled={disabled}
                aria-label="Elegir en el calendario"
                className="focus-ring state-veil -mr-compact inline-flex size-8 cursor-pointer items-center justify-center rounded-compact text-ink-muted disabled:cursor-not-allowed"
              >
                <Icon icon={CalendarDays} />
              </PopoverTrigger>
            }
          />
        </div>
      </PopoverAnchor>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          defaultMonth={value ?? min ?? new Date()}
          disabled={[...(min ? [{ before: min }] : []), ...(max ? [{ after: max }] : [])]}
          onSelect={(date) => {
            onChange(date)
            setOpen(false)
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

/** Para mostrar una fecha elegida con el formato corto de la librería. */
export function formatPickedDate(date: Date | undefined): string {
  return date ? format(date, "d MMM yyyy", { locale: es }).replace(".", "") : "—"
}
