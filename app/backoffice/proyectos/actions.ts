"use server"

import { revalidatePath } from "next/cache"

import { requireBackofficeUser } from "@/lib/auth/backofficeAccess"
import { BACKOFFICE_PROYECTOS_PAGE_SIZE } from "@/lib/backoffice/proyectosQuery"
import type { BackofficeProjectStatusKind } from "@/lib/backoffice/proyectosQuery"
import {
  resolveBackofficeProjectSubscriptionStatus,
  type ProjectSubscriptionSnapshot,
} from "@/lib/backoffice/proyectosSubscriptionStatus"
import { loadProjectCatalogIds } from "@/lib/projects/projectCatalogServer"
import {
  buildCustomPlanPriceLabel,
  normalizeProjectSubscriptionInput,
  resolvePlanGroupId,
  type BackofficeProjectSubscriptionDetails,
  type BackofficeProjectSubscriptionInput,
  type BackofficeSubscriptionPlanOption,
  type NormalizedProjectSubscriptionInput,
} from "@/lib/backoffice/projectSubscriptionForm"

export type { BackofficeProjectSubscriptionDetails } from "@/lib/backoffice/projectSubscriptionForm"
import { createAdminClient } from "@/utils/supabase/admin"

export type { BackofficeProjectSubscriptionInput } from "@/lib/backoffice/projectSubscriptionForm"
export type { BackofficeSubscriptionPlanOption } from "@/lib/backoffice/projectSubscriptionForm"

export type BackofficeProjectCompany = {
  id: string
  name: string
}

export type BackofficeProjectRow = {
  id: string
  name: string
  location: string | null
  status: string
  subscriptionStatus: BackofficeProjectStatusKind
  totalSurfaceM2: number | null
  company: BackofficeProjectCompany | null
  planName: string | null
  memberCount: number
  createdAt: string
}

export type BackofficeProjectCompanyCandidate = {
  id: string
  name: string
}

export type BackofficeProjectActionResult = { ok: true } | { ok: false; error: string }

export type BackofficeProjectInput = {
  name: string
  companyId: string
  location?: string
  status?: string
  totalSurfaceM2?: string
}

export type BackofficeProjectCreateInput = BackofficeProjectInput & {
  subscription: BackofficeProjectSubscriptionInput
}

export type BackofficeProjectUpdateInput = BackofficeProjectInput & {
  subscription?: BackofficeProjectSubscriptionInput
  cancelSubscription?: boolean
}

export type GetBackofficeProjectsParams = {
  page?: number
  pageSize?: number
  search?: string
  planSlugs?: string[]
  statuses?: BackofficeProjectStatusKind[]
}

