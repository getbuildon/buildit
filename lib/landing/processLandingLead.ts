import {
  getContractCountry,
  getContractProvincesForCountry,
  type ContractCountryCode,
} from "@/lib/landing/contractLocations"
import { isValidEmail } from "@/lib/landing/emailInput"
import { getPhoneDialOption, type PhoneDialCode } from "@/lib/landing/phoneInput"
import { getPlanSurfaceSummary } from "@/lib/landing/planFeaturePills"
import {
  getPlanDisplayPrice,
  PRICING_PLANS,
  type BillingPeriod,
} from "@/lib/landing/pricingPlans"
import type {
  LandingContactLeadPayload,
  LandingContractLeadPayload,
  LandingLeadPayload,
} from "@/lib/landing/submitLandingLead"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function readOptionalString(value: unknown): string | undefined {
  const trimmed = readString(value)
  return trimmed || undefined
}

function isPhoneDialCode(value: string): value is PhoneDialCode {
  return value === "ar" || value === "uy" || value === "py" || value === "cl"
}

function isBillingPeriod(value: string): value is BillingPeriod {
  return value === "annual" || value === "monthly"
}

function isContractCountryCode(value: string): value is ContractCountryCode {
  return value === "ar" || value === "uy" || value === "py" || value === "cl"
}

function parseBasePayload(body: Record<string, unknown>) {
  const firstName = readString(body.firstName)
  const lastName = readString(body.lastName)
  const company = readString(body.company)
  const email = readString(body.email).toLowerCase()
  const phoneDialCodeRaw = readString(body.phoneDialCode) || "ar"
  const phoneDialCode = isPhoneDialCode(phoneDialCodeRaw)
    ? phoneDialCodeRaw
    : "ar"
  const phone = readOptionalString(body.phone)

  if (!firstName || !lastName || !company || !email) {
    return { ok: false as const, error: "Completá los campos obligatorios." }
  }

  if (!isValidEmail(email)) {
    return { ok: false as const, error: "Ingresá un correo electrónico válido." }
  }

  return {
    ok: true as const,
    value: {
      firstName,
      lastName,
      company,
      email,
      phone,
      phoneDialCode,
    },
  }
}

export function parseLandingLeadPayload(
  body: unknown,
): { ok: true; value: LandingLeadPayload } | { ok: false; error: string } {
  if (!isRecord(body)) {
    return { ok: false, error: "Solicitud inválida." }
  }

  const kind = readString(body.kind)

  if (kind === "contact") {
    const base = parseBasePayload(body)
    if (!base.ok) return base

    const payload: LandingContactLeadPayload = {
      kind: "contact",
      ...base.value,
      comments: readOptionalString(body.comments),
    }

    return { ok: true, value: payload }
  }

  if (kind === "contract") {
    const base = parseBasePayload(body)
    if (!base.ok) return base

    const countryRaw = readString(body.country)
    const province = readString(body.province)
    const planId = readString(body.planId)
    const billingRaw = readString(body.billing)

    if (!countryRaw || !province || !planId || !billingRaw) {
      return { ok: false, error: "Completá los campos obligatorios." }
    }

    if (!isContractCountryCode(countryRaw)) {
      return { ok: false, error: "Seleccioná un país válido." }
    }

    if (!isBillingPeriod(billingRaw)) {
      return { ok: false, error: "Seleccioná un período de facturación válido." }
    }

    const plan = PRICING_PLANS.find((item) => item.id === planId)
    if (!plan) {
      return { ok: false, error: "Seleccioná un plan válido." }
    }

    const provinces = getContractProvincesForCountry(countryRaw)
    if (!provinces.some((item) => item.value === province)) {
      return { ok: false, error: "Seleccioná una provincia válida." }
    }

    const payload: LandingContractLeadPayload = {
      kind: "contract",
      ...base.value,
      country: countryRaw,
      province,
      planId,
      billing: billingRaw,
      surfaceTierId: readOptionalString(body.surfaceTierId),
    }

    return { ok: true, value: payload }
  }

  return { ok: false, error: "Tipo de solicitud inválido." }
}

function formatPhone(payload: LandingLeadPayload): string {
  const dial = getPhoneDialOption(payload.phoneDialCode)
  const phone = payload.phone?.trim()

  if (!phone) return "—"

  return `${dial.label} · ${phone}`
}

function getProvinceLabel(country: ContractCountryCode, province: string): string {
  return (
    getContractProvincesForCountry(country).find((item) => item.value === province)
      ?.label ?? province
  )
}

export function buildLandingLeadEmail(payload: LandingLeadPayload) {
  const fullName = `${payload.firstName} ${payload.lastName}`.trim()
  const baseRows = [
    { label: "Nombre", value: fullName },
    { label: "Empresa", value: payload.company },
    { label: "Correo", value: payload.email },
    { label: "Teléfono", value: formatPhone(payload) },
  ]

  if (payload.kind === "contact") {
    return {
      subject: `[BuildOn] Nueva solicitud de reunión — ${payload.company}`,
      emailTitle: "Nueva solicitud de reunión",
      heading: "Nueva solicitud de reunión",
      intro:
        "Alguien completó el formulario para agendar una reunión con el equipo desde la landing.",
      rows: [
        ...baseRows,
        { label: "Comentarios", value: payload.comments?.trim() || "—" },
      ],
    }
  }

  const plan = PRICING_PLANS.find((item) => item.id === payload.planId)
  const planName = plan?.name ?? payload.planId
  const planPrice = plan
    ? getPlanDisplayPrice(plan, payload.billing, payload.surfaceTierId) ?? "—"
    : "—"
  const planSurface = plan
    ? getPlanSurfaceSummary(plan, payload.surfaceTierId)
    : "—"
  const billingLabel = payload.billing === "annual" ? "Anual" : "Mensual"

  return {
    subject: `[BuildOn] Nueva solicitud de contratación — ${planName} · ${payload.company}`,
    emailTitle: "Nueva solicitud de contratación",
    heading: "Nueva solicitud de contratación",
    intro:
      "Alguien completó el formulario de contratación de un plan desde la landing.",
    rows: [
      ...baseRows,
      { label: "Plan", value: planName },
      { label: "Superficie", value: planSurface },
      { label: "Precio mostrado", value: planPrice },
      { label: "Facturación", value: billingLabel },
      {
        label: "País",
        value: getContractCountry(payload.country).label,
      },
      {
        label: "Provincia",
        value: getProvinceLabel(payload.country, payload.province),
      },
    ],
  }
}
