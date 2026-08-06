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
  type BackofficeBillingInterval,
} from "@/lib/backoffice/projectSubscriptionForm"

export type { BackofficeProjectSubscriptionDetails } from "@/lib/backoffice/projectSubscriptionForm"
export type { SubscriptionProrationResult } from "@/lib/backoffice/subscriptionProration"

export type BackofficeSubscriptionProrationPreview = {
  applies: boolean
  cycleReset: boolean
  proration: SubscriptionProrationResult | null
  fromPlanLabel: string
  toPlanLabel: string
  message: string
}

import {
  appendBillingNote,
  buildProrationBillingNote,
  computeSubscriptionProration,
  getCurrentPeriodStart,
  type SubscriptionProrationResult,
} from "@/lib/backoffice/subscriptionProration"
import { formatDashboardInputDate } from "@/lib/backoffice/dashboardPeriodClient"
import { getBackofficePlanFilterLabel } from "@/lib/backoffice/proyectosFilters"
import { getSubscriptionMonthlyUsd } from "@/lib/backoffice/clientesBilling"
import {
  buildOverdueDebtByProject,
  computeProjectOverdueDebtUsd,
} from "@/lib/backoffice/dashboardBilling"
import type {
  ManualPaymentMethod,
  SubscriptionBillingEntry,
  SubscriptionBillingSummary,
} from "@/lib/backoffice/subscriptionBilling"
import { summarizeBillingEntries } from "@/lib/backoffice/subscriptionBilling"
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
  planLabel: string | null
  billingInterval: "monthly" | "annual" | null
  amountUsd: number | null
  porCobrarUsd: number
  debtUsd: number
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

function planLabelFromRow(plan: SubscriptionPlanRow): string {
  const catalogLabel = getBackofficePlanFilterLabel(plan.slug)
  if (catalogLabel !== plan.slug) return catalogLabel
  return `${plan.name} · ${plan.surface_label}`
}

function planSnapshotFromRow(plan: SubscriptionPlanRow) {
  return {
    id: plan.id,
    label: planLabelFromRow(plan),
    monthlyPriceUsd: toNumber(plan.monthly_price_usd),
    annualMonthlyPriceUsd: toNumber(plan.annual_monthly_price_usd),
  }
}

function parseBillingStartDateFromInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null
  }

  return new Date(year, month - 1, day)
}

function isBillingCycleReset(
  formPeriodStart: Date,
  renewsAt: string | null,
  billingInterval: BackofficeBillingInterval,
): boolean {
  if (!renewsAt) return true

  const currentPeriodStart = getCurrentPeriodStart(
    new Date(renewsAt),
    billingInterval,
  )

  return (
    formatDashboardInputDate(formPeriodStart) !==
    formatDashboardInputDate(currentPeriodStart)
  )
}

async function fetchSubscriptionPlanById(
  admin: ReturnType<typeof createAdminClient>,
  planId: string,
): Promise<SubscriptionPlanRow | null> {
  const { data, error } = await admin
    .from("subscription_plans")
    .select(
      "id, slug, name, surface_label, surface_max_m2, monthly_price_usd, annual_monthly_price_usd, price_label",
    )
    .eq("id", planId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as SubscriptionPlanRow | null) ?? null
}

async function buildSubscriptionProrationContext(
  admin: ReturnType<typeof createAdminClient>,
  projectId: string,
  subscriptionInput: BackofficeProjectSubscriptionInput,
  options: {
    existingSubscriptionId: string
    existingPlanRow: SubscriptionPlanRow
    renewsAt: string | null
    billingInterval: BackofficeBillingInterval
    billingNote: string | null
  },
): Promise<
  | {
      ok: true
      cycleReset: boolean
      proration: SubscriptionProrationResult | null
      toPlanRow: SubscriptionPlanRow
      toPlanId: string
      billingNote: string | null
    }
  | { ok: false; error: string }
