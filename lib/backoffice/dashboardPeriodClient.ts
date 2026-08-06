import type { DashboardPeriodPreset } from "@/lib/backoffice/dashboardPeriod"

export function getArgentinaDatePartsForInput(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now)

  const year = parts.find((part) => part.type === "year")?.value ?? "2026"
  const month = parts.find((part) => part.type === "month")?.value ?? "01"
  const day = parts.find((part) => part.type === "day")?.value ?? "01"

  const today = `${year}-${month}-${day}`
  const monthStart = `${year}-${month}-01`

  return {
    from: monthStart,
    to: today,
  }
}

export function parseDashboardInputDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return undefined

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return undefined
  }

  return new Date(year, month - 1, day)
}

export function formatDashboardInputDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const year = parts.find((part) => part.type === "year")?.value ?? "2026"
  const month = parts.find((part) => part.type === "month")?.value ?? "01"
  const day = parts.find((part) => part.type === "day")?.value ?? "01"

  return `${year}-${month}-${day}`
}

export function toDashboardCalendarDate(date: Date): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const year = Number(parts.find((part) => part.type === "year")?.value)
  const month = Number(parts.find((part) => part.type === "month")?.value)
  const day = Number(parts.find((part) => part.type === "day")?.value)

  return new Date(year, month - 1, day)
}

export function serializeDashboardPeriodQuery(options: {
  period: DashboardPeriodPreset
  from?: string
  to?: string
  comparePeriod?: DashboardPeriodPreset | null
  compareFrom?: string
  compareTo?: string
}): string {
  const params = new URLSearchParams()
  params.set("period", options.period)

  if (options.period === "custom" && options.from && options.to) {
    params.set("from", options.from)
    params.set("to", options.to)
  }

  if (options.comparePeriod) {
    params.set("comparePeriod", options.comparePeriod)

    if (
      options.comparePeriod === "custom" &&
      options.compareFrom &&
      options.compareTo
    ) {
      params.set("compareFrom", options.compareFrom)
      params.set("compareTo", options.compareTo)
    }
  }

  const query = params.toString()
  return query ? `?${query}` : ""
}

export type { DashboardPeriodPreset }
