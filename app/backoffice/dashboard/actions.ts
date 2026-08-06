"use server"

import { requireBackofficeUser } from "@/lib/auth/backofficeAccess"
import {
  buildDashboardMetrics,
  type BackofficeDashboardMetrics,
  type DashboardSubscriptionRecord,
} from "@/lib/backoffice/dashboardMetrics"
import {
  isOnOrBeforePeriodEnd,
  resolveDashboardPeriod,
} from "@/lib/backoffice/dashboardPeriod"
import { createAdminClient } from "@/utils/supabase/admin"

export type GetBackofficeDashboardParams = {
  period?: string
  from?: string
  to?: string
}

type SubscriptionQueryRow = {
  project_id: string
  status: string
  renews_at: string | null
  billing_interval: string
  created_at: string
  updated_at: string
  plan:
    | {
        slug: string
        monthly_price_usd: number | null
        annual_monthly_price_usd: number | null
      }
    | {
        slug: string
        monthly_price_usd: number | null
        annual_monthly_price_usd: number | null
      }[]
    | null
}

type ProjectRow = {
  id: string
  status: string
  company_id: string
  created_at: string
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value == null) return null
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

async function countProfilesCreatedBefore(
  admin: ReturnType<typeof createAdminClient>,
  endIso: string,
): Promise<number> {
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .lte("created_at", endIso)

  if (error) throw new Error(error.message)
  return count ?? 0
}

async function countProfilesCreatedInPeriod(
  admin: ReturnType<typeof createAdminClient>,
  startIso: string,
  endIso: string,
): Promise<number> {
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startIso)
    .lte("created_at", endIso)

  if (error) throw new Error(error.message)
  return count ?? 0
}

async function countCompaniesCreatedBefore(
  admin: ReturnType<typeof createAdminClient>,
  endIso: string,
): Promise<number> {
  const { count, error } = await admin
    .from("companies")
    .select("id", { count: "exact", head: true })
    .lte("created_at", endIso)

  if (error) throw new Error(error.message)
  return count ?? 0
}

async function countCompaniesCreatedInPeriod(
  admin: ReturnType<typeof createAdminClient>,
  startIso: string,
  endIso: string,
): Promise<number> {
  const { count, error } = await admin
    .from("companies")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startIso)
    .lte("created_at", endIso)

  if (error) throw new Error(error.message)
  return count ?? 0
}

async function getConfirmedUserCounts(periodEnd: Date, periodStart: Date) {
  const admin = createAdminClient()

  let confirmedUsers = 0
  let confirmedUsersInPeriod = 0
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })

    if (error) throw new Error(error.message)

    const users = data.users ?? []

    for (const user of users) {
      if (!user.email_confirmed_at) continue

      const confirmedAt = new Date(user.email_confirmed_at)
      if (confirmedAt <= periodEnd) {
        confirmedUsers += 1
      }

      if (confirmedAt >= periodStart && confirmedAt <= periodEnd) {
        confirmedUsersInPeriod += 1
      }
    }

    if (users.length < perPage) break
    page += 1
  }

  return { confirmedUsers, confirmedUsersInPeriod }
}

async function getProjectSubscriptionRecords(
  admin: ReturnType<typeof createAdminClient>,
  periodEndIso: string,
): Promise<DashboardSubscriptionRecord[]> {
  const { data: projects, error: projectsError } = await admin
    .from("projects")
    .select("id, status, company_id, created_at")
    .lte("created_at", periodEndIso)

  if (projectsError) throw new Error(projectsError.message)

  const projectRows = (projects ?? []) as ProjectRow[]
  const projectIds = projectRows.map((project) => project.id)

  if (projectIds.length === 0) return []

  const { data: subscriptions, error: subscriptionsError } = await admin
    .from("project_subscriptions")
    .select(
      `
      project_id,
      status,
      renews_at,
      billing_interval,
      created_at,
      updated_at,
      plan:subscription_plans (
        slug,
        monthly_price_usd,
        annual_monthly_price_usd
      )
    `,
    )
    .in("project_id", projectIds)

  if (subscriptionsError) throw new Error(subscriptionsError.message)

  const subscriptionsByProject = new Map<string, SubscriptionQueryRow>()

  for (const row of (subscriptions ?? []) as SubscriptionQueryRow[]) {
    subscriptionsByProject.set(row.project_id, row)
  }

  return projectRows.map((project) => {
    const subscriptionRow = subscriptionsByProject.get(project.id)
    const plan = firstRelation(subscriptionRow?.plan ?? null)

    return {
      projectId: project.id,
      projectStatus: project.status,
      companyId: project.company_id,
      createdAt: project.created_at,
      updatedAt: subscriptionRow?.updated_at ?? project.created_at,
      subscription: subscriptionRow
        ? {
            status: subscriptionRow.status,
            renewsAt: subscriptionRow.renews_at,
            billingInterval:
              subscriptionRow.billing_interval === "annual" ? "annual" : "monthly",
            planSlug: plan?.slug ?? "",
            monthlyPriceUsd: toNumber(plan?.monthly_price_usd),
            annualMonthlyPriceUsd: toNumber(plan?.annual_monthly_price_usd),
            createdAt: subscriptionRow.created_at,
            updatedAt: subscriptionRow.updated_at,
          }
        : null,
    }
  })
}

export async function getBackofficeDashboardMetrics(
  params: GetBackofficeDashboardParams = {},
): Promise<BackofficeDashboardMetrics> {
  await requireBackofficeUser()

  const period = resolveDashboardPeriod({
    period: params.period,
    from: params.from,
    to: params.to,
  })

  const admin = createAdminClient()

  const [
    totalUsers,
    newUsers,
    totalCompanies,
    newCompanies,
    confirmedCounts,
    records,
  ] = await Promise.all([
    countProfilesCreatedBefore(admin, period.endIso),
    countProfilesCreatedInPeriod(admin, period.startIso, period.endIso),
    countCompaniesCreatedBefore(admin, period.endIso),
    countCompaniesCreatedInPeriod(admin, period.startIso, period.endIso),
    getConfirmedUserCounts(period.end, period.start),
    getProjectSubscriptionRecords(admin, period.endIso),
  ])

  return buildDashboardMetrics({
    period,
    totalUsers,
    confirmedUsers: confirmedCounts.confirmedUsers,
    confirmedUsersInPeriod: confirmedCounts.confirmedUsersInPeriod,
    newUsers,
    totalCompanies,
    newCompanies,
    records: records.filter((record) =>
      isOnOrBeforePeriodEnd(record.createdAt, period),
    ),
  })
}

export type { BackofficeDashboardMetrics } from "@/lib/backoffice/dashboardMetrics"
export type { DashboardPeriodPreset } from "@/lib/backoffice/dashboardPeriod"
