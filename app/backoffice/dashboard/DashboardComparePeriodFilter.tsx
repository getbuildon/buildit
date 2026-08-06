"use client"

import { useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"
import type { DateRange } from "react-day-picker"

import {
  DateRangePicker,
  periodFilterPillClassName,
} from "@/components/ui/date-range-picker"
import type { DashboardPeriodPreset } from "@/lib/backoffice/dashboardPeriod"
import { resolveDashboardPeriod } from "@/lib/backoffice/dashboardPeriod"
import {
  formatDashboardInputDate,
  serializeDashboardPeriodQuery,
  toDashboardCalendarDate,
} from "@/lib/backoffice/dashboardPeriodClient"
import { cn } from "@/lib/utils"

type DashboardComparePeriodFilterProps = {
  preset: DashboardPeriodPreset | null
  from?: string
  to?: string
  periodLabel?: string
  primaryPreset: DashboardPeriodPreset
  primaryFrom?: string
  primaryTo?: string
}

const PRESET_OPTIONS: { id: DashboardPeriodPreset; label: string }[] = [
  { id: "always", label: "Siempre" },
  { id: "this_month", label: "Este mes" },
  { id: "last_month", label: "Mes anterior" },
]

function getCustomRange(from?: string, to?: string): DateRange | undefined {
  const period = resolveDashboardPeriod({
    period: "custom",
    from,
    to,
  })

  if (period.preset !== "custom") return undefined

  return {
    from: toDashboardCalendarDate(period.start),
    to: toDashboardCalendarDate(period.end),
  }
}

export function DashboardComparePeriodFilter({
  preset,
  from,
  to,
  periodLabel,
  primaryPreset,
  primaryFrom,
  primaryTo,
}: DashboardComparePeriodFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const customRange = preset === "custom" ? getCustomRange(from, to) : undefined

  const navigate = (next: {
    comparePeriod: DashboardPeriodPreset | null
    compareFrom?: string
    compareTo?: string
  }) => {
    const query = serializeDashboardPeriodQuery({
      period: primaryPreset,
      from: primaryFrom,
      to: primaryTo,
      comparePeriod: next.comparePeriod,
      compareFrom: next.compareFrom,
      compareTo: next.compareTo,
    })

    startTransition(() => {
      router.push(`${pathname}${query}`)
    })
  }

  const applyCustomRange = (range: { from: Date; to: Date }) => {
    navigate({
      comparePeriod: "custom",
      compareFrom: formatDashboardInputDate(range.from),
      compareTo: formatDashboardInputDate(range.to),
    })
  }

  const clearCompare = () => {
    navigate({ comparePeriod: null })
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-[14px] border border-[#edeef0] bg-white px-4 py-4 shadow-[0_0_5px_rgba(243,103,31,0.08)] transition-opacity lg:flex-row lg:items-center lg:justify-between",
        isPending && "opacity-70",
      )}
    >
      <div className="min-w-0">
        <p className="text-xs font-medium leading-4 text-[#777b84]">
          Período de referencia
        </p>
        <p className="pt-1 text-sm leading-5 text-[#18191b]">
          {periodLabel ?? "Seleccioná un período para comparar"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {PRESET_OPTIONS.map((option) => {
          const selected = preset === option.id
          return (
            <button
              key={option.id}
              type="button"
              disabled={isPending}
              onClick={() => navigate({ comparePeriod: option.id })}
              className={periodFilterPillClassName(selected)}
            >
              {option.label}
            </button>
          )
        })}

        <DateRangePicker
          value={customRange}
          onApply={applyCustomRange}
          disabled={isPending}
          trigger={
            <button
              type="button"
              disabled={isPending}
              className={periodFilterPillClassName(preset === "custom")}
            >
              Personalizado
            </button>
          }
        />

        {preset ? (
          <button
            type="button"
            disabled={isPending}
            onClick={clearCompare}
            className={periodFilterPillClassName(false)}
          >
            Quitar
          </button>
        ) : null}
      </div>
    </div>
  )
}
