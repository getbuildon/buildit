"use client"

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import type { DashboardComparison, MetricDelta } from "@/lib/backoffice/dashboardComparison"
import {
  formatMetricDelta,
  formatMetricValue,
  getDeltaTone,
} from "@/lib/backoffice/dashboardComparison"
import { cn } from "@/lib/utils"

type DashboardCompareSectionProps = {
  comparison: DashboardComparison
}

const TONE_CLASSES = {
  positive: "text-[#208368] bg-[#e6f4ef]",
  negative: "text-[#dc3e42] bg-[#fdebec]",
  neutral: "text-[#696e77] bg-[#f4f5f6]",
} as const

function DeltaBadge({ delta }: { delta: MetricDelta }) {
  const tone = getDeltaTone(delta)
  const Icon =
    delta.delta === 0 ? Minus : delta.delta > 0 ? ArrowUpRight : ArrowDownRight

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
        TONE_CLASSES[tone],
      )}
    >
      <Icon className="size-3" strokeWidth={2} aria-hidden />
      {formatMetricDelta(delta)}
      {delta.deltaPercent !== null && delta.compare !== 0 ? (
        <span className="font-medium opacity-80">({delta.deltaPercent > 0 ? "+" : ""}{delta.deltaPercent}%)</span>
      ) : null}
    </span>
  )
}

function CompareGroup({
  title,
  description,
  items,
}: {
  title: string
  description?: string
  items: MetricDelta[]
}) {
  return (
    <div className="rounded-[14px] border border-[#edeef0] bg-white shadow-[0_0_5px_rgba(243,103,31,0.08)]">
      <div className="border-b border-[#f4f5f6] px-4 py-3">
        <h3 className="text-sm font-medium leading-5 text-[#18191b]">{title}</h3>
        {description ? (
          <p className="pt-1 text-xs leading-4 text-[#777b84]">{description}</p>
        ) : null}
      </div>

      <div className="divide-y divide-[#f4f5f6]">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm leading-5 text-[#363a3f]">{item.label}</p>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-1">
                <p className="text-sm font-medium tabular-nums text-[#18191b]">
                  {formatMetricValue(item.primary, item.format)}
                </p>
                <p className="text-xs tabular-nums text-[#777b84]">
                  vs {formatMetricValue(item.compare, item.format)}
                </p>
              </div>
            </div>
            <DeltaBadge delta={item} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardCompareSection({ comparison }: DashboardCompareSectionProps) {
  return (
    <div className="space-y-4">
      <CompareGroup
        title="Snapshot al cierre"
        description={`Valores al cierre de ${comparison.primaryLabel} comparados con ${comparison.compareLabel}`}
        items={comparison.snapshot}
      />
      <CompareGroup
        title="Actividad en el período"
        description="Altas y bajas registradas en cada rango"
        items={comparison.activity}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <CompareGroup
          title="Estado de subscripciones"
          items={comparison.subscriptionStatus}
        />
        <CompareGroup title="Planes por tipo" items={comparison.planGroups} />
      </div>
    </div>
  )
}
