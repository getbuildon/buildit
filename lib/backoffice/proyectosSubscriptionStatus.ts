import type { BackofficeProjectStatusKind } from "@/lib/backoffice/proyectosQuery"

export type ProjectSubscriptionSnapshot = {
  status: string
  renewsAt: string | null
}

export function isBackofficeSubscriptionExpired(
  subscription: ProjectSubscriptionSnapshot,
  now = new Date(),
): boolean {
  if (subscription.status === "past_due") return true
  if (subscription.status === "cancelled") return false

  if (!subscription.renewsAt) return false

  return new Date(subscription.renewsAt) < now
}

export function resolveBackofficeProjectSubscriptionStatus(
  projectStatus: string,
  subscription: ProjectSubscriptionSnapshot | null,
  now = new Date(),
): BackofficeProjectStatusKind {
  if (!subscription) return "inactive"

  if (subscription.status === "cancelled") return "disabled"

  if (isBackofficeSubscriptionExpired(subscription, now)) return "expired"

  if (projectStatus !== "active") return "inactive"

  if (subscription.status === "active") return "active"

  return "inactive"
}
