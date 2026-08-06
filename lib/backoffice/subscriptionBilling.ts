export type SubscriptionBillingEntryType =
  | "proration"
  | "renewal"
  | "payment"
  | "credit"
  | "adjustment"

export type SubscriptionBillingEntry = {
  id: string
  projectId: string
  entryType: SubscriptionBillingEntryType
  amountUsd: number
  description: string | null
  effectiveAt: string
  paymentMethod: string | null
  createdAt: string
}

export type SubscriptionBillingSummary = {
  balanceUsd: number
  totalChargesUsd: number
  totalPaymentsUsd: number
  /** Cargos impagos con período de facturación vencido. */
  debtUsd: number
  /** Cargos impagos con período aún vigente. */
  receivableUsd: number
  entries: SubscriptionBillingEntry[]
}

const ENTRY_TYPE_LABELS: Record<SubscriptionBillingEntryType, string> = {
  proration: "Prorrateo",
  renewal: "Renovación",
  payment: "Pago",
  credit: "Crédito",
  adjustment: "Ajuste",
}

export function getBillingEntryTypeLabel(
  entryType: SubscriptionBillingEntryType,
): string {
  return ENTRY_TYPE_LABELS[entryType]
}

export function summarizeBillingEntries(
  entries: SubscriptionBillingEntry[],
): Omit<SubscriptionBillingSummary, "entries"> {
  let balanceUsd = 0
  let totalChargesUsd = 0
  let totalPaymentsUsd = 0

  for (const entry of entries) {
    balanceUsd += entry.amountUsd

    if (entry.amountUsd > 0) {
      totalChargesUsd += entry.amountUsd
    } else {
      totalPaymentsUsd += Math.abs(entry.amountUsd)
    }
  }

  return {
    balanceUsd: roundUsd(balanceUsd),
    totalChargesUsd: roundUsd(totalChargesUsd),
    totalPaymentsUsd: roundUsd(totalPaymentsUsd),
    debtUsd: 0,
    receivableUsd: roundUsd(Math.max(0, balanceUsd)),
  }
}

export function formatBillingUsd(value: number, options?: { signed?: boolean }): string {
  const signed = options?.signed ?? false
  const absolute = Math.abs(value)
  const formatted = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(absolute)

  if (!signed) {
    return `$${formatted} USD`
  }

  if (value > 0) return `+$${formatted} USD`
  if (value < 0) return `−$${formatted} USD`
  return `$${formatted} USD`
}

export function formatBillingBalanceLabel(balanceUsd: number): string {
  if (balanceUsd > 0) {
    return `${formatBillingUsd(balanceUsd)} pendiente`
  }

  if (balanceUsd < 0) {
    return `${formatBillingUsd(Math.abs(balanceUsd))} a favor`
  }

  return "Al día"
}

function roundUsd(value: number): number {
  return Math.round(value * 100) / 100
}

export const MANUAL_PAYMENT_METHODS = [
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "efectivo", label: "Efectivo" },
  { value: "cheque", label: "Cheque" },
  { value: "otro", label: "Otro" },
] as const

export type ManualPaymentMethod = (typeof MANUAL_PAYMENT_METHODS)[number]["value"]

export function getManualPaymentMethodLabel(value: string | null): string {
  const match = MANUAL_PAYMENT_METHODS.find((option) => option.value === value)
  return match?.label ?? value ?? "—"
}

export function formatBillingBalanceShort(balanceUsd: number): string {
  if (balanceUsd === 0) return "—"

  if (balanceUsd > 0) {
    return formatBillingUsd(balanceUsd)
  }

  return `${formatBillingUsd(Math.abs(balanceUsd))} a favor`
}

export function formatBillingLastCharge(
  lastCharge: { effectiveAt: string; amountUsd: number } | null,
): string {
  if (!lastCharge) return "—"

  const date = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(lastCharge.effectiveAt))

  return `${date} · ${formatBillingUsd(lastCharge.amountUsd)}`
}

export function formatBillingDebtUsd(balanceUsd: number): string {
  if (balanceUsd <= 0) return "—"

  return formatBillingUsd(balanceUsd)
}
