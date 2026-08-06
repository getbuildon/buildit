import { BACKOFFICE_PLAN_FILTER_GROUPS } from "@/lib/backoffice/proyectosFilters"
import { getPlanGroupLabel } from "@/lib/backoffice/clientesBilling"
import {
  aggregateClienteBilling,
  getSubscriptionMonthlyUsd,
  type ClienteProjectSnapshot,
  type ClienteProjectSubscription,
} from "@/lib/backoffice/clientesBilling"
import type { DashboardPeriod } from "@/lib/backoffice/dashboardPeriod"
import { isWithinPeriod } from "@/lib/backoffice/dashboardPeriod"
import type { BackofficeProjectStatusKind } from "@/lib/backoffice/proyectosQuery"
import {
  resolveBackofficeProjectSubscriptionStatus,
  type ProjectSubscriptionSnapshot,
} from "@/lib/backoffice/proyectosSubscriptionStatus"

export type DashboardSubscriptionRecord = {
  projectId: string
  projectStatus: string
  companyId: string
  createdAt: string
  updatedAt: string
  subscription: (ClienteProjectSubscription & {
    createdAt: string
    updatedAt: string
  }) | null
}

export type BackofficeDashboardSnapshotMetrics = {
  totalUsers: number
  confirmedUsers: number
  totalCompanies: number
  totalProjects: number
  activeSubscriptions: number
  payingCompanies: number
  mrrUsd: number
  debtUsd: number
  companiesWithDebt: number
}

export type BackofficeDashboardActivityMetrics = {
  newUsers: number
  newConfirmedUsers: number
  newCompanies: number
  newProjects: number
  newSubscriptions: number
  cancelledSubscriptions: number
}

export type DashboardPlanGroupBreakdown = {
  id: string
  label: string
  count: number
}

export type DashboardPlanTierBreakdown = {
  slug: string
  groupId: string
  groupLabel: string
  tierLabel: string
  count: number
}

export type BackofficeDashboardMetrics = {
  period: DashboardPeriod
  snapshot: BackofficeDashboardSnapshotMetrics
  activity: BackofficeDashboardActivityMetrics
  subscriptionStatus: Record<BackofficeProjectStatusKind, number>
  planBreakdown: { label: string; count: number }[]
  planGroupBreakdown: DashboardPlanGroupBreakdown[]
  planTierBreakdown: DashboardPlanTierBreakdown[]
}

function getSubscriptionSnapshotAt(
  record: DashboardSubscriptionRecord,
  asOf: Date,
): ProjectSubscriptionSnapshot | null {
  if (!record.subscription) return null

  if (new Date(record.subscription.createdAt) > asOf) return null

  let status = record.subscription.status

  if (status === "cancelled" && new Date(record.subscription.updatedAt) > asOf) {
    status = "active"
  }

  return {
    status,
    renewsAt: record.subscription.renewsAt,
  }
}

export function getProjectDisplayStatusAt(
  record: DashboardSubscriptionRecord,
  asOf: Date,
): BackofficeProjectStatusKind | null {
  const snapshot = getSubscriptionSnapshotAt(record, asOf)

  if (!snapshot) {
    if (new Date(record.createdAt) > asOf) return null
    return "inactive"
  }

  if (
    record.subscription?.status === "cancelled" &&
    new Date(record.subscription.updatedAt) <= asOf
  ) {
    return "disabled"
  }

  return resolveBackofficeProjectSubscriptionStatus(
    record.projectStatus,
    snapshot,
    asOf,
  )
}

function subscriptionExistedAt(
  record: DashboardSubscriptionRecord,
  asOf: Date,
): boolean {
  if (!record.subscription) return false
  if (new Date(record.subscription.createdAt) > asOf) return false

  if (
    record.subscription.status === "cancelled" &&
    new Date(record.subscription.updatedAt) <= asOf
  ) {
    return false
  }

  return Boolean(record.subscription.planSlug)
}

