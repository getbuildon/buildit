import { addMonths, addYears } from "date-fns"

import { BACKOFFICE_PLAN_FILTER_GROUPS } from "@/lib/backoffice/proyectosFilters"
import { startOfArgentinaDay } from "@/lib/backoffice/dashboardPeriod"
import { formatDashboardInputDate } from "@/lib/backoffice/dashboardPeriodClient"

export type BackofficePlanGroupId =
  | "compacto"
  | "gran-escala"
  | "multiobra"
  | "custom"

export type BackofficeBillingInterval = "monthly" | "annual"

export type BackofficeSubscriptionPlanOption = {
  id: string
  slug: string
  name: string
  surfaceLabel: string
  surfaceMaxM2: number | null
  monthlyPriceUsd: number | null
  annualMonthlyPriceUsd: number | null
  priceLabel: string
  groupId: BackofficePlanGroupId | null
}

export type BackofficeCustomPlanInput = {
  name: string
  surfaceLabel: string
  surfaceMaxM2?: string
  monthlyPriceUsd: string
  annualMonthlyPriceUsd: string
}

export type BackofficeProjectSubscriptionInput = {
  planGroupId: BackofficePlanGroupId
  planSlug?: string
  customPlan?: BackofficeCustomPlanInput
  billingInterval: BackofficeBillingInterval
  billingStartDate: string
  /** Al editar un plan personalizado existente, se actualiza en lugar de crear uno nuevo. */
  existingPlanId?: string
}

export type BackofficeProjectSubscriptionDetails = {
  subscriptionId: string
  status: "active" | "cancelled" | "past_due"
  billingInterval: BackofficeBillingInterval
  startedAt: string
  renewsAt: string | null
  plan: BackofficeSubscriptionPlanOption & { isCustom: boolean }
}

const PLAN_GROUP_IDS = new Set<string>([
  "compacto",
  "gran-escala",
  "multiobra",
  "custom",
])

const KNOWN_SLUGS = new Set(
  BACKOFFICE_PLAN_FILTER_GROUPS.flatMap((group) =>
    group.tiers.map((tier) => tier.slug),
  ),
)

export function resolvePlanGroupId(slug: string): BackofficePlanGroupId | null {
  if (slug.startsWith("custom-")) return "custom"

  for (const group of BACKOFFICE_PLAN_FILTER_GROUPS) {
    if (group.tiers.some((tier) => tier.slug === slug)) {
      return group.id as BackofficePlanGroupId
    }
  }

  return null
}

