import { formatDashboardUsd } from "@/lib/backoffice/clientesBilling"
import type { BackofficeDashboardMetrics } from "@/lib/backoffice/dashboardMetrics"
import { getBackofficeStatusFilterLabel } from "@/lib/backoffice/proyectosFilters"
import type { BackofficeProjectStatusKind } from "@/lib/backoffice/proyectosQuery"

export type MetricDeltaSentiment = "higher-is-better" | "lower-is-better" | "neutral"

export type MetricDelta = {
  key: string
  label: string
  primary: number
  compare: number
  delta: number
  deltaPercent: number | null
  format: "usd" | "count"
  sentiment: MetricDeltaSentiment
}

export type DashboardComparison = {
  primaryLabel: string
  compareLabel: string
  snapshot: MetricDelta[]
  activity: MetricDelta[]
  subscriptionStatus: MetricDelta[]
  planGroups: MetricDelta[]
}

function buildDelta(options: {
  key: string
  label: string
  primary: number
  compare: number
  format: "usd" | "count"
  sentiment: MetricDeltaSentiment
}): MetricDelta {
  const delta = options.primary - options.compare
  const deltaPercent =
    options.compare !== 0
      ? Math.round((delta / Math.abs(options.compare)) * 100)
      : options.primary !== 0
        ? 100
        : null

  return {
    key: options.key,
    label: options.label,
    primary: options.primary,
    compare: options.compare,
    delta,
    deltaPercent,
    format: options.format,
    sentiment: options.sentiment,
  }
}

const STATUS_ORDER: BackofficeProjectStatusKind[] = [
  "active",
  "inactive",
  "expired",
  "disabled",
]

function statusSentiment(
  status: BackofficeProjectStatusKind,
): MetricDeltaSentiment {
  if (status === "active") return "higher-is-better"
  if (status === "inactive") return "neutral"
  return "lower-is-better"
}

