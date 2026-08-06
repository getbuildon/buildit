import { ARGENTINA_TIME_ZONE } from "@/lib/datetime/argentinaDateTime"

export type DashboardPeriodPreset = "always" | "this_month" | "last_month" | "custom"

export type DashboardPeriod = {
  preset: DashboardPeriodPreset
  start: Date
  end: Date
  startIso: string
  endIso: string
  label: string
}

const PRESETS = new Set<string>(["always", "this_month", "last_month", "custom"])

/** Inicio del historial para métricas "Siempre". */
const ALWAYS_START = { year: 2020, month: 1, day: 1 }

function getArgentinaDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ARGENTINA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const year = Number(parts.find((part) => part.type === "year")?.value)
  const month = Number(parts.find((part) => part.type === "month")?.value)
  const day = Number(parts.find((part) => part.type === "day")?.value)

  return { year, month, day }
}

export function startOfArgentinaDay(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0))
}

export function endOfArgentinaDay(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day + 1, 2, 59, 59, 999))
}

function parseIsoDate(value: string | undefined): Date | null {
  if (!value?.trim()) return null

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null
  }

  return startOfArgentinaDay(year, month, day)
}

function formatPeriodLabel(start: Date, end: Date): string {
  const startLabel = new Intl.DateTimeFormat("es-AR", {
    timeZone: ARGENTINA_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(start)

  const endLabel = new Intl.DateTimeFormat("es-AR", {
    timeZone: ARGENTINA_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(end)

  return `${startLabel} – ${endLabel}`
}

export function resolveDashboardPeriod(params: {
  period?: string
  from?: string
  to?: string
  now?: Date
}): DashboardPeriod {
  const now = params.now ?? new Date()
  const preset: DashboardPeriodPreset = PRESETS.has(params.period ?? "")
    ? (params.period as DashboardPeriodPreset)
    : "always"

  const { year, month, day } = getArgentinaDateParts(now)

  if (preset === "always") {
    const start = startOfArgentinaDay(
      ALWAYS_START.year,
      ALWAYS_START.month,
      ALWAYS_START.day,
    )
    const end = endOfArgentinaDay(year, month, day)

    return {
      preset,
      start,
      end,
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      label: "Siempre",
    }
  }

  if (preset === "last_month") {
    const lastMonthDate = new Date(Date.UTC(year, month - 2, 1))
    const lastYear = lastMonthDate.getUTCFullYear()
    const lastMonth = lastMonthDate.getUTCMonth() + 1
    const lastDay = new Date(Date.UTC(lastYear, lastMonth, 0)).getUTCDate()

    const start = startOfArgentinaDay(lastYear, lastMonth, 1)
    const end = endOfArgentinaDay(lastYear, lastMonth, lastDay)

    return {
      preset,
      start,
      end,
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      label: formatPeriodLabel(start, end),
    }
  }

  if (preset === "custom") {
    const fromDate = parseIsoDate(params.from)
    const toDate = parseIsoDate(params.to)

    if (fromDate && toDate && fromDate <= toDate) {
      const toParts = getArgentinaDateParts(toDate)
      const start = fromDate
      const end = endOfArgentinaDay(toParts.year, toParts.month, toParts.day)

      return {
        preset,
        start,
        end,
        startIso: start.toISOString(),
        endIso: end.toISOString(),
        label: formatPeriodLabel(start, end),
      }
    }
  }

  const start = startOfArgentinaDay(year, month, 1)
  const end = endOfArgentinaDay(year, month, day)

  return {
    preset: preset === "custom" ? "this_month" : preset,
    start,
    end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    label: formatPeriodLabel(start, end),
  }
}

export function serializeDashboardPeriodQuery(period: DashboardPeriod): string {
  const params = new URLSearchParams()
  params.set("period", period.preset)

  if (period.preset === "custom") {
    const fromParts = getArgentinaDateParts(period.start)
    const toParts = getArgentinaDateParts(period.end)

    params.set(
      "from",
      `${fromParts.year}-${String(fromParts.month).padStart(2, "0")}-${String(fromParts.day).padStart(2, "0")}`,
    )
    params.set(
      "to",
      `${toParts.year}-${String(toParts.month).padStart(2, "0")}-${String(toParts.day).padStart(2, "0")}`,
    )
  }

  const query = params.toString()
  return query ? `?${query}` : ""
}

export function isWithinPeriod(
  value: string | null | undefined,
  period: DashboardPeriod,
): boolean {
  if (!value) return false

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  return date >= period.start && date <= period.end
}

export function isOnOrBeforePeriodEnd(
  value: string | null | undefined,
  period: DashboardPeriod,
): boolean {
  if (!value) return false

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  return date <= period.end
}
