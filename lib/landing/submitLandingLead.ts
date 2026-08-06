import type { ContractCountryCode } from "@/lib/landing/contractLocations"
import type { PhoneDialCode } from "@/lib/landing/phoneInput"
import type { BillingPeriod } from "@/lib/landing/pricingPlans"

export type LandingLeadKind = "contact" | "contract"

export type LandingLeadBasePayload = {
  firstName: string
  lastName: string
  company: string
  email: string
  phone?: string
  phoneDialCode: PhoneDialCode
}

export type LandingContactLeadPayload = LandingLeadBasePayload & {
  kind: "contact"
  comments?: string
}

export type LandingContractLeadPayload = LandingLeadBasePayload & {
  kind: "contract"
  country: ContractCountryCode
  province: string
  planId: string
  billing: BillingPeriod
  surfaceTierId?: string
}

export type LandingLeadPayload =
  | LandingContactLeadPayload
  | LandingContractLeadPayload

export type SubmitLandingLeadResult =
  | { ok: true }
  | { ok: false; error: string }

export async function submitLandingLead(
  payload: LandingLeadPayload,
): Promise<SubmitLandingLeadResult> {
  const response = await fetch("/api/landing/leads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const data = (await response.json().catch(() => null)) as
    | { ok?: boolean; error?: string }
    | null

  if (!response.ok || !data?.ok) {
    return {
      ok: false,
      error: data?.error ?? "No se pudo enviar la solicitud. Intentá de nuevo.",
    }
  }

  return { ok: true }
}
