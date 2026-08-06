import {
  getBackofficeDashboardMetrics,
} from "@/app/backoffice/dashboard/actions"
import { DashboardView } from "@/app/backoffice/dashboard/DashboardView"
import { resolveDashboardPeriod } from "@/lib/backoffice/dashboardPeriod"
import type { BackofficeDashboardMetrics } from "@/lib/backoffice/dashboardMetrics"

type BackofficeDashboardPageProps = {
  searchParams: Promise<{
    period?: string
    from?: string
    to?: string
  }>
}

export default async function BackofficeDashboardPage({
  searchParams,
}: BackofficeDashboardPageProps) {
  const params = await searchParams
  const period = resolveDashboardPeriod({
    period: params.period,
    from: params.from,
    to: params.to,
  })

  const metrics: BackofficeDashboardMetrics = await getBackofficeDashboardMetrics({
    period: params.period,
    from: params.from,
    to: params.to,
  })

  const from =
    period.preset === "custom"
      ? params.from
      : undefined
  const to =
    period.preset === "custom"
      ? params.to
      : undefined

  return <DashboardView metrics={metrics} from={from} to={to} />
}
