import type { BackofficeProjectStatusKind } from "@/lib/backoffice/proyectosQuery"

export type ProjectSubscriptionSnapshot = {
  status: string
}

export type ResolveBackofficeProjectSubscriptionStatusOptions = {
  /** Cargos impagos con período vencido (ledger). */
  overdueDebtUsd?: number
}

export function isBackofficeSubscriptionExpired(
  subscription: ProjectSubscriptionSnapshot,
  overdueDebtUsd = 0,
): boolean {
  if (subscription.status === "past_due") return true
  if (subscription.status === "cancelled") return false

  return overdueDebtUsd > 0
}

export function resolveBackofficeProjectSubscriptionStatus(
  projectStatus: string,
  subscription: ProjectSubscriptionSnapshot | null,
  options: ResolveBackofficeProjectSubscriptionStatusOptions = {},
): BackofficeProjectStatusKind {
  const overdueDebtUsd = options.overdueDebtUsd ?? 0

  if (!subscription) return "inactive"

  if (subscription.status === "cancelled") return "disabled"

  if (isBackofficeSubscriptionExpired(subscription, overdueDebtUsd)) {
    return "expired"
  }

  if (projectStatus !== "active") return "inactive"

  if (subscription.status === "active") return "active"

  return "inactive"
}