function parseUsd(value: string | undefined): number | null {
  const trimmed = value?.trim()
  if (!trimmed) return null

  const normalized = trimmed.replace(",", ".")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function parseOptionalInt(value: string | undefined): number | null {
  const trimmed = value?.trim()
  if (!trimmed) return null

  const parsed = Number.parseInt(trimmed, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function parseBillingStartDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null
  }

  return startOfArgentinaDay(year, month, day)
}

export function computeSubscriptionRenewsAt(
  startedAt: Date,
  billingInterval: BackofficeBillingInterval,
): Date {
  return billingInterval === "annual"
    ? addYears(startedAt, 1)
    : addMonths(startedAt, 1)
}

export function formatPlanPricePreview(
  plan: Pick<
    BackofficeSubscriptionPlanOption,
    "monthlyPriceUsd" | "annualMonthlyPriceUsd" | "priceLabel"
  >,
  billingInterval: BackofficeBillingInterval,
): string {
  const price =
    billingInterval === "annual"
      ? plan.annualMonthlyPriceUsd
      : plan.monthlyPriceUsd

  if (price == null) return plan.priceLabel

  const suffix = billingInterval === "annual" ? "USD / mes (anual)" : "USD / mes"
  return `$${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(price)} ${suffix}`
}

export function normalizeProjectSubscriptionInput(
  input: BackofficeProjectSubscriptionInput | undefined,
):
  | { ok: true; data: NormalizedProjectSubscriptionInput }
  | { ok: false; error: string } {
  if (!input) {
    return { ok: false, error: "La subscripción es obligatoria al crear un proyecto." }
  }

  if (!PLAN_GROUP_IDS.has(input.planGroupId)) {
    return { ok: false, error: "El tipo de plan no es válido." }
  }

  if (input.billingInterval !== "monthly" && input.billingInterval !== "annual") {
    return { ok: false, error: "El intervalo de facturación no es válido." }
  }

  const startedAt = parseBillingStartDate(input.billingStartDate)
  if (!startedAt) {
    return { ok: false, error: "El inicio de facturación no es válido." }
  }

  if (input.planGroupId === "custom") {
    const name = input.customPlan?.name.trim() ?? ""
    const surfaceLabel = input.customPlan?.surfaceLabel.trim() ?? ""
    const monthlyPriceUsd = parseUsd(input.customPlan?.monthlyPriceUsd)
    const annualMonthlyPriceUsd = parseUsd(input.customPlan?.annualMonthlyPriceUsd)

    if (!name) {
      return { ok: false, error: "El nombre del plan personalizado es obligatorio." }
    }

    if (!surfaceLabel) {
      return {
        ok: false,
        error: "La descripción de superficie del plan personalizado es obligatoria.",
      }
    }

    if (monthlyPriceUsd == null && annualMonthlyPriceUsd == null) {
      return {
        ok: false,
        error: "Indicá al menos un precio mensual o anual para el plan personalizado.",
      }
    }

    return {
      ok: true,
      data: {
        planSlug: null,
        customPlan: {
          name,
          surfaceLabel,
          surfaceMaxM2: parseOptionalInt(input.customPlan?.surfaceMaxM2),
          monthlyPriceUsd,
          annualMonthlyPriceUsd,
        },
        billingInterval: input.billingInterval,
        startedAt,
        renewsAt: computeSubscriptionRenewsAt(startedAt, input.billingInterval),
      },
    }
  }

  const planSlug = input.planSlug?.trim() ?? ""
  if (!planSlug || !KNOWN_SLUGS.has(planSlug)) {
    return { ok: false, error: "Seleccioná un tier de plan válido." }
  }

  const expectedGroup = resolvePlanGroupId(planSlug)
  if (expectedGroup !== input.planGroupId) {
    return { ok: false, error: "El tier no corresponde al tipo de plan seleccionado." }
  }

  return {
    ok: true,
    data: {
      planSlug,
      customPlan: null,
      billingInterval: input.billingInterval,
      startedAt,
      renewsAt: computeSubscriptionRenewsAt(startedAt, input.billingInterval),
    },
  }
}

export type NormalizedProjectSubscriptionInput = {
  planSlug: string | null
  customPlan: {
    name: string
    surfaceLabel: string
    surfaceMaxM2: number | null
    monthlyPriceUsd: number | null
    annualMonthlyPriceUsd: number | null
  } | null
  billingInterval: BackofficeBillingInterval
  startedAt: Date
  renewsAt: Date
}

export function buildCustomPlanPriceLabel(
  monthlyPriceUsd: number | null,
  annualMonthlyPriceUsd: number | null,
): string {
  if (monthlyPriceUsd != null && annualMonthlyPriceUsd != null) {
    return `$${monthlyPriceUsd} USD / mes · $${annualMonthlyPriceUsd} USD / mes (anual)`
  }

  if (monthlyPriceUsd != null) {
    return `$${monthlyPriceUsd} USD / mes`
  }

  if (annualMonthlyPriceUsd != null) {
    return `$${annualMonthlyPriceUsd} USD / mes (anual)`
  }

  return "A cotizar"
}

export function subscriptionFormValueFromDetails(
  details: BackofficeProjectSubscriptionDetails,
): BackofficeProjectSubscriptionInput {
  const { plan } = details
  const isCustom = plan.isCustom
  const groupId = plan.groupId ?? (isCustom ? "custom" : "compacto")
  const startedDate = new Date(details.startedAt)

  const base: BackofficeProjectSubscriptionInput = {
    planGroupId: groupId,
    billingInterval: details.billingInterval,
    billingStartDate: formatDashboardInputDate(startedDate),
  }

  if (isCustom || groupId === "custom") {
    return {
      ...base,
      planGroupId: "custom",
      existingPlanId: plan.id,
      customPlan: {
        name: plan.name,
        surfaceLabel: plan.surfaceLabel,
        surfaceMaxM2:
          plan.surfaceMaxM2 != null ? String(plan.surfaceMaxM2) : "",
        monthlyPriceUsd:
          plan.monthlyPriceUsd != null ? String(plan.monthlyPriceUsd) : "",
        annualMonthlyPriceUsd:
          plan.annualMonthlyPriceUsd != null
            ? String(plan.annualMonthlyPriceUsd)
            : "",
      },
    }
  }

  return {
    ...base,
    planGroupId: groupId,
    planSlug: plan.slug,
  }
}
