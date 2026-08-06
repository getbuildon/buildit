import { subMonths, subYears } from "date-fns"

import type { BackofficeBillingInterval } from "@/lib/backoffice/projectSubscriptionForm"
import { formatDashboardUsd } from "@/lib/backoffice/clientesBilling"

export type SubscriptionPlanPriceSnapshot = {
  id: string
  label: string
  monthlyPriceUsd: number | null
  annualMonthlyPriceUsd: number | null
}

export type SubscriptionProrationInput = {
  fromPlan: SubscriptionPlanPriceSnapshot
  toPlan: SubscriptionPlanPriceSnapshot
  billingInterval: BackofficeBillingInterval
  periodStart: Date
  periodEnd: Date
  effectiveAt?: Date
}

export type SubscriptionProrationResult = {
  canCalculate: boolean
  skipReason?: string
  isPlanChange: boolean
  isUpgrade: boolean
  billingInterval: BackofficeBillingInterval
  periodStart: Date
  periodEnd: Date
  effectiveAt: Date
  daysInPeriod: number
  daysRemaining: number
  fromPeriodPriceUsd: number | null
  toPeriodPriceUsd: number | null
  creditUsd: number
  chargeUsd: number
  netAmountUsd: number
}

function roundUsd(value: number): number {
  return Math.round(value * 100) / 100
}

export function getSubscriptionPeriodPriceUsd(
  plan: Pick<
    SubscriptionPlanPriceSnapshot,
    "monthlyPriceUsd" | "annualMonthlyPriceUsd"
  >,
  billingInterval: BackofficeBillingInterval,
): number | null {
  if (billingInterval === "annual") {
    if (plan.annualMonthlyPriceUsd != null) {
      return plan.annualMonthlyPriceUsd * 12
    }
    if (plan.monthlyPriceUsd != null) {
      return plan.monthlyPriceUsd * 12
    }
    return null
  }

  return plan.monthlyPriceUsd ?? plan.annualMonthlyPriceUsd
}

export function getCurrentPeriodStart(
  periodEnd: Date,
  billingInterval: BackofficeBillingInterval,
): Date {
  return billingInterval === "annual"
    ? subYears(periodEnd, 1)
    : subMonths(periodEnd, 1)
}

function diffDays(start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / msPerDay))
}

export function computeSubscriptionProration(
  input: SubscriptionProrationInput,
): SubscriptionProrationResult {
  const effectiveAt = input.effectiveAt ?? new Date()
  const periodStart = input.periodStart
  const periodEnd = input.periodEnd

  const base = {
    canCalculate: false,
    isPlanChange: input.fromPlan.id !== input.toPlan.id,
    isUpgrade: false,
    billingInterval: input.billingInterval,
    periodStart,
    periodEnd,
    effectiveAt,
    daysInPeriod: 0,
    daysRemaining: 0,
    fromPeriodPriceUsd: getSubscriptionPeriodPriceUsd(
      input.fromPlan,
      input.billingInterval,
    ),
    toPeriodPriceUsd: getSubscriptionPeriodPriceUsd(
      input.toPlan,
      input.billingInterval,
    ),
    creditUsd: 0,
    chargeUsd: 0,
    netAmountUsd: 0,
  } satisfies Omit<SubscriptionProrationResult, "skipReason">

  if (periodEnd.getTime() <= effectiveAt.getTime()) {
    return {
      ...base,
      skipReason: "El período de facturación actual ya venció.",
    }
  }

  const daysInPeriod = Math.max(1, diffDays(periodStart, periodEnd))
  const daysRemaining = Math.max(
    0,
    Math.min(daysInPeriod, diffDays(effectiveAt, periodEnd)),
  )

  if (daysRemaining === 0) {
    return {
      ...base,
      daysInPeriod,
      daysRemaining,
      skipReason: "No quedan días por prorratear en el período actual.",
    }
  }

  const fromPrice = base.fromPeriodPriceUsd
  const toPrice = base.toPeriodPriceUsd

  const priceChanged =
    fromPrice !== toPrice ||
    input.fromPlan.monthlyPriceUsd !== input.toPlan.monthlyPriceUsd ||
    input.fromPlan.annualMonthlyPriceUsd !== input.toPlan.annualMonthlyPriceUsd

  if (!base.isPlanChange && !priceChanged) {
    return {
      ...base,
      daysInPeriod,
      daysRemaining,
      canCalculate: true,
      skipReason: "No hay cambio de plan ni de precio.",
    }
  }

  if (fromPrice == null || toPrice == null) {
    return {
      ...base,
      daysInPeriod,
      daysRemaining,
      skipReason:
        "Este plan requiere cotización manual. Registrá el ajuste en la nota de facturación.",
    }
  }

  const ratio = daysRemaining / daysInPeriod
  const creditUsd = roundUsd(fromPrice * ratio)
  const chargeUsd = roundUsd(toPrice * ratio)
  const netAmountUsd = roundUsd(chargeUsd - creditUsd)

  return {
    ...base,
    daysInPeriod,
    daysRemaining,
    canCalculate: true,
    isUpgrade: netAmountUsd > 0,
    creditUsd,
    chargeUsd,
    netAmountUsd,
  }
}

export function formatProrationUsd(value: number): string {
  const formatted = formatDashboardUsd(Math.abs(value))
  if (value > 0) return `+${formatted}`
  if (value < 0) return `−${formatted}`
  return formatted
}

export function buildProrationBillingNote(
  proration: SubscriptionProrationResult,
  fromLabel: string,
  toLabel: string,
): string {
  const dateLabel = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(proration.effectiveAt)

  if (!proration.canCalculate || proration.skipReason?.includes("No hay cambio")) {
    return ""
  }

  if (!proration.canCalculate) {
    return `[${dateLabel}] Cambio de plan ${fromLabel} → ${toLabel}. ${proration.skipReason ?? "Ajuste manual."}`
  }

  const net = formatProrationUsd(proration.netAmountUsd)
  const action =
    proration.netAmountUsd > 0
      ? `Cargo prorrateado ${net}`
      : proration.netAmountUsd < 0
        ? `Crédito prorrateado ${net}`
        : "Sin diferencia prorrateada"

  return `[${dateLabel}] Upgrade/cambio ${fromLabel} → ${toLabel} (${proration.daysRemaining}/${proration.daysInPeriod} días restantes). ${action}.`
}

export function appendBillingNote(
  current: string | null | undefined,
  addition: string,
): string {
  const trimmed = addition.trim()
  if (!trimmed) return current?.trim() ?? ""

  const existing = current?.trim()
  if (!existing) return trimmed

  return `${existing}\n${trimmed}`
}
