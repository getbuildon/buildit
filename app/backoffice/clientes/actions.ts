"use server"

import { requireBackofficeUser } from "@/lib/auth/backofficeAccess"
import {
  aggregateClienteBilling,
  type ClienteBillingSummary,
} from "@/lib/backoffice/clientesBilling"
import { BACKOFFICE_CLIENTES_PAGE_SIZE } from "@/lib/backoffice/clientesQuery"
import { createAdminClient } from "@/utils/supabase/admin"

export type BackofficeClienteOwner = {
  userId: string
  firstName: string
  lastName: string
  name: string
  email: string
  avatarUrl: string | null
}

export type BackofficeClienteRow = {
  companyId: string
  companyName: string
  owner: BackofficeClienteOwner | null
} & ClienteBillingSummary

export type GetBackofficeClientesParams = {
  page?: number
  pageSize?: number
  search?: string
}

export type BackofficeClientesResult = {
  clients: BackofficeClienteRow[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  totalMonthlyPaymentUsd: number
  totalDebtUsd: number
}

type CompanyRow = {
  id: string
  name: string
}

type OwnerMemberRow = {
  company_id: string
  user_id: string
}

type ProfileRow = {
  id: string
  first_name: string
  last_name: string
  email: string
  avatar_url: string | null
}

type ProjectRow = {
  id: string
  name: string
  status: string
  company_id: string
}

type SubscriptionRow = {
  project_id: string
  status: string
  renews_at: string | null
  billing_interval: string
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

function sanitizeSearchTerm(search: string): string {
  return search.trim().replace(/[%_,]/g, " ")
}

function parsePage(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return 1
  return Math.max(1, Math.floor(value))
}

function parsePageSize(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return BACKOFFICE_CLIENTES_PAGE_SIZE
  return Math.min(100, Math.max(1, Math.floor(value)))
}

function formatProfileName(
  firstName: string,
  lastName: string,
  email: string,
): string {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim()
  return name || email
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

async function getCompanyIdsMatchingSearch(
  admin: ReturnType<typeof createAdminClient>,
  search: string,
): Promise<string[]> {
  const term = sanitizeSearchTerm(search)
  if (!term) return []

  const pattern = `%${term}%`
  const matchingIds = new Set<string>()

  const { data: companyMatches, error: companyError } = await admin
    .from("companies")
    .select("id")
    .or(`name.ilike.${pattern},legal_name.ilike.${pattern}`)

  if (companyError) throw new Error(companyError.message)

  for (const row of companyMatches ?? []) {
    matchingIds.add(row.id as string)
  }

  const { data: profileMatches, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .or(
      `email.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern}`,
    )

  if (profileError) throw new Error(profileError.message)

  const profileIds = (profileMatches ?? []).map((row) => row.id as string)

  if (profileIds.length > 0) {
    const { data: ownerMatches, error: ownerError } = await admin
      .from("company_members")
      .select("company_id")
      .in("user_id", profileIds)
      .eq("role", "owner")
      .eq("status", "active")

    if (ownerError) throw new Error(ownerError.message)

    for (const row of ownerMatches ?? []) {
      matchingIds.add(row.company_id as string)
    }
  }

  const { data: projectMatches, error: projectError } = await admin
    .from("projects")
    .select("company_id")
    .ilike("name", pattern)

  if (projectError) throw new Error(projectError.message)

  for (const row of projectMatches ?? []) {
    if (row.company_id) {
      matchingIds.add(row.company_id as string)
    }
  }

  return [...matchingIds]
}

async function getOwnersByCompanyIds(
  admin: ReturnType<typeof createAdminClient>,
  companyIds: string[],
): Promise<Map<string, BackofficeClienteOwner>> {
  if (companyIds.length === 0) return new Map()

  const { data: ownerMembers, error } = await admin
    .from("company_members")
    .select("company_id, user_id")
    .in("company_id", companyIds)
    .eq("role", "owner")
    .eq("status", "active")

  if (error) throw new Error(error.message)
  if (!ownerMembers?.length) return new Map()

  const userIds = [...new Set(ownerMembers.map((row) => row.user_id as string))]

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, first_name, last_name, email, avatar_url")
    .in("id", userIds)

  if (profilesError) throw new Error(profilesError.message)

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id as string, profile as ProfileRow]),
  )

  const ownersByCompany = new Map<string, BackofficeClienteOwner>()

  for (const row of ownerMembers as OwnerMemberRow[]) {
    const companyId = row.company_id
    if (ownersByCompany.has(companyId)) continue

    const profile = profileById.get(row.user_id)
    if (!profile) continue

    ownersByCompany.set(companyId, {
      userId: profile.id,
      firstName: profile.first_name ?? "",
      lastName: profile.last_name ?? "",
      name: formatProfileName(
        profile.first_name ?? "",
        profile.last_name ?? "",
        profile.email,
      ),
      email: profile.email,
      avatarUrl: profile.avatar_url,
    })
  }

  return ownersByCompany
}

async function getProjectsByCompanyIds(
  admin: ReturnType<typeof createAdminClient>,
  companyIds: string[],
) {
  if (companyIds.length === 0) return new Map<string, ProjectRow[]>()

  const { data, error } = await admin
    .from("projects")
    .select("id, name, status, company_id")
    .in("company_id", companyIds)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  const projectsByCompany = new Map<string, ProjectRow[]>()

  for (const row of (data ?? []) as ProjectRow[]) {
    const current = projectsByCompany.get(row.company_id) ?? []
    current.push(row)
    projectsByCompany.set(row.company_id, current)
  }

  return projectsByCompany
}

async function getSubscriptionsByProjectIds(
  admin: ReturnType<typeof createAdminClient>,
  projectIds: string[],
) {
  if (projectIds.length === 0) return new Map<string, SubscriptionRow>()

  const { data, error } = await admin
    .from("project_subscriptions")
    .select(
      `
      project_id,
      status,
      renews_at,
      billing_interval,
      plan:subscription_plans (
        slug,
        monthly_price_usd,
        annual_monthly_price_usd
      )
    `,
    )
    .in("project_id", projectIds)

  if (error) throw new Error(error.message)

  const subscriptionsByProject = new Map<string, SubscriptionRow>()

  for (const row of (data ?? []) as SubscriptionRow[]) {
    subscriptionsByProject.set(row.project_id, row)
  }

  return subscriptionsByProject
}

export async function getBackofficeClientes(
  params: GetBackofficeClientesParams = {},
): Promise<BackofficeClientesResult> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const page = parsePage(params.page)
  const pageSize = parsePageSize(params.pageSize)
  const search = sanitizeSearchTerm(params.search ?? "")

  let companyIdsFilter: string[] | null = null

  if (search) {
    companyIdsFilter = await getCompanyIdsMatchingSearch(admin, search)
    if (companyIdsFilter.length === 0) {
      return {
        clients: [],
        totalCount: 0,
        page: 1,
        pageSize,
        totalPages: 1,
        totalMonthlyPaymentUsd: 0,
        totalDebtUsd: 0,
      }
    }
  }

  let query = admin
    .from("companies")
    .select("id, name", { count: "exact" })
    .order("created_at", { ascending: false })

  if (companyIdsFilter) {
    query = query.in("id", companyIdsFilter)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query.range(from, to)

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as CompanyRow[]
  const companyIds = rows.map((row) => row.id)

  const [ownersByCompany, projectsByCompany] = await Promise.all([
    getOwnersByCompanyIds(admin, companyIds),
    getProjectsByCompanyIds(admin, companyIds),
  ])

  const allProjectIds = [...projectsByCompany.values()]
    .flat()
    .map((project) => project.id)

  const subscriptionsByProject = await getSubscriptionsByProjectIds(
    admin,
    allProjectIds,
  )

  const clients = rows.map((company) => {
    const projects = projectsByCompany.get(company.id) ?? []

    const billing = aggregateClienteBilling(
      projects.map((project) => {
        const subscriptionRow = subscriptionsByProject.get(project.id)
        const plan = firstRelation(subscriptionRow?.plan ?? null)

        return {
          projectStatus: project.status,
          subscription: subscriptionRow
            ? {
                status: subscriptionRow.status,
                renewsAt: subscriptionRow.renews_at,
                billingInterval:
                  subscriptionRow.billing_interval === "annual"
                    ? "annual"
                    : "monthly",
                planSlug: plan?.slug ?? "",
                monthlyPriceUsd: toNumber(plan?.monthly_price_usd),
                annualMonthlyPriceUsd: toNumber(plan?.annual_monthly_price_usd),
              }
            : null,
        }
      }),
    )

    return {
      companyId: company.id,
      companyName: company.name,
      owner: ownersByCompany.get(company.id) ?? null,
      ...billing,
    }
  })

  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return {
    clients,
    totalCount,
    page: Math.min(page, totalPages),
    pageSize,
    totalPages,
    totalMonthlyPaymentUsd: clients.reduce(
      (sum, client) => sum + client.monthlyPaymentUsd,
      0,
    ),
    totalDebtUsd: clients.reduce((sum, client) => sum + client.debtUsd, 0),
  }
}
