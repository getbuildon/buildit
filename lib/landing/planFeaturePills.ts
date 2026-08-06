import type { PricingPlan } from "@/lib/landing/pricingPlans"

export type PlanFeaturePillIcon = "users" | "user-check" | "briefcase" | "star"

export const PLAN_FEATURE_PILL_ICONS: Record<PlanFeaturePillIcon, string> = {
  users: "/landing/contract/pill-users.svg",
  "user-check": "/landing/contract/pill-user-check.svg",
  briefcase: "/landing/contract/pill-briefcase.svg",
  star: "/landing/contract/pill-star.svg",
}

export type PlanFeaturePill = {
  icon: PlanFeaturePillIcon
  label: string
}

function formatTeamPillLabel(feature: string): string {
  return feature
    .replace(/\s*administradores?/i, " admins")
    .replace(/\s*supervisores?/i, " supervisors")
    .replace(/\s*operadores?/i, " operators")
    .trim()
}

function formatClientPillLabel(feature: string): string {
  return feature
    .replace(/^Hasta\s+/i, "")
    .replace(/\s*clientes?/i, " clients")
    .trim()
}

export function getPlanFeaturePills(plan: PricingPlan): PlanFeaturePill[] {
  const teamIcons: PlanFeaturePillIcon[] = ["users", "user-check", "briefcase"]
  const pills: PlanFeaturePill[] = plan.teamFeatures.map((feature, index) => ({
    icon: teamIcons[index] ?? "users",
    label: formatTeamPillLabel(feature),
  }))

  const clientFeature = plan.otherFeatures.find((feature) =>
    feature.toLowerCase().includes("cliente"),
  )
  if (clientFeature) {
    pills.push({
      icon: "users",
      label: formatClientPillLabel(clientFeature),
    })
  }

  const supportFeature = plan.otherFeatures.find((feature) =>
    feature.toLowerCase().includes("soporte"),
  )
  if (supportFeature) {
    pills.push({
      icon: "star",
      label: supportFeature,
    })
  }

  return pills
}

export function getPlanSurfaceSummary(
  plan: PricingPlan,
  surfaceTierId?: string,
): string {
  const tier =
    plan.surfaceTiers?.find((item) => item.id === surfaceTierId) ??
    plan.surfaceTiers?.find((item) => item.id === plan.defaultSurfaceTierId) ??
    plan.surfaceTiers?.[0]

  if (tier) {
    return tier.label.replace(
      /^Superficie hasta/i,
      "Superficie de obra hasta",
    )
  }

  return plan.surface ?? plan.subtitle
}