export type BackofficeProjectsResult = {
  projects: BackofficeProjectRow[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

const PROJECT_STATUSES = new Set([
  "draft",
  "active",
  "paused",
  "completed",
  "archived",
])

type ProjectRow = {
  id: string
  name: string
  location: string | null
  status: string
  total_surface_m2: number | null
  company_id: string | null
  created_at: string
  companies: { id: string; name: string } | { id: string; name: string }[] | null
}

function sanitizeSearchTerm(search: string): string {
  return search.trim().replace(/[%_,]/g, " ")
}

function parsePage(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return 1
  return Math.max(1, Math.floor(value))
}

function parsePageSize(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return BACKOFFICE_PROYECTOS_PAGE_SIZE
  return Math.min(100, Math.max(1, Math.floor(value)))
}

function parseOptionalSurface(value: string | undefined): number | null {
  const trimmed = value?.trim()
  if (!trimmed) return null

  const normalized = trimmed.replace(",", ".")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function normalizeProjectInput(input: BackofficeProjectInput) {
  const name = input.name.trim()
  const companyId = input.companyId.trim()

  if (!name) {
    return { ok: false as const, error: "El nombre del proyecto es obligatorio." }
  }

  if (!companyId) {
    return { ok: false as const, error: "La empresa es obligatoria." }
  }

  const status = input.status?.trim() || "active"
  if (!PROJECT_STATUSES.has(status)) {
    return { ok: false as const, error: "El estado del proyecto no es válido." }
  }

  return {
    ok: true as const,
    data: {
      name,
      company_id: companyId,
      location: input.location?.trim() || null,
      status,
      total_surface_m2: parseOptionalSurface(input.totalSurfaceM2),
    },
  }
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value == null) return null
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

type SubscriptionPlanRow = {
  id: string
  slug: string
  name: string
  surface_label: string
  surface_max_m2: number | null
  monthly_price_usd: number | null
  annual_monthly_price_usd: number | null
  price_label: string
}

async function resolveSubscriptionPlanId(
  admin: ReturnType<typeof createAdminClient>,
  subscription: { ok: true; data: NormalizedProjectSubscriptionInput },
  options?: { existingCustomPlanId?: string },
): Promise<{ ok: true; planId: string; isCustomPlan: boolean } | { ok: false; error: string }> {
  const { data } = subscription

  if (data.planSlug) {
    const { data: plan, error } = await admin
      .from("subscription_plans")
      .select("id")
      .eq("slug", data.planSlug)
      .eq("is_active", true)
      .maybeSingle()

    if (error) return { ok: false, error: error.message }
    if (!plan) return { ok: false, error: "No encontramos el plan seleccionado." }

    return { ok: true, planId: plan.id as string, isCustomPlan: false }
  }

  if (!data.customPlan) {
    return { ok: false, error: "No pudimos resolver el plan de la subscripción." }
  }

  const customPlanPayload = {
    name: data.customPlan.name,
    surface_max_m2: data.customPlan.surfaceMaxM2,
    surface_label: data.customPlan.surfaceLabel,
    price_label: buildCustomPlanPriceLabel(
      data.customPlan.monthlyPriceUsd,
      data.customPlan.annualMonthlyPriceUsd,
    ),
    monthly_price_usd: data.customPlan.monthlyPriceUsd,
    annual_monthly_price_usd: data.customPlan.annualMonthlyPriceUsd,
  }

  const existingCustomPlanId = options?.existingCustomPlanId?.trim()

  if (existingCustomPlanId) {
    const { data: existingPlan, error: existingPlanError } = await admin
      .from("subscription_plans")
      .select("id, slug")
      .eq("id", existingCustomPlanId)
      .maybeSingle()

    if (existingPlanError) return { ok: false, error: existingPlanError.message }

    if (!existingPlan || !(existingPlan.slug as string).startsWith("custom-")) {
      return { ok: false, error: "No encontramos el plan personalizado a actualizar." }
    }

    const { error: updatePlanError } = await admin
      .from("subscription_plans")
      .update(customPlanPayload)
      .eq("id", existingCustomPlanId)

    if (updatePlanError) {
      return { ok: false, error: updatePlanError.message }
    }

    return { ok: true, planId: existingCustomPlanId, isCustomPlan: true }
  }

  const slug = `custom-${crypto.randomUUID()}`

  const { data: createdPlan, error: createPlanError } = await admin
    .from("subscription_plans")
    .insert({
      slug,
      ...customPlanPayload,
      max_admins: 1,
      max_supervisors: 2,
      max_operators: 15,
      max_clients: 20,
      billing_interval: null,
      sort_order: 999,
      is_active: true,
    })
    .select("id")
    .single()

  if (createPlanError || !createdPlan) {
    return {
      ok: false,
      error: createPlanError?.message ?? "No pudimos crear el plan personalizado.",
    }
  }

  return { ok: true, planId: createdPlan.id as string, isCustomPlan: true }
}

async function createProjectSubscription(
  admin: ReturnType<typeof createAdminClient>,
  projectId: string,
  subscriptionInput: BackofficeProjectSubscriptionInput,
): Promise<BackofficeProjectActionResult> {
  const normalizedSubscription = normalizeProjectSubscriptionInput(subscriptionInput)
  if (!normalizedSubscription.ok) return normalizedSubscription

  const planResult = await resolveSubscriptionPlanId(admin, normalizedSubscription)
  if (!planResult.ok) return planResult

  const { data } = normalizedSubscription

  const { error } = await admin.from("project_subscriptions").insert({
    project_id: projectId,
    plan_id: planResult.planId,
    status: "active",
    started_at: data.startedAt.toISOString(),
    renews_at: data.renewsAt.toISOString(),
    billing_interval: data.billingInterval,
    billing_note: null,
    payment_method_label: "Pendiente",
    card_last4: "0000",
  })

  if (error) {
    if (planResult.isCustomPlan) {
      await admin.from("subscription_plans").delete().eq("id", planResult.planId)
    }
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

async function upsertProjectSubscription(
  admin: ReturnType<typeof createAdminClient>,
  projectId: string,
  subscriptionInput: BackofficeProjectSubscriptionInput,
  options?: { existingSubscriptionId?: string },
): Promise<BackofficeProjectActionResult> {
  const normalizedSubscription = normalizeProjectSubscriptionInput(subscriptionInput)
  if (!normalizedSubscription.ok) return normalizedSubscription

  const planResult = await resolveSubscriptionPlanId(admin, normalizedSubscription, {
    existingCustomPlanId:
      subscriptionInput.planGroupId === "custom"
        ? subscriptionInput.existingPlanId
        : undefined,
  })
  if (!planResult.ok) return planResult

  const { data } = normalizedSubscription
  const payload = {
    plan_id: planResult.planId,
    billing_interval: data.billingInterval,
    started_at: data.startedAt.toISOString(),
    renews_at: data.renewsAt.toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (options?.existingSubscriptionId) {
    const { error } = await admin
      .from("project_subscriptions")
      .update(payload)
      .eq("id", options.existingSubscriptionId)

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true }
  }

  const { error } = await admin.from("project_subscriptions").insert({
    project_id: projectId,
    status: "active",
    billing_note: null,
    payment_method_label: "Pendiente",
    card_last4: "0000",
    ...payload,
  })

  if (error) {
    if (planResult.isCustomPlan && !subscriptionInput.existingPlanId) {
      await admin.from("subscription_plans").delete().eq("id", planResult.planId)
    }
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

async function cancelProjectSubscriptionByProjectId(
  admin: ReturnType<typeof createAdminClient>,
  projectId: string,
): Promise<BackofficeProjectActionResult> {
  const { data: subscription, error: subscriptionError } = await admin
    .from("project_subscriptions")
    .select("id, status")
    .eq("project_id", projectId)
    .maybeSingle()

  if (subscriptionError) {
    return { ok: false, error: subscriptionError.message }
  }

  if (!subscription) {
    return { ok: false, error: "Este proyecto no tiene subscripción." }
  }

  if (subscription.status === "cancelled") {
    return { ok: false, error: "La subscripción ya está cancelada." }
  }

  const { error } = await admin
    .from("project_subscriptions")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscription.id)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

function mapSubscriptionPlanRow(plan: SubscriptionPlanRow): BackofficeSubscriptionPlanOption & {
  isCustom: boolean
} {
  return {
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    surfaceLabel: plan.surface_label,
    surfaceMaxM2: toNumber(plan.surface_max_m2),
    monthlyPriceUsd: toNumber(plan.monthly_price_usd),
    annualMonthlyPriceUsd: toNumber(plan.annual_monthly_price_usd),
    priceLabel: plan.price_label,
    groupId: resolvePlanGroupId(plan.slug),
    isCustom: plan.slug.startsWith("custom-"),
  }
}

export async function getBackofficeProjectSubscription(
  projectId: string,
): Promise<BackofficeProjectSubscriptionDetails | null> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("project_subscriptions")
    .select(
      `
      id,
      status,
      billing_interval,
      started_at,
      renews_at,
      plan:subscription_plans (
        id,
        slug,
        name,
        surface_label,
        surface_max_m2,
        monthly_price_usd,
        annual_monthly_price_usd,
        price_label
      )
    `,
    )
    .eq("project_id", projectId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const planRow = firstRelation(
    data.plan as SubscriptionPlanRow | SubscriptionPlanRow[] | null,
  )
  if (!planRow) return null

  const billingInterval = data.billing_interval === "annual" ? "annual" : "monthly"

  return {
    subscriptionId: data.id as string,
    status: data.status as BackofficeProjectSubscriptionDetails["status"],
    billingInterval,
    startedAt: data.started_at as string,
    renewsAt: (data.renews_at as string | null) ?? null,
    plan: mapSubscriptionPlanRow(planRow),
  }
}

export async function listBackofficeSubscriptionPlans(): Promise<
  BackofficeSubscriptionPlanOption[]
> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("subscription_plans")
    .select(
      "id, slug, name, surface_label, surface_max_m2, monthly_price_usd, annual_monthly_price_usd, price_label",
    )
    .eq("is_active", true)
    .not("slug", "like", "custom-%")
    .order("sort_order", { ascending: true })

  if (error) throw new Error(error.message)

  return ((data ?? []) as SubscriptionPlanRow[]).map((plan) => ({
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    surfaceLabel: plan.surface_label,
    surfaceMaxM2: toNumber(plan.surface_max_m2),
    monthlyPriceUsd: toNumber(plan.monthly_price_usd),
    annualMonthlyPriceUsd: toNumber(plan.annual_monthly_price_usd),
    priceLabel: plan.price_label,
    groupId: resolvePlanGroupId(plan.slug),
  }))
}

async function getCompanyIdsMatchingSearch(
  admin: ReturnType<typeof createAdminClient>,
  search: string,
): Promise<string[]> {
  const pattern = `%${search}%`
  const { data, error } = await admin
    .from("companies")
    .select("id")
    .ilike("name", pattern)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => row.id as string)
}

async function getActiveMemberCountsByProject(
  admin: ReturnType<typeof createAdminClient>,
  projectIds: string[],
): Promise<Map<string, number>> {
  if (projectIds.length === 0) return new Map()

  const { data, error } = await admin
    .from("project_members")
    .select("project_id")
    .in("project_id", projectIds)
    .eq("is_active", true)

  if (error) {
    throw new Error(error.message)
  }

  const counts = new Map<string, number>()

  for (const row of data ?? []) {
    const projectId = row.project_id as string
    counts.set(projectId, (counts.get(projectId) ?? 0) + 1)
  }

  return counts
}

type SubscriptionRow = {
  project_id: string
  status: string
  renews_at: string | null
  plan: { name: string } | { name: string }[] | null
}

type ProjectSubscriptionInfo = {
  planName: string | null
  snapshot: ProjectSubscriptionSnapshot
}

async function getSubscriptionInfoByProject(
  admin: ReturnType<typeof createAdminClient>,
  projectIds: string[],
): Promise<Map<string, ProjectSubscriptionInfo>> {
  if (projectIds.length === 0) return new Map()

  const { data, error } = await admin
    .from("project_subscriptions")
    .select("project_id, status, renews_at, plan:subscription_plans(name)")
    .in("project_id", projectIds)

  if (error) {
    throw new Error(error.message)
  }

  const subscriptionsByProject = new Map<string, ProjectSubscriptionInfo>()

  for (const row of (data ?? []) as SubscriptionRow[]) {
    const plan = firstRelation(row.plan)
    subscriptionsByProject.set(row.project_id, {
      planName: plan?.name ?? null,
      snapshot: {
        status: row.status,
        renewsAt: row.renews_at,
      },
    })
  }

  return subscriptionsByProject
}

async function getProjectIdsForPlanSlugs(
  admin: ReturnType<typeof createAdminClient>,
  planSlugs: string[],
): Promise<string[]> {
  if (planSlugs.length === 0) return []

  const { data: plans, error: planError } = await admin
    .from("subscription_plans")
    .select("id")
    .in("slug", planSlugs)

  if (planError) {
    throw new Error(planError.message)
  }

  const planIds = (plans ?? []).map((plan) => plan.id as string)
  if (planIds.length === 0) return []

  const { data: subscriptions, error: subscriptionsError } = await admin
    .from("project_subscriptions")
    .select("project_id")
    .in("plan_id", planIds)

  if (subscriptionsError) {
    throw new Error(subscriptionsError.message)
  }

  return [...new Set((subscriptions ?? []).map((row) => row.project_id as string))]
}

async function getProjectIdsForStatuses(
  admin: ReturnType<typeof createAdminClient>,
  statuses: BackofficeProjectStatusKind[],
): Promise<string[]> {
  const ids = new Set<string>()

  for (const status of statuses) {
    for (const projectId of await getProjectIdsForSubscriptionStatus(admin, status)) {
      ids.add(projectId)
    }
  }

  return [...ids]
}

async function getProjectIdsForSubscriptionStatus(
  admin: ReturnType<typeof createAdminClient>,
  status: BackofficeProjectStatusKind,
): Promise<string[]> {
  if (status === "disabled") {
    const { data, error } = await admin
      .from("project_subscriptions")
      .select("project_id")
      .eq("status", "cancelled")

    if (error) throw new Error(error.message)

    return (data ?? []).map((row) => row.project_id as string)
  }

  if (status === "expired") {
    const now = new Date().toISOString()

    const [{ data: pastDue, error: pastDueError }, { data: overdue, error: overdueError }] =
      await Promise.all([
        admin.from("project_subscriptions").select("project_id").eq("status", "past_due"),
        admin
          .from("project_subscriptions")
          .select("project_id")
          .lt("renews_at", now)
          .not("renews_at", "is", null)
          .neq("status", "cancelled"),
      ])

    if (pastDueError) throw new Error(pastDueError.message)
    if (overdueError) throw new Error(overdueError.message)

    return [
      ...new Set([
        ...(pastDue ?? []).map((row) => row.project_id as string),
        ...(overdue ?? []).map((row) => row.project_id as string),
      ]),
    ]
  }

  if (status === "active") {
    const now = new Date().toISOString()

    const [{ data: activeProjects, error: projectsError }, { data: subscriptions, error: subsError }] =
      await Promise.all([
        admin.from("projects").select("id").eq("status", "active"),
        admin
          .from("project_subscriptions")
          .select("project_id, status, renews_at")
          .eq("status", "active"),
      ])

    if (projectsError) throw new Error(projectsError.message)
    if (subsError) throw new Error(subsError.message)

    const activeProjectIds = new Set(
      (activeProjects ?? []).map((row) => row.id as string),
    )

    return (subscriptions ?? [])
      .filter((row) => {
        const projectId = row.project_id as string
        const renewsAt = row.renews_at as string | null
        return (
          activeProjectIds.has(projectId) &&
          (renewsAt == null || renewsAt >= now)
        )
      })
      .map((row) => row.project_id as string)
  }

  const [{ data: projects, error: projectsError }, { data: subscriptions, error: subsError }] =
    await Promise.all([
      admin.from("projects").select("id, status"),
      admin.from("project_subscriptions").select("project_id, status, renews_at"),
    ])

  if (projectsError) throw new Error(projectsError.message)
  if (subsError) throw new Error(subsError.message)

  const subscriptionsByProject = new Map<string, ProjectSubscriptionSnapshot>()

  for (const row of subscriptions ?? []) {
    subscriptionsByProject.set(row.project_id as string, {
      status: row.status as string,
      renewsAt: row.renews_at as string | null,
    })
  }

  return (projects ?? [])
    .filter((row) =>
      resolveBackofficeProjectSubscriptionStatus(
        row.status as string,
        subscriptionsByProject.get(row.id as string) ?? null,
      ) === "inactive",
    )
    .map((row) => row.id as string)
}

function intersectProjectIds(
  current: string[] | null,
  next: string[],
): string[] | null {
  if (next.length === 0) return []
  if (current === null) return next

  const nextSet = new Set(next)
  return current.filter((id) => nextSet.has(id))
}

function mapProjectRows(
  rows: ProjectRow[],
  memberCounts: Map<string, number>,
  subscriptionsByProject: Map<string, ProjectSubscriptionInfo>,
): BackofficeProjectRow[] {
  return rows.map((row) => {
    const company = firstRelation(row.companies)
    const subscription = subscriptionsByProject.get(row.id)

    return {
      id: row.id,
      name: row.name,
      location: row.location,
      status: row.status,
      subscriptionStatus: resolveBackofficeProjectSubscriptionStatus(
        row.status,
        subscription?.snapshot ?? null,
      ),
      totalSurfaceM2: row.total_surface_m2,
      company: company ? { id: company.id, name: company.name } : null,
      planName: subscription?.planName ?? null,
      memberCount: memberCounts.get(row.id) ?? 0,
      createdAt: row.created_at,
    }
  })
}

async function getCompanyOwnerUserId(
  admin: ReturnType<typeof createAdminClient>,
  companyId: string,
): Promise<string | null> {
  const { data, error } = await admin
    .from("company_members")
    .select("user_id")
    .eq("company_id", companyId)
    .eq("role", "owner")
    .eq("status", "active")
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data?.user_id as string | undefined) ?? null
}

async function addOwnerAsProjectMember(
  admin: ReturnType<typeof createAdminClient>,
  projectId: string,
  ownerUserId: string,
): Promise<void> {
  const catalog = await loadProjectCatalogIds(admin)

  const { error } = await admin.from("project_members").insert({
    project_id: projectId,
    user_id: ownerUserId,
    role_id: catalog.roleIds.Administrador,
    user_type_id: catalog.userTypeIds.Owner,
    is_active: true,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function getBackofficeProjects(
  params: GetBackofficeProjectsParams = {},
): Promise<BackofficeProjectsResult> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const page = parsePage(params.page)
  const pageSize = parsePageSize(params.pageSize)
  const search = sanitizeSearchTerm(params.search ?? "")
  const planSlugs = params.planSlugs ?? []
  const statuses = params.statuses ?? []

  let projectIdsFilter: string[] | null = null

  if (planSlugs.length > 0) {
    projectIdsFilter = await getProjectIdsForPlanSlugs(admin, planSlugs)
    if (projectIdsFilter.length === 0) {
      return {
        projects: [],
        totalCount: 0,
        page: 1,
        pageSize,
        totalPages: 1,
      }
    }
  }

  if (statuses.length > 0) {
    projectIdsFilter = intersectProjectIds(
      projectIdsFilter,
      await getProjectIdsForStatuses(admin, statuses),
    )

    if (projectIdsFilter !== null && projectIdsFilter.length === 0) {
      return {
        projects: [],
        totalCount: 0,
        page: 1,
        pageSize,
        totalPages: 1,
      }
    }
  }

  let query = admin
    .from("projects")
    .select(
      "id, name, location, status, total_surface_m2, company_id, created_at, companies(id, name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })

  if (projectIdsFilter !== null) {
    query = query.in("id", projectIdsFilter)
  }

  if (search) {
    const pattern = `%${search}%`
    const companyIds = await getCompanyIdsMatchingSearch(admin, search)
    const filters = [`name.ilike.${pattern}`, `location.ilike.${pattern}`]

    if (companyIds.length > 0) {
      filters.push(`company_id.in.(${companyIds.join(",")})`)
    }

    query = query.or(filters.join(","))
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as ProjectRow[]
  const projectIds = rows.map((row) => row.id)
  const [memberCounts, subscriptionsByProject] = await Promise.all([
    getActiveMemberCountsByProject(admin, projectIds),
    getSubscriptionInfoByProject(admin, projectIds),
  ])

  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return {
    projects: mapProjectRows(rows, memberCounts, subscriptionsByProject),
    totalCount,
    page: Math.min(page, totalPages),
    pageSize,
    totalPages,
  }
}

export async function searchBackofficeProjectCompanyCandidates(
  search: string,
): Promise<BackofficeProjectCompanyCandidate[]> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const term = sanitizeSearchTerm(search)
  if (!term) return []

  const pattern = `%${term}%`
  const { data, error } = await admin
    .from("companies")
    .select("id, name")
    .ilike("name", pattern)
    .order("created_at", { ascending: false })
    .limit(5)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((company) => ({
    id: company.id as string,
    name: company.name,
  }))
}

export async function createBackofficeProject(
  input: BackofficeProjectCreateInput,
): Promise<BackofficeProjectActionResult> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const normalized = normalizeProjectInput(input)
  if (!normalized.ok) return normalized

  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("id")
    .eq("id", normalized.data.company_id)
    .maybeSingle()

  if (companyError) {
    return { ok: false, error: companyError.message }
  }

  if (!company) {
    return { ok: false, error: "No encontramos esa empresa." }
  }

  const ownerUserId = await getCompanyOwnerUserId(admin, normalized.data.company_id)
  if (!ownerUserId) {
    return {
      ok: false,
      error: "La empresa debe tener un owner activo para crear un proyecto.",
    }
  }

  const { data: created, error } = await admin
    .from("projects")
    .insert({
      ...normalized.data,
      created_by: ownerUserId,
    })
    .select("id")
    .single()

  if (error || !created) {
    return { ok: false, error: error?.message ?? "No pudimos crear el proyecto." }
  }

  try {
    await addOwnerAsProjectMember(admin, created.id, ownerUserId)
  } catch (memberError) {
    await admin.from("projects").delete().eq("id", created.id)
    return {
      ok: false,
      error:
        memberError instanceof Error
          ? memberError.message
          : "No pudimos configurar el proyecto.",
    }
  }

  const subscriptionResult = await createProjectSubscription(
    admin,
    created.id,
    input.subscription,
  )

  if (!subscriptionResult.ok) {
    await admin.from("projects").delete().eq("id", created.id)
    return subscriptionResult
  }

  revalidatePath("/backoffice/proyectos")
  return { ok: true }
}

export async function updateBackofficeProject(
  projectId: string,
  input: BackofficeProjectUpdateInput,
): Promise<BackofficeProjectActionResult> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const normalized = normalizeProjectInput(input)
  if (!normalized.ok) return normalized

  const { data: existing, error: existingError } = await admin
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle()

  if (existingError) {
    return { ok: false, error: existingError.message }
  }

  if (!existing) {
    return { ok: false, error: "No encontramos ese proyecto." }
  }

  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("id")
    .eq("id", normalized.data.company_id)
    .maybeSingle()

  if (companyError) {
    return { ok: false, error: companyError.message }
  }

  if (!company) {
    return { ok: false, error: "No encontramos esa empresa." }
  }

  const { error } = await admin
    .from("projects")
    .update(normalized.data)
    .eq("id", projectId)

  if (error) {
    return { ok: false, error: error.message }
  }

  if (input.cancelSubscription) {
    const cancelResult = await cancelProjectSubscriptionByProjectId(admin, projectId)
    if (!cancelResult.ok) return cancelResult
  } else if (input.subscription) {
    const { data: existingSubscriptionRow, error: subscriptionLookupError } = await admin
      .from("project_subscriptions")
      .select("id, status")
      .eq("project_id", projectId)
      .maybeSingle()

    if (subscriptionLookupError) {
      return { ok: false, error: subscriptionLookupError.message }
    }

    if (existingSubscriptionRow?.status === "cancelled") {
      return {
        ok: false,
        error: "La subscripción está cancelada. No se puede modificar.",
      }
    }

    const subscriptionResult = await upsertProjectSubscription(
      admin,
      projectId,
      input.subscription,
      existingSubscriptionRow
        ? { existingSubscriptionId: existingSubscriptionRow.id as string }
        : undefined,
    )

    if (!subscriptionResult.ok) return subscriptionResult
  }

  revalidatePath("/backoffice/proyectos")
  return { ok: true }
}

export async function deleteBackofficeProject(
  projectId: string,
): Promise<BackofficeProjectActionResult> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const { data: existing, error: existingError } = await admin
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .maybeSingle()

  if (existingError) {
    return { ok: false, error: existingError.message }
  }

  if (!existing) {
    return { ok: false, error: "No encontramos ese proyecto." }
  }

  const { error } = await admin.from("projects").delete().eq("id", projectId)

  if (error) {
    const message = error.message.toLowerCase()

    if (
      message.includes("foreign key") ||
      message.includes("violates") ||
      message.includes("restrict")
    ) {
      return {
        ok: false,
        error:
          "No se puede eliminar este proyecto porque tiene datos asociados.",
      }
    }

    return { ok: false, error: error.message }
  }

  revalidatePath("/backoffice/proyectos")
  return { ok: true }
}

export async function cancelBackofficeProjectSubscription(
  projectId: string,
): Promise<BackofficeProjectActionResult> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const { data: existing, error: existingError } = await admin
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .maybeSingle()

  if (existingError) {
    return { ok: false, error: existingError.message }
  }

  if (!existing) {
    return { ok: false, error: "No encontramos ese proyecto." }
  }

  const result = await cancelProjectSubscriptionByProjectId(admin, projectId)
  if (!result.ok) return result

  revalidatePath("/backoffice/proyectos")
  return { ok: true }
}
