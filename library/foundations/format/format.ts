/**
 * Formato de BuildOn: plata, números, porcentajes, superficie y fechas.
 * Un solo idioma (es-AR) y una sola zona horaria (Buenos Aires).
 *
 * Reúne en un lugar lo que hoy la app formatea en varios archivos de `lib/`
 * (argentinaDateTime, pricingPlans, dashboardProgress, totalSurfaceInput).
 * Diferencia a propósito: los porcentajes usan coma decimal ("45,5%"), como
 * el resto de los números en es-AR. La app hoy muestra "45.5%".
 */

export const LOCALE = "es-AR" as const
export const TIME_ZONE = "America/Argentina/Buenos_Aires" as const
/** Lo que se muestra cuando no hay dato. */
export const EMPTY = "—" as const

type Maybe<T> = T | null | undefined

function isNumber(value: Maybe<number>): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

/* ------------------------------------------------------------------ Números */

/** 1.234.567 · 1.234,5 */
export function formatNumber(value: Maybe<number>, maxDecimals = 2): string {
  if (!isNumber(value)) return EMPTY
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: maxDecimals }).format(value)
}

export type Currency = "ARS" | "USD"

/**
 * $ 1.234.567 (pesos) · US$ 120 (dólares).
 * Sin centavos por defecto: la app muestra montos enteros.
 */
export function formatMoney(
  value: Maybe<number>,
  { currency = "ARS", decimals = 0 }: { currency?: Currency; decimals?: number } = {},
): string {
  if (!isNumber(value)) return EMPTY
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/** Abreviado para ejes y espacios chicos: 684 mil · 1,3 M. El valor completo va en otro lado. */
export function formatCompact(value: Maybe<number>): string {
  if (!isNumber(value)) return EMPTY
  // "es" y no "es-AR": es-AR abrevia los miles con "k" (684 k); "es" dice "684 mil",
  // como se habla acá. Mismo separador decimal (coma).
  // Espacio que no se corta (\u00a0): «684 mil» no se parte en dos líneas en un eje.
  return new Intl.NumberFormat("es", { notation: "compact", maximumFractionDigits: 1 }).format(value).replace(/ /g, "\u00a0")
}

/** Plata abreviada: $ 684 mil · $ 1,3 M (pesos) · US$ 12 mil. */
export function formatMoneyCompact(value: Maybe<number>, currency: Currency = "ARS"): string {
  if (!isNumber(value)) return EMPTY
  return `${currency === "USD" ? "US$" : "$"}\u00a0${formatCompact(value)}`
}

/** 45% · 45,5% · 0,01%. Recibe el porcentaje (45), no la fracción (0.45). */
export function formatPercent(value: Maybe<number>, maxDecimals = 2): string {
  if (!isNumber(value)) return EMPTY
  return `${formatNumber(value, maxDecimals)}%`
}

/** 1.250,5 m² */
export function formatArea(value: Maybe<number>, maxDecimals = 2): string {
  if (!isNumber(value)) return EMPTY
  return `${formatNumber(value, maxDecimals)} m²`
}

/* ------------------------------------------------------------------ Fechas */

function toDate(value: Maybe<string | Date>): Date | null {
  if (value == null || value === "") return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function parts(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...options }).formatToParts(date)
}

function part(list: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return list.find((item) => item.type === type)?.value ?? ""
}

const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const

export type DateFormat =
  /** 30/07/2026: formularios y exportaciones */
  | "numeric"
  /** 30 jul 2026: tablas y listados */
  | "table"
  /** 30 jul: listas compactas del mismo año */
  | "compact"
  /** Jueves, 30 de julio de 2026: encabezados */
  | "long"
  /** 16:33 h */
  | "time"
  /** 30 jul 2026 · 16:33 h */
  | "datetime"

export function formatDate(value: Maybe<string | Date>, format: DateFormat = "table"): string {
  const date = toDate(value)
  if (!date) return EMPTY

  const numeric = parts(date, { day: "numeric", month: "numeric", year: "numeric" })
  const day = Number(part(numeric, "day"))
  const month = Number(part(numeric, "month"))
  const year = part(numeric, "year")
  const time = parts(date, { hour: "2-digit", minute: "2-digit", hour12: false })
  const hhmm = `${part(time, "hour")}:${part(time, "minute")} h`

  switch (format) {
    case "numeric":
      return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`
    case "table":
      return `${day} ${MONTHS_SHORT[month - 1]} ${year}`
    case "compact":
      return `${day} ${MONTHS_SHORT[month - 1]}`
    case "long": {
      const text = new Intl.DateTimeFormat(LOCALE, {
        timeZone: TIME_ZONE,
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date)
      return text.charAt(0).toUpperCase() + text.slice(1)
    }
    case "time":
      return hhmm
    case "datetime":
      return `${day} ${MONTHS_SHORT[month - 1]} ${year} · ${hhmm}`
  }
}