> {
  const normalizedSubscription = normalizeProjectSubscriptionInput(subscriptionInput)
  if (!normalizedSubscription.ok) return normalizedSubscription

  const planResult = await resolveSubscriptionPlanId(admin, normalizedSubscription, {
    existingCustomPlanId:
      subscriptionInput.planGroupId === "custom"
        ? subscriptionInput.existingPlanId
        : undefined,
  })
  if (!planResult.ok) return planResult

  const toPlanRow =
    planResult.planId === options.existingPlanRow.id
      ? options.existingPlanRow
      : await fetchSubscriptionPlanById(admin, planResult.planId)

  if (!toPlanRow) {
    return { ok: false, error: "No encontramos el plan destino." }
  }

  const formPeriodStart = parseBillingStartDateFromInput(
    subscriptionInput.billingStartDate,
  )
  if (!formPeriodStart) {
    return { ok: false, error: "El inicio del período de facturación no es válido." }
  }

  const cycleReset = isBillingCycleReset(
    formPeriodStart,
    options.renewsAt,
    options.billingInterval,
  )

  if (cycleReset || !options.renewsAt) {
    return {
      ok: true,
      cycleReset: true,
      proration: null,
      toPlanRow,
      toPlanId: planResult.planId,
      billingNote: options.billingNote,
    }
  }

  const periodEnd = new Date(options.renewsAt)
  const periodStart = getCurrentPeriodStart(periodEnd, options.billingInterval)
  const fromPlan = planSnapshotFromRow(options.existingPlanRow)
  const toPlan = planSnapshotFromRow(toPlanRow)

  const intervalForPricing =
    normalizedSubscription.data.billingInterval ?? options.billingInterval

  const proration = computeSubscriptionProration({
    fromPlan,
    toPlan,
    billingInterval: intervalForPricing,
    periodStart,
    periodEnd,
  })

  const hasPriceChange =
    fromPlan.monthlyPriceUsd !== toPlan.monthlyPriceUsd ||
    fromPlan.annualMonthlyPriceUsd !== toPlan.annualMonthlyPriceUsd

  const shouldApplyProration =
    proration.canCalculate &&
    !proration.skipReason?.includes("No hay cambio") &&
    (proration.isPlanChange || hasPriceChange)

  if (!shouldApplyProration) {
    const note =
      proration.isPlanChange && !proration.canCalculate
        ? appendBillingNote(
            options.billingNote,
            buildProrationBillingNote(proration, fromPlan.label, toPlan.label),
          )
        : options.billingNote

    return {
      ok: true,
      cycleReset: false,
      proration: proration.skipReason?.includes("No hay cambio") ? null : proration,
      toPlanRow,
      toPlanId: planResult.planId,
      billingNote: note,
    }
  }

  const note = buildProrationBillingNote(proration, fromPlan.label, toPlan.label)

  return {
    ok: true,
    cycleReset: false,
    proration,
    toPlanRow,
    toPlanId: planResult.planId,
    billingNote: appendBillingNote(options.billingNote, note),
  }
}

