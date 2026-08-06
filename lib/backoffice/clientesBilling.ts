import {
  BACKOFFICE_PLAN_FILTER_GROUPS,
  getBackofficePlanFilterLabel,
} from "@/lib/backoffice/proyectosFilters"
import type { BackofficeProjectStatusKind } from "@/lib/backoffice/proyectosQuery"
import {
  resolveBackofficeProjectSubscriptionStatus,
  type ProjectSubscriptionSnapshot,
} from "@/lib/backoffice/proyectosSubscriptionStatus"

export type ClienteProjectSubscription = {
  status: string
  renewsAt: string | null
  billingInterval: "monthly" | "annual"
  planSlug: string
  monthlyPriceUsd: number | null
  annualMonthlyPriceUsd: number | null
}

export type ClienteProjectSnapshot = {
  projectStatus: string
  subscription: ClienteProjectSubscription | null
}

export type ClientePlanBreakdownItem = {
  label: string
  count: number
}

export type ClienteStatusBreakdown = Record<BackofficeProjectStatusKind, number>

export type ClienteBillingSummary = {
  projectCount: number
  planBreakdown: ClientePlanBreakdownItem[]
  statusBreakdown: ClienteStatusBreakdown
  monthlyPaymentUsd: number
  debtUsd: number
}

export function getPlanGroupLabel(planSlug: string): string {
  for (const group of BACKOFFICE_PLAN_FILTER_GROUPS) {
    if (group.tiers.some((tier) => tier.slug === planSlug)) {
      return group.label
    }
  }

  if (planSlug.startsWith("compacto")) return "Compacto"
  if (planSlug.startsWith("gran-escala")) return "Gran Escala"
  if (planSlug === "multiobra") return "Multiobra"

  return "Otro"
}

export function getSubscriptionMonthlyUsd(
  subscription: ClienteProjectSubscription,
): number {
  const monthly = subscription.monthlyPriceUsd ?? 0
  const annualMonthly = subscription.annualMonthlyPriceUsd ?? monthly

  return subscription.billingInterval === "annual" ? annualMonthly : monthly
}

export function aggregateClienteBilling(
  projects: ClienteProjectSnapshot[],
): ClienteBillingSummary {
  const planCounts = new Map<string, number>()
  const statusBreakdown: ClienteStatusBreakdown = {
    active: 0,
    inactive: 0,
    expired: 0,
    disabled: 0,
  }

  let monthlyPaymentUsd = 0
  let debtUsd = 0

  for (const project of projects) {
    const snapshot: ProjectSubscriptionSnapshot | null = project.subscription
      ? {
          status: project.subscription.status,
          renewsAt: project.subscription.renewsAt,
        }
      : null

    const displayStatus = resolveBackofficeProjectSubscriptionStatus(
      project.projectStatus,
      snapshot,
    )

    statusBreakdown[displayStatus] += 1

    if (project.subscription?.planSlug) {
      const label = getBackofficePlanFilterLabel(project.subscription.planSlug)
      planCounts.set(label, (planCounts.get(label) ?? 0) + 1)
    }

    if (!project.subscription) continue

    const monthlyUsd = getSubscriptionMonthlyUsd(project.subscription)

    if (displayStatus === "active") {
      monthlyPaymentUsd += monthlyUsd
    }

    if (displayStatus === "expired") {
      debtUsd += monthlyUsd
    }
  }

  const planBreakdown = [...planCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => {
      const order = (label: string) => {
        for (const group of BACKOFFICE_PLAN_FILTER_GROUPS) {
          for (const tier of group.tiers) {
            if (getBackofficePlanFilterLabel(tier.slug) === label) {
              return group.tiers.indexOf(tier) + group.tiers.length * 10
            }
          }
        }
        return 999
      }

      return order(a.label) - order(b.label)
    })

  return {
    projectCount: projects.length,
    planBreakdown,
    statusBreakdown,
    monthlyPaymentUsd,
    debtUsd,
  }
}

export function formatClienteUsd(value: number): string {
  if (value <= 0) return "—"

  return `$${new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(value)} USD`
}

export function formatDashboardUsd(value: number): string {
  return `$${new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(Math.max(0, value))} USD`
}

export function formatClientePlanBreakdown(
  breakdown: ClientePlanBreakdownItem[],
): string {
  if (breakdown.length === 0) return "Sin planes"

  return breakdown.map((item) => `${item.label} ${item.count}`).join(" · ")
}

export function formatClienteStatusBreakdown(
  breakdown: ClienteStatusBreakdown,
): string {
  const parts: string[] = []

  if (breakdown.active > 0) {
    parts.push(`${breakdown.active} activo${breakdown.active === 1 ? "" : "s"}`)
  }

  if (breakdown.inactive > 0) {
    parts.push(
      `${breakdown.inactive} inactivo${breakdown.inactive === 1 ? "" : "s"}`,
    )
  }

  if (breakdown.expired > 0) {
    parts.push(`${breakdown.expired} vencido${breakdown.expired === 1 ? "" : "s"}`)
  }

  if (breakdown.disabled > 0) {
    parts.push(
      `${breakdown.disabled} deshabilitado${breakdown.disabled === 1 ? "" : "s"}`,
    )
  }

  return parts.length > 0 ? parts.join(" · ") : "Sin proyectos"
}
