import {
  getBackofficeDashboardMetrics,
} from "@/app/backoffice/dashboard/actions"
import { DashboardView } from "@/app/backoffice/dashboard/DashboardView"
import { resolveDashboardPeriod } from "@/lib/backoffice/dashboardPeriod"
import type { DashboardPeriodPreset } from "@/lib/backoffice/dashboardPeriod"
import { buildDashboardComparison } from "@/lib/backoffice/dashboardComparison"

type BackofficeDashboardPageProps = {
  searchParams: Promise<{
    period?: string
    from?: string
    to?: string
    comparePeriod?: string
    compareFrom?: string
    compareTo?: string
  }>
}

function isComparePeriodPreset(
  value: string | undefined,
): value is DashboardPeriodPreset {
  return (
    value === "always" ||
    value === "this_month" ||
    value === "last_month" ||
    value === "custom"
  )
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

  const comparePreset = isComparePeriodPreset(params.comparePeriod)
    ? params.comparePeriod
    : null

  const comparePeriod = comparePreset
    ? resolveDashboardPeriod({
        period: comparePreset,
        from: params.compareFrom,
        to: params.compareTo,
      })
    : null

  const [metrics, compareMetrics] = await Promise.all([
    getBackofficeDashboardMetrics({
      period: params.period,
      from: params.from,
      to: params.to,
    }),
    comparePreset
      ? getBackofficeDashboardMetrics({
          period: comparePreset,
          from: params.compareFrom,
          to: params.compareTo,
        })
      : Promise.resolve(null),
  ])

  const comparison =
    compareMetrics !== null
      ? buildDashboardComparison(metrics, compareMetrics)
      : null

  const from =
    period.preset === "custom"
      ? params.from
      : undefined
  const to =
    period.preset === "custom"
      ? params.to
      : undefined

  const compareFrom =
    comparePeriod?.preset === "custom"
      ? params.compareFrom
      : undefined
  const compareTo =
    comparePeriod?.preset === "custom"
      ? params.compareTo
      : undefined

  return (
    <DashboardView
      metrics={metrics}
      from={from}
      to={to}
      comparison={comparison}
      comparePreset={comparePreset}
      compareFrom={compareFrom}
      compareTo={compareTo}
      comparePeriodLabel={comparePeriod?.label}
    />
  )
}
