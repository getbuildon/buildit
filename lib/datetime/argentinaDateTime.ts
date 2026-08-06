export const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires" as const
export const ARGENTINA_LOCALE = "es-AR" as const

function parseArgentinaDate(value: string | Date | null | undefined): Date | null {
  if (value == null || value === "") return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function capitalizeEs(text: string): string {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function formatWithOptions(
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions,
  fallback = "—",
): string {
  const date = parseArgentinaDate(value)
  if (!date) return fallback

  return new Intl.DateTimeFormat(ARGENTINA_LOCALE, {
    timeZone: ARGENTINA_TIME_ZONE,
    ...options,
  }).format(date)
}

/** dd/MM/yyyy */
export function formatArgentinaCalendarDate(
  value: string | Date | null | undefined,
): string {
  return formatWithOptions(value, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

/** HH:mm (24 h) */
export function formatArgentinaTime(value: string | Date | null | undefined): string {
  return formatWithOptions(value, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

/** dd/MM/yyyy HH:mm */
export function formatArgentinaDateTime(value: string | Date | null | undefined): string {
  const datePart = formatArgentinaCalendarDate(value)
  if (datePart === "—") return "—"
  return `${datePart} ${formatArgentinaTime(value)}`
}

/** 30 jul (listados compactos) */
export function formatArgentinaEntryDate(value: string | null | undefined): string {
  return formatWithOptions(value, {
    day: "numeric",
    month: "short",
  })
}

/** Jueves, 30 de julio de 2026 */
export function formatArgentinaLongDate(value: string | Date | null | undefined): string {
  return capitalizeEs(
    formatWithOptions(value, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  )
}

/** 30 jul 2026 */
export function formatArgentinaTaskDate(value: string | Date | null | undefined): string {
  return formatWithOptions(value, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/** 16:33 h */
export function formatArgentinaTaskTime(value: string | Date | null | undefined): string {
  const time = formatArgentinaTime(value)
  return time === "—" ? time : `${time} h`
}

/** 30 jul 2026 · 16:33 h */
export function formatArgentinaUnitTaskMeta(value: string): string {
  return `${formatArgentinaTaskDate(value)} · ${formatArgentinaTaskTime(value)}`
}

export function formatArgentinaTodayLabel(now: Date = new Date()): string {
  return formatArgentinaLongDate(now)
}
