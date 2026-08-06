import { addMonths, addYears } from "date-fns"

import type { DashboardPeriod } from "@/lib/backoffice/dashboardPeriod"
import { isWithinPeriod } from "@/lib/backoffice/dashboardPeriod"

export type ProjectBillingLedgerEntry = {
  amountUsd: number
  effectiveAt: string
}

export type ProjectBillingContext = {
  /** Mensual o anual: define cuánto dura el período de cada cargo (+1 mes o +1 año). */
  billingInterval: "monthly" | "annual"
}

export type DashboardBillingLedgerEntry = {
  projectId: string
  companyId: string
  amountUsd: number
  effectiveAt: string
}

export type DashboardProjectBillingContext = {
  companyId: string
  billingInterval: "monthly" | "annual"
}

export type DashboardBillingSnapshot = {
  /** Cargos emitidos en el período seleccionado. */
  chargesUsd: number
  /** Pagos registrados en el período seleccionado. */
  collectedUsd: number
  /** Cargos del período aún no cobrados. */
  receivableUsd: number
  /** Cargos impagos cuyo período de facturación ya venció. */
  debtUsd: number
  companiesWithDebt: number
}

function roundUsd(value: number): number {
  return Math.round(value * 100) / 100
}

function getChargePeriodEnd(
  chargeAt: Date,
  billingInterval: "monthly" | "annual",
): Date {
  // Cada cargo define su propio período desde effective_at; no usamos renews_at.
  return billingInterval === "annual" ? addYears(chargeAt, 1) : addMonths(chargeAt, 1)
}

function computeProjectOverdueDebtUsd(
  entries: ProjectBillingLedgerEntry[],
  context: ProjectBillingContext,
  asOf: Date,
): number {
  const projectEntries = entries
    .filter((entry) => {
      const effectiveAt = new Date(entry.effectiveAt)
      return !Number.isNaN(effectiveAt.getTime()) && effectiveAt <= asOf
    })
    .sort(
      (a, b) =>
        new Date(a.effectiveAt).getTime() - new Date(b.effectiveAt).getTime(),
    )

  const charges = projectEntries
    .filter((entry) => entry.amountUsd > 0)
    .map((entry) => ({
      amountUsd: entry.amountUsd,
      effectiveAt: new Date(entry.effectiveAt),
    }))

  let paymentsRemaining = projectEntries
    .filter((entry) => entry.amountUsd < 0)
    .reduce((sum, entry) => sum + Math.abs(entry.amountUsd), 0)

  let overdueDebtUsd = 0

  for (const charge of charges) {
    const appliedPayment = Math.min(charge.amountUsd, paymentsRemaining)
    const unpaidUsd = charge.amountUsd - appliedPayment
    paymentsRemaining -= appliedPayment

    if (unpaidUsd <= 0) continue

    const periodEnd = getChargePeriodEnd(
      charge.effectiveAt,
      context.billingInterval,
    )

    if (periodEnd <= asOf) {
      overdueDebtUsd += unpaidUsd
    }
  }

  return overdueDebtUsd
}

export { computeProjectOverdueDebtUsd }

export function buildOverdueDebtByProject(
  entries: DashboardBillingLedgerEntry[],
  projectContexts: Map<string, Pick<DashboardProjectBillingContext, "billingInterval">>,
  asOf: Date,
): Map<string, number> {
  const entriesByProject = new Map<string, DashboardBillingLedgerEntry[]>()

  for (const entry of entries) {
    const effectiveAt = new Date(entry.effectiveAt)
    if (Number.isNaN(effectiveAt.getTime()) || effectiveAt > asOf) {
      continue
    }

    const current = entriesByProject.get(entry.projectId) ?? []
    current.push(entry)
    entriesByProject.set(entry.projectId, current)
  }

  const overdueDebtByProject = new Map<string, number>()

  for (const [projectId, projectEntries] of entriesByProject) {
    const context = projectContexts.get(projectId)
    if (!context) continue

    const projectDebtUsd = computeProjectOverdueDebtUsd(
      projectEntries,
      { billingInterval: context.billingInterval },
      asOf,
    )

    if (projectDebtUsd > 0) {
      overdueDebtByProject.set(projectId, roundUsd(projectDebtUsd))
    }
  }

  return overdueDebtByProject
}

export function computeDashboardBillingSnapshot(
  entries: DashboardBillingLedgerEntry[],
  projectContexts: Map<string, DashboardProjectBillingContext>,
  period: DashboardPeriod,
): DashboardBillingSnapshot {
  let chargesUsd = 0
  let collectedUsd = 0

  for (const entry of entries) {
    const effectiveAt = new Date(entry.effectiveAt)
    if (Number.isNaN(effectiveAt.getTime()) || effectiveAt > period.end) {
      continue
    }

    if (isWithinPeriod(entry.effectiveAt, period)) {
      if (entry.amountUsd > 0) {
        chargesUsd += entry.amountUsd
      } else if (entry.amountUsd < 0) {
        collectedUsd += Math.abs(entry.amountUsd)
      }
    }
  }

  const entriesByProject = new Map<string, DashboardBillingLedgerEntry[]>()

  for (const entry of entries) {
    const effectiveAt = new Date(entry.effectiveAt)
    if (Number.isNaN(effectiveAt.getTime()) || effectiveAt > period.end) {
      continue
    }

    const current = entriesByProject.get(entry.projectId) ?? []
    current.push(entry)
    entriesByProject.set(entry.projectId, current)
  }

  const debtByCompany = new Map<string, number>()
  let debtUsd = 0

  for (const [projectId, projectEntries] of entriesByProject) {
    const context = projectContexts.get(projectId)
    if (!context) continue

    const projectDebtUsd = computeProjectOverdueDebtUsd(
      projectEntries,
      { billingInterval: context.billingInterval },
      period.end,
    )

    if (projectDebtUsd <= 0) continue

    debtUsd += projectDebtUsd
    debtByCompany.set(
      context.companyId,
      (debtByCompany.get(context.companyId) ?? 0) + projectDebtUsd,
    )
  }

  const receivableUsd = Math.max(0, chargesUsd - collectedUsd)

  return {
    chargesUsd: roundUsd(chargesUsd),
    collectedUsd: roundUsd(collectedUsd),
    receivableUsd: roundUsd(receivableUsd),
    debtUsd: roundUsd(debtUsd),
    companiesWithDebt: [...debtByCompany.values()].filter((balance) => balance > 0)
      .length,
  }
}