async function updateExistingProjectSubscription(
  admin: ReturnType<typeof createAdminClient>,
  projectId: string,
  subscriptionInput: BackofficeProjectSubscriptionInput,
  existingSubscriptionId: string,
): Promise<BackofficeProjectActionResult> {
  const { data: existing, error: existingError } = await admin
    .from("project_subscriptions")
    .select(
      `
      id,
      project_id,
      plan_id,
      billing_interval,
      started_at,
      renews_at,
      billing_note,
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
    .eq("id", existingSubscriptionId)
    .maybeSingle()

  if (existingError) return { ok: false, error: existingError.message }
  if (!existing) return { ok: false, error: "No encontramos la subscripción." }

  const existingPlanRow = firstRelation(
    existing.plan as SubscriptionPlanRow | SubscriptionPlanRow[] | null,
  )
  if (!existingPlanRow) {
    return { ok: false, error: "No encontramos el plan actual de la subscripción." }
  }

  const existingInterval =
    existing.billing_interval === "annual" ? "annual" : "monthly"

  const context = await buildSubscriptionProrationContext(
    admin,
    projectId,
    subscriptionInput,
    {
      existingSubscriptionId,
      existingPlanRow,
      renewsAt: existing.renews_at as string | null,
      billingInterval: existingInterval,
      billingNote: existing.billing_note as string | null,
    },
  )

  if (!context.ok) return context

  const normalizedSubscription = normalizeProjectSubscriptionInput(subscriptionInput)
  if (!normalizedSubscription.ok) return normalizedSubscription
  const { data } = normalizedSubscription

  if (context.cycleReset) {
    const { error } = await admin
      .from("project_subscriptions")
      .update({
        plan_id: context.toPlanId,
        billing_interval: data.billingInterval,
        started_at: data.startedAt.toISOString(),
        renews_at: data.renewsAt.toISOString(),
        billing_note: context.billingNote,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingSubscriptionId)

    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  const proration = context.proration

  if (
    proration?.canCalculate &&
    !proration.skipReason?.includes("No hay cambio")
  ) {
    const { data: planChangeRow, error: changeError } = await admin
      .from("subscription_plan_changes")
      .insert({
      project_subscription_id: existingSubscriptionId,
      project_id: projectId,
      from_plan_id: existingPlanRow.id,
      to_plan_id: context.toPlanId,
      billing_interval: data.billingInterval,
      effective_at: proration.effectiveAt.toISOString(),
      period_started_at: proration.periodStart.toISOString(),
      period_ends_at: proration.periodEnd.toISOString(),
      days_remaining: proration.daysRemaining,
      days_in_period: proration.daysInPeriod,
      from_period_price_usd: proration.fromPeriodPriceUsd,
      to_period_price_usd: proration.toPeriodPriceUsd,
      credit_usd: proration.creditUsd,
      charge_usd: proration.chargeUsd,
      net_amount_usd: proration.netAmountUsd,
      note: buildProrationBillingNote(
        proration,
        planSnapshotFromRow(existingPlanRow).label,
        planSnapshotFromRow(context.toPlanRow).label,
      ),
    })
      .select("id")
      .single()

    if (changeError) return { ok: false, error: changeError.message }

    if (proration.netAmountUsd !== 0) {
      const billingNote = buildProrationBillingNote(
        proration,
        planSnapshotFromRow(existingPlanRow).label,
        planSnapshotFromRow(context.toPlanRow).label,
      )

      const { error: billingError } = await admin
        .from("subscription_billing_entries")
        .insert({
          project_id: projectId,
          project_subscription_id: existingSubscriptionId,
          entry_type: "proration",
          amount_usd: proration.netAmountUsd,
          description: billingNote,
          effective_at: proration.effectiveAt.toISOString(),
          plan_change_id: planChangeRow.id,
        })

      if (billingError) return { ok: false, error: billingError.message }
    }

    const { error } = await admin
      .from("project_subscriptions")
      .update({
        plan_id: context.toPlanId,
        billing_interval: data.billingInterval,
        billing_note: context.billingNote,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingSubscriptionId)

    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  const { error } = await admin
    .from("project_subscriptions")
    .update({
      plan_id: context.toPlanId,
      billing_interval: data.billingInterval,
      billing_note: context.billingNote,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existingSubscriptionId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function previewBackofficeSubscriptionPlanChange(
  projectId: string,
  subscriptionInput: BackofficeProjectSubscriptionInput,
): Promise<BackofficeSubscriptionProrationPreview> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const { data: existing, error } = await admin
    .from("project_subscriptions")
    .select(
      `
      id,
      billing_interval,
      renews_at,
      billing_note,
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

  if (!existing) {
    return {
      applies: false,
      cycleReset: false,
      proration: null,
      fromPlanLabel: "",
      toPlanLabel: "",
      message: "Este proyecto aún no tiene subscripción.",
    }
  }

  const existingPlanRow = firstRelation(
    existing.plan as SubscriptionPlanRow | SubscriptionPlanRow[] | null,
  )
  if (!existingPlanRow) {
    return {
      applies: false,
      cycleReset: false,
      proration: null,
      fromPlanLabel: "",
      toPlanLabel: "",
      message: "No encontramos el plan actual.",
    }
  }

  const existingInterval =
    existing.billing_interval === "annual" ? "annual" : "monthly"

  const context = await buildSubscriptionProrationContext(
    admin,
    projectId,
    subscriptionInput,
    {
      existingSubscriptionId: existing.id as string,
      existingPlanRow,
      renewsAt: existing.renews_at as string | null,
      billingInterval: existingInterval,
      billingNote: existing.billing_note as string | null,
    },
  )

  if (!context.ok) {
    return {
      applies: false,
      cycleReset: false,
      proration: null,
      fromPlanLabel: planLabelFromRow(existingPlanRow),
      toPlanLabel: "",
      message: context.error,
    }
  }

  const fromPlanLabel = planLabelFromRow(existingPlanRow)
  const toPlanLabel = planLabelFromRow(context.toPlanRow)

  if (context.cycleReset) {
    return {
      applies: true,
      cycleReset: true,
      proration: null,
      fromPlanLabel,
      toPlanLabel,
      message:
        "Cambiaste el inicio del período: se reinicia el ciclo de facturación sin prorrateo.",
    }
  }

  const proration = context.proration
  if (!proration) {
    return {
      applies: false,
      cycleReset: false,
      proration: null,
      fromPlanLabel,
      toPlanLabel,
      message: "Sin cambios de plan ni precio en el período actual.",
    }
  }

  if (!proration.canCalculate) {
    return {
      applies: true,
      cycleReset: false,
      proration,
      fromPlanLabel,
      toPlanLabel,
      message: proration.skipReason ?? "No se pudo calcular el prorrateo.",
    }
  }

  if (proration.skipReason?.includes("No hay cambio")) {
    return {
      applies: false,
      cycleReset: false,
      proration,
      fromPlanLabel,
      toPlanLabel,
      message: "Sin cambios de plan ni precio en el período actual.",
    }
  }

  const netLabel =
    proration.netAmountUsd > 0
      ? `Cargo prorrateado de USD ${proration.netAmountUsd.toFixed(0)}`
      : proration.netAmountUsd < 0
        ? `Crédito prorrateado de USD ${Math.abs(proration.netAmountUsd).toFixed(0)}`
        : "Sin diferencia prorrateada"

  return {
    applies: true,
    cycleReset: false,
    proration,
    fromPlanLabel,
    toPlanLabel,
    message: `${fromPlanLabel} → ${toPlanLabel}. ${proration.daysRemaining} días restantes de ${proration.daysInPeriod}. ${netLabel}. La renovación se mantiene.`,
  }
}

async function upsertProjectSubscription(
  admin: ReturnType<typeof createAdminClient>,
  projectId: string,
  subscriptionInput: BackofficeProjectSubscriptionInput,
  options?: { existingSubscriptionId?: string },
): Promise<BackofficeProjectActionResult> {
  if (options?.existingSubscriptionId) {
    return updateExistingProjectSubscription(
      admin,
      projectId,
      subscriptionInput,
      options.existingSubscriptionId,
    )
  }

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
  billing_interval: string
  plan:
    | {
        name: string
        slug: string
        monthly_price_usd: number | null
        annual_monthly_price_usd: number | null
      }
    | {
        name: string
        slug: string
        monthly_price_usd: number | null
        annual_monthly_price_usd: number | null
      }[]
    | null
}

type ProjectSubscriptionInfo = {
  planName: string | null
  planLabel: string | null
  billingInterval: "monthly" | "annual" | null
  amountUsd: number | null
  snapshot: ProjectSubscriptionSnapshot
}

function toSubscriptionPriceNumber(
  value: number | string | null | undefined,
): number | null {
  if (value == null) return null
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

async function getSubscriptionInfoByProject(
  admin: ReturnType<typeof createAdminClient>,
  projectIds: string[],
): Promise<Map<string, ProjectSubscriptionInfo>> {
  if (projectIds.length === 0) return new Map()

  const { data, error } = await admin
    .from("project_subscriptions")
    .select(
      `
      project_id,
      status,
      renews_at,
      billing_interval,
      plan:subscription_plans (
        name,
        slug,
        monthly_price_usd,
        annual_monthly_price_usd
      )
    `,
    )
    .in("project_id", projectIds)

  if (error) {
    throw new Error(error.message)
  }

  const subscriptionsByProject = new Map<string, ProjectSubscriptionInfo>()

  for (const row of (data ?? []) as SubscriptionRow[]) {
    const plan = firstRelation(row.plan)
    const billingInterval = row.billing_interval === "annual" ? "annual" : "monthly"
    const monthlyUsd =
      plan != null
        ? getSubscriptionMonthlyUsd({
            status: row.status,
            renewsAt: row.renews_at,
            billingInterval,
            planSlug: plan.slug,
            monthlyPriceUsd: toSubscriptionPriceNumber(plan.monthly_price_usd),
            annualMonthlyPriceUsd: toSubscriptionPriceNumber(
              plan.annual_monthly_price_usd,
            ),
          })
        : 0

    subscriptionsByProject.set(row.project_id, {
      planName: plan?.name ?? null,
      planLabel: plan?.slug ? getBackofficePlanFilterLabel(plan.slug) : null,
      billingInterval,
      amountUsd: monthlyUsd > 0 ? monthlyUsd : null,
      snapshot: {
        status: row.status,
      },
    })
  }

  return subscriptionsByProject
}

type ProjectBillingSnapshot = {
  balanceUsd: number
  porCobrarUsd: number
  debtUsd: number
}

async function getBillingDataByProject(
  admin: ReturnType<typeof createAdminClient>,
  projectIds: string[],
  subscriptionsByProject: Map<string, ProjectSubscriptionInfo>,
): Promise<Map<string, ProjectBillingSnapshot>> {
  if (projectIds.length === 0) return new Map()

  const { data, error } = await admin
    .from("subscription_billing_entries")
    .select("project_id, amount_usd, effective_at, created_at")
    .in("project_id", projectIds)
    .order("effective_at", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const entriesByProject = new Map<
    string,
    Array<{ amountUsd: number; effectiveAt: string }>
  >()

  for (const row of data ?? []) {
    const projectId = row.project_id as string
    const current = entriesByProject.get(projectId) ?? []
    current.push({
      amountUsd: Number(row.amount_usd),
      effectiveAt: row.effective_at as string,
    })
    entriesByProject.set(projectId, current)
  }

  const billingByProject = new Map<string, ProjectBillingSnapshot>()
  const asOf = new Date()

  for (const projectId of projectIds) {
    const entries = entriesByProject.get(projectId) ?? []
    const subscription = subscriptionsByProject.get(projectId)

    let balanceUsd = 0

    for (const entry of entries) {
      balanceUsd += entry.amountUsd
    }

    const billingContext = subscription?.billingInterval
      ? { billingInterval: subscription.billingInterval }
      : null

    const debtUsd =
      billingContext != null
        ? computeProjectOverdueDebtUsd(entries, billingContext, asOf)
        : 0

    const porCobrarUsd = Math.max(0, balanceUsd)

    billingByProject.set(projectId, {
      balanceUsd: Math.round(balanceUsd * 100) / 100,
      porCobrarUsd: Math.round(porCobrarUsd * 100) / 100,
      debtUsd: Math.round(debtUsd * 100) / 100,
    })
  }

  return billingByProject
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

async function getProjectIdsByComputedStatus(
  admin: ReturnType<typeof createAdminClient>,
): Promise<Record<BackofficeProjectStatusKind, string[]>> {
  const [
    { data: projects, error: projectsError },
    { data: subscriptions, error: subscriptionsError },
    { data: billingRows, error: billingError },
  ] = await Promise.all([
    admin.from("projects").select("id, status"),
    admin
      .from("project_subscriptions")
      .select("project_id, status, billing_interval"),
    admin
      .from("subscription_billing_entries")
      .select("project_id, amount_usd, effective_at"),
  ])

  if (projectsError) throw new Error(projectsError.message)
  if (subscriptionsError) throw new Error(subscriptionsError.message)
  if (billingError) throw new Error(billingError.message)

  const subscriptionsByProject = new Map<
    string,
    { status: string; billingInterval: "monthly" | "annual" }
  >()

  for (const row of subscriptions ?? []) {
    subscriptionsByProject.set(row.project_id as string, {
      status: row.status as string,
      billingInterval: row.billing_interval === "annual" ? "annual" : "monthly",
    })
  }

  const projectBillingContexts = new Map<
    string,
    { billingInterval: "monthly" | "annual" }
  >()

  for (const [projectId, subscription] of subscriptionsByProject) {
    projectBillingContexts.set(projectId, {
      billingInterval: subscription.billingInterval,
    })
  }

  const billingEntries = (billingRows ?? []).map((row) => ({
    projectId: row.project_id as string,
    companyId: "",
    amountUsd: Number(row.amount_usd),
    effectiveAt: row.effective_at as string,
  }))

  const overdueDebtByProject = buildOverdueDebtByProject(
    billingEntries,
    projectBillingContexts,
    new Date(),
  )

  const buckets: Record<BackofficeProjectStatusKind, string[]> = {
    active: [],
    inactive: [],
    expired: [],
    disabled: [],
  }

  for (const row of projects ?? []) {
    const projectId = row.id as string
    const subscription = subscriptionsByProject.get(projectId)

    const status = resolveBackofficeProjectSubscriptionStatus(
      row.status as string,
      subscription ? { status: subscription.status } : null,
      { overdueDebtUsd: overdueDebtByProject.get(projectId) ?? 0 },
    )

    buckets[status].push(projectId)
  }

  return buckets
}

async function getProjectIdsForStatuses(
  admin: ReturnType<typeof createAdminClient>,
  statuses: BackofficeProjectStatusKind[],
): Promise<string[]> {
  const buckets = await getProjectIdsByComputedStatus(admin)
  const ids = new Set<string>()

  for (const status of statuses) {
    for (const projectId of buckets[status]) {
      ids.add(projectId)
    }
  }

  return [...ids]
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
  billingByProject: Map<string, ProjectBillingSnapshot>,
): BackofficeProjectRow[] {
  return rows.map((row) => {
    const company = firstRelation(row.companies)
    const subscription = subscriptionsByProject.get(row.id)
    const billing = billingByProject.get(row.id)

    return {
      id: row.id,
      name: row.name,
      location: row.location,
      status: row.status,
      subscriptionStatus: resolveBackofficeProjectSubscriptionStatus(
        row.status,
        subscription?.snapshot ?? null,
        { overdueDebtUsd: billing?.debtUsd ?? 0 },
      ),
      totalSurfaceM2: row.total_surface_m2,
      company: company ? { id: company.id, name: company.name } : null,
      planName: subscription?.planName ?? null,
      planLabel: subscription?.planLabel ?? null,
      billingInterval: subscription?.billingInterval ?? null,
      amountUsd: subscription?.amountUsd ?? null,
      porCobrarUsd: billing?.porCobrarUsd ?? 0,
      debtUsd: billing?.debtUsd ?? 0,
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

  const billingByProject = await getBillingDataByProject(
    admin,
    projectIds,
    subscriptionsByProject,
  )

  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return {
    projects: mapProjectRows(
      rows,
      memberCounts,
      subscriptionsByProject,
      billingByProject,
    ),
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

export type { SubscriptionBillingSummary } from "@/lib/backoffice/subscriptionBilling"

export type BackofficeManualPaymentInput = {
  amountUsd: number
  paidAt: string
  paymentMethod: ManualPaymentMethod
  note?: string
}

export type BackofficeManualChargeInput = {
  amountUsd: number
  effectiveAt: string
  note?: string
}

async function insertManualBillingEntry(
  admin: ReturnType<typeof createAdminClient>,
  options: {
    projectId: string
    projectName: string
    userId: string
    entryType: "payment" | "adjustment"
    amountUsd: number
    effectiveAt: Date
    paymentMethod?: ManualPaymentMethod
    note?: string
  },
): Promise<BackofficeProjectActionResult> {
  const { data: subscription } = await admin
    .from("project_subscriptions")
    .select("id")
    .eq("project_id", options.projectId)
    .maybeSingle()

  const signedAmount =
    options.entryType === "payment" ? -options.amountUsd : options.amountUsd

  const defaultDescription =
    options.entryType === "payment"
      ? `Pago manual — ${options.projectName}`
      : `Cargo manual — ${options.projectName}`

  const description = options.note?.trim() || defaultDescription

  const { error } = await admin.from("subscription_billing_entries").insert({
    project_id: options.projectId,
    project_subscription_id: subscription?.id ?? null,
    entry_type: options.entryType,
    amount_usd: signedAmount,
    description,
    effective_at: options.effectiveAt.toISOString(),
    payment_method: options.paymentMethod ?? null,
    created_by: options.userId,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath("/backoffice/proyectos")
  revalidatePath("/backoffice/clientes")
  revalidatePath("/backoffice/dashboard")
  return { ok: true }
}

function mapBillingEntryRow(row: {
  id: string
  project_id: string
  entry_type: string
  amount_usd: number | string
  description: string | null
  effective_at: string
  payment_method: string | null
  created_at: string
}): SubscriptionBillingEntry {
  return {
    id: row.id,
    projectId: row.project_id,
    entryType: row.entry_type as SubscriptionBillingEntry["entryType"],
    amountUsd: Number(row.amount_usd),
    description: row.description,
    effectiveAt: row.effective_at,
    paymentMethod: row.payment_method,
    createdAt: row.created_at,
  }
}

export async function getBackofficeProjectBilling(
  projectId: string,
): Promise<SubscriptionBillingSummary> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("subscription_billing_entries")
    .select(
      "id, project_id, entry_type, amount_usd, description, effective_at, payment_method, created_at",
    )
    .eq("project_id", projectId)
    .order("effective_at", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const entries = (data ?? []).map(mapBillingEntryRow)
  const summary = summarizeBillingEntries(entries)

  const subscriptionsByProject = await getSubscriptionInfoByProject(admin, [projectId])
  const subscription = subscriptionsByProject.get(projectId)

  const ledgerEntries = entries.map((entry) => ({
    amountUsd: entry.amountUsd,
    effectiveAt: entry.effectiveAt,
  }))

  const debtUsd =
    subscription?.billingInterval != null
      ? computeProjectOverdueDebtUsd(
          ledgerEntries,
          { billingInterval: subscription.billingInterval },
          new Date(),
        )
      : 0

  const receivableUsd = Math.max(0, summary.balanceUsd - debtUsd)

  return {
    ...summary,
    debtUsd: Math.round(debtUsd * 100) / 100,
    receivableUsd: Math.round(receivableUsd * 100) / 100,
    entries,
  }
}

export async function recordBackofficeManualPayment(
  projectId: string,
  input: BackofficeManualPaymentInput,
): Promise<BackofficeProjectActionResult> {
  const user = await requireBackofficeUser()
  const admin = createAdminClient()

  const amountUsd = Number(input.amountUsd)
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return { ok: false, error: "Ingresá un monto válido mayor a cero." }
  }

  const paidAt = new Date(input.paidAt)
  if (Number.isNaN(paidAt.getTime())) {
    return { ok: false, error: "Ingresá una fecha de pago válida." }
  }

  const { data: project, error: projectError } = await admin
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .maybeSingle()

  if (projectError) return { ok: false, error: projectError.message }
  if (!project) return { ok: false, error: "No encontramos ese proyecto." }

  return insertManualBillingEntry(admin, {
    projectId,
    projectName: project.name,
    userId: user.id,
    entryType: "payment",
    amountUsd,
    effectiveAt: paidAt,
    paymentMethod: input.paymentMethod,
    note: input.note,
  })
}

export async function recordBackofficeManualCharge(
  projectId: string,
  input: BackofficeManualChargeInput,
): Promise<BackofficeProjectActionResult> {
  const user = await requireBackofficeUser()
  const admin = createAdminClient()

  const amountUsd = Number(input.amountUsd)
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return { ok: false, error: "Ingresá un monto válido mayor a cero." }
  }

  const effectiveAt = new Date(input.effectiveAt)
  if (Number.isNaN(effectiveAt.getTime())) {
    return { ok: false, error: "Ingresá una fecha válida." }
  }

  const { data: project, error: projectError } = await admin
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .maybeSingle()

  if (projectError) return { ok: false, error: projectError.message }
  if (!project) return { ok: false, error: "No encontramos ese proyecto." }

  return insertManualBillingEntry(admin, {
    projectId,
    projectName: project.name,
    userId: user.id,
    entryType: "adjustment",
    amountUsd,
    effectiveAt,
    note: input.note,
  })
}