export function buildDashboardComparison(
  primary: BackofficeDashboardMetrics,
  compare: BackofficeDashboardMetrics,
): DashboardComparison {
  const { snapshot: pSnap, activity: pAct } = primary
  const { snapshot: cSnap, activity: cAct } = compare

  const snapshot: MetricDelta[] = [
    buildDelta({
      key: "chargesUsd",
      label: "Cargos emitidos",
      primary: pSnap.chargesUsd,
      compare: cSnap.chargesUsd,
      format: "usd",
      sentiment: "higher-is-better",
    }),
    buildDelta({
      key: "collectedUsd",
      label: "Cargos cobrados",
      primary: pSnap.collectedUsd,
      compare: cSnap.collectedUsd,
      format: "usd",
      sentiment: "higher-is-better",
    }),
    buildDelta({
      key: "receivableUsd",
      label: "Cargos por cobrar",
      primary: pSnap.receivableUsd,
      compare: cSnap.receivableUsd,
      format: "usd",
      sentiment: "lower-is-better",
    }),
    buildDelta({
      key: "debtUsd",
      label: "Deuda",
      primary: pSnap.debtUsd,
      compare: cSnap.debtUsd,
      format: "usd",
      sentiment: "lower-is-better",
    }),
    buildDelta({
      key: "activeSubscriptions",
      label: "Subscripciones activas",
      primary: pSnap.activeSubscriptions,
      compare: cSnap.activeSubscriptions,
      format: "count",
      sentiment: "higher-is-better",
    }),
    buildDelta({
      key: "payingCompanies",
      label: "Empresas pagando",
      primary: pSnap.payingCompanies,
      compare: cSnap.payingCompanies,
      format: "count",
      sentiment: "higher-is-better",
    }),
    buildDelta({
      key: "confirmedUsers",
      label: "Usuarios confirmados",
      primary: pSnap.confirmedUsers,
      compare: cSnap.confirmedUsers,
      format: "count",
      sentiment: "higher-is-better",
    }),
    buildDelta({
      key: "totalUsers",
      label: "Usuarios registrados",
      primary: pSnap.totalUsers,
      compare: cSnap.totalUsers,
      format: "count",
      sentiment: "higher-is-better",
    }),
    buildDelta({
      key: "totalCompanies",
      label: "Empresas",
      primary: pSnap.totalCompanies,
      compare: cSnap.totalCompanies,
      format: "count",
      sentiment: "higher-is-better",
    }),
    buildDelta({
      key: "totalProjects",
      label: "Proyectos",
      primary: pSnap.totalProjects,
      compare: cSnap.totalProjects,
      format: "count",
      sentiment: "higher-is-better",
    }),
    buildDelta({
      key: "companiesWithDebt",
      label: "Clientes con deuda",
      primary: pSnap.companiesWithDebt,
      compare: cSnap.companiesWithDebt,
      format: "count",
      sentiment: "lower-is-better",
    }),
  ]

  const activity: MetricDelta[] = [
    buildDelta({
      key: "newUsers",
      label: "Nuevos usuarios",
      primary: pAct.newUsers,
      compare: cAct.newUsers,
      format: "count",
      sentiment: "higher-is-better",
    }),
    buildDelta({
      key: "newConfirmedUsers",
      label: "Usuarios confirmados en el período",
      primary: pAct.newConfirmedUsers,
      compare: cAct.newConfirmedUsers,
      format: "count",
      sentiment: "higher-is-better",
    }),
    buildDelta({
      key: "newCompanies",
      label: "Nuevas empresas",
      primary: pAct.newCompanies,
      compare: cAct.newCompanies,
      format: "count",
      sentiment: "higher-is-better",
    }),
    buildDelta({
      key: "newProjects",
      label: "Nuevos proyectos",
      primary: pAct.newProjects,
      compare: cAct.newProjects,
      format: "count",
      sentiment: "higher-is-better",
    }),
    buildDelta({
      key: "newSubscriptions",
      label: "Nuevas subscripciones",
      primary: pAct.newSubscriptions,
      compare: cAct.newSubscriptions,
      format: "count",
      sentiment: "higher-is-better",
    }),
    buildDelta({
      key: "cancelledSubscriptions",
      label: "Subscripciones canceladas",
      primary: pAct.cancelledSubscriptions,
      compare: cAct.cancelledSubscriptions,
      format: "count",
      sentiment: "lower-is-better",
    }),
  ]

  const subscriptionStatus: MetricDelta[] = STATUS_ORDER.map((status) =>
    buildDelta({
      key: status,
      label: getBackofficeStatusFilterLabel(status),
      primary: primary.subscriptionStatus[status],
      compare: compare.subscriptionStatus[status],
      format: "count",
      sentiment: statusSentiment(status),
    }),
  )

  const comparePlanById = new Map(
    compare.planGroupBreakdown.map((group) => [group.id, group.count]),
  )

  const planGroups: MetricDelta[] = primary.planGroupBreakdown.map((group) =>
    buildDelta({
      key: group.id,
      label: group.label,
      primary: group.count,
      compare: comparePlanById.get(group.id) ?? 0,
      format: "count",
      sentiment: "higher-is-better",
    }),
  )

  return {
    primaryLabel: primary.period.label,
    compareLabel: compare.period.label,
    snapshot,
    activity,
    subscriptionStatus,
    planGroups,
  }
}

export function formatMetricValue(value: number, format: "usd" | "count"): string {
  if (format === "usd") return formatDashboardUsd(value)
  return String(value)
}

export function formatMetricDelta(delta: MetricDelta): string {
  if (delta.delta === 0) return "0"

  const sign = delta.delta > 0 ? "+" : "−"
  const absolute = Math.abs(delta.delta)

  if (delta.format === "usd") {
    const formatted = new Intl.NumberFormat("es-AR", {
      maximumFractionDigits: 0,
    }).format(absolute)
    return `${sign}$${formatted} USD`
  }

  return `${sign}${absolute}`
}

export function getDeltaTone(delta: MetricDelta): "positive" | "negative" | "neutral" {
  if (delta.delta === 0) return "neutral"

  const improved =
    delta.sentiment === "higher-is-better"
      ? delta.delta > 0
      : delta.sentiment === "lower-is-better"
        ? delta.delta < 0
        : false

  if (delta.sentiment === "neutral") {
    return delta.delta > 0 ? "positive" : "negative"
  }

  return improved ? "positive" : "negative"
}