function buildPlanBreakdowns(
  records: DashboardSubscriptionRecord[],
  asOf: Date,
) {
  const groupCounts = new Map<string, number>()
  const tierCounts = new Map<string, number>()

  for (const record of records) {
    if (!subscriptionExistedAt(record, asOf)) continue

    const slug = record.subscription!.planSlug
    const groupLabel = getPlanGroupLabel(slug)

    groupCounts.set(groupLabel, (groupCounts.get(groupLabel) ?? 0) + 1)
    tierCounts.set(slug, (tierCounts.get(slug) ?? 0) + 1)
  }

  const planGroupBreakdown = BACKOFFICE_PLAN_FILTER_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    count: groupCounts.get(group.label) ?? 0,
  }))

  const planTierBreakdown = BACKOFFICE_PLAN_FILTER_GROUPS.flatMap((group) =>
    group.tiers.map((tier) => ({
      slug: tier.slug,
      groupId: group.id,
      groupLabel: group.label,
      tierLabel: tier.label,
      count: tierCounts.get(tier.slug) ?? 0,
    })),
  )

  return { planGroupBreakdown, planTierBreakdown }
}

export function buildDashboardMetrics(options: {
  period: DashboardPeriod
  totalUsers: number
  confirmedUsers: number
  confirmedUsersInPeriod: number
  newUsers: number
  totalCompanies: number
  newCompanies: number
  records: DashboardSubscriptionRecord[]
}): BackofficeDashboardMetrics {
  const asOf = options.period.end
  const snapshots: ClienteProjectSnapshot[] = []
  const subscriptionStatus: Record<BackofficeProjectStatusKind, number> = {
    active: 0,
    inactive: 0,
    expired: 0,
    disabled: 0,
  }

  const debtByCompany = new Map<string, number>()
  let activeSubscriptions = 0
  let mrrUsd = 0
  let debtUsd = 0
  let newProjects = 0
  let newSubscriptions = 0
  let cancelledSubscriptions = 0

  for (const record of options.records) {
    if (isWithinPeriod(record.createdAt, options.period)) {
      newProjects += 1
    }

    if (
      record.subscription &&
      isWithinPeriod(record.subscription.createdAt, options.period)
    ) {
      newSubscriptions += 1
    }

    if (
      record.subscription?.status === "cancelled" &&
      isWithinPeriod(record.subscription.updatedAt, options.period)
    ) {
      cancelledSubscriptions += 1
    }

    const displayStatus = getProjectDisplayStatusAt(record, asOf)
    if (!displayStatus) continue

    subscriptionStatus[displayStatus] += 1

    snapshots.push({
      projectStatus: record.projectStatus,
      subscription: record.subscription
        ? {
            status:
              record.subscription.status === "cancelled" &&
              new Date(record.subscription.updatedAt) > asOf
                ? "active"
                : record.subscription.status,
            renewsAt: record.subscription.renewsAt,
            billingInterval: record.subscription.billingInterval,
            planSlug: record.subscription.planSlug,
            monthlyPriceUsd: record.subscription.monthlyPriceUsd,
            annualMonthlyPriceUsd: record.subscription.annualMonthlyPriceUsd,
          }
        : null,
    })

    if (displayStatus === "active" && record.subscription) {
      activeSubscriptions += 1
      mrrUsd += getSubscriptionMonthlyUsd(record.subscription)
    }

    if (displayStatus === "expired" && record.subscription) {
      const monthlyUsd = getSubscriptionMonthlyUsd(record.subscription)
      debtUsd += monthlyUsd
      debtByCompany.set(
        record.companyId,
        (debtByCompany.get(record.companyId) ?? 0) + monthlyUsd,
      )
    }
  }

  const billing = aggregateClienteBilling(snapshots)
  const { planGroupBreakdown, planTierBreakdown } = buildPlanBreakdowns(
    options.records,
    asOf,
  )
  const payingCompanies = new Set(
    options.records
      .filter((record) => getProjectDisplayStatusAt(record, asOf) === "active")
      .map((record) => record.companyId),
  ).size

  return {
    period: options.period,
    snapshot: {
      totalUsers: options.totalUsers,
      confirmedUsers: options.confirmedUsers,
      totalCompanies: options.totalCompanies,
      totalProjects: snapshots.length,
      activeSubscriptions,
      payingCompanies,
      mrrUsd,
      debtUsd,
      companiesWithDebt: [...debtByCompany.values()].filter((value) => value > 0)
        .length,
    },
    activity: {
      newUsers: options.newUsers,
      newConfirmedUsers: options.confirmedUsersInPeriod,
      newCompanies: options.newCompanies,
      newProjects,
      newSubscriptions,
      cancelledSubscriptions,
    },
    subscriptionStatus,
    planBreakdown: billing.planBreakdown,
    planGroupBreakdown,
    planTierBreakdown,
  }
}
