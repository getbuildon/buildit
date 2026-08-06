"use client"

import {
  CircleDollarSign,
  HandCoins,
  Receipt,
  Wallet,
} from "lucide-react"

import type { DashboardComparison } from "@/lib/backoffice/dashboardComparison"
import type { DashboardPeriodPreset } from "@/lib/backoffice/dashboardPeriod"
import type { BackofficeDashboardMetrics } from "@/lib/backoffice/dashboardMetrics"
import { DashboardPeriodFilter } from "@/app/backoffice/dashboard/DashboardPeriodFilter"
import { DashboardComparePeriodFilter } from "@/app/backoffice/dashboard/DashboardComparePeriodFilter"
import { DashboardCompareSection } from "@/app/backoffice/dashboard/DashboardCompareSection"
import {
  DashboardPendingProvider,
  useDashboardPending,
} from "@/app/backoffice/dashboard/DashboardPendingContext"
import {
  PeriodActivityBarChart,
  PlanGroupsBarChart,
  PlanTiersBarChart,
  SubscriptionStatusDonutChart,
} from "@/app/backoffice/dashboard/DashboardCharts"
import { Spinner } from "@/components/ui/spinner"
import { formatDashboardUsd } from "@/lib/backoffice/clientesBilling"
import { cn } from "@/lib/utils"

type DashboardViewProps = {
  metrics: BackofficeDashboardMetrics
  from?: string
  to?: string
  comparison: DashboardComparison | null
  comparePreset: DashboardPeriodPreset | null
  compareFrom?: string
  compareTo?: string
  comparePeriodLabel?: string
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string
  value: string
  hint?: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  tone?: "default" | "money" | "danger" | "success"
}) {
  const toneClasses = {
    default: "text-[#696e77]",
    money: "text-[#ff7433]",
    danger: "text-[#dc3e42]",
    success: "text-[#208368]",
  } satisfies Record<string, string>

  return (
    <div className="rounded-[14px] border border-[#edeef0] bg-white p-4 shadow-[0_0_5px_rgba(243,103,31,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium leading-4 text-[#777b84]">{label}</p>
          <p className="pt-2 font-recoleta text-[28px] leading-none text-[#272a2d]">
            {value}
          </p>
          {hint ? (
            <p className="pt-2 text-xs leading-4 text-[#777b84]">{hint}</p>
          ) : null}
        </div>
        <div
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl bg-[#f4f5f6]",
            toneClasses[tone],
          )}
        >
          <Icon className="size-4" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  )
}

export function DashboardView(props: DashboardViewProps) {
  return (
    <DashboardPendingProvider>
      <DashboardViewContent {...props} />
    </DashboardPendingProvider>
  )
}

function DashboardViewContent({
  metrics,
  from,
  to,
  comparison,
  comparePreset,
  compareFrom,
  compareTo,
  comparePeriodLabel,
}: DashboardViewProps) {
  const { isPending } = useDashboardPending()
  const { snapshot, activity, subscriptionStatus, period } = metrics

  return (
    <div className="min-w-0 px-6 py-10 lg:px-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-recoleta text-[28px] leading-[1.05] text-[#272a2d]">
            Dashboard
          </h1>
          <p className="pt-1 text-sm leading-5 text-[#777b84]">
            Métricas reales de usuarios, subscripciones e ingresos para administración.
          </p>
        </div>
      </div>

      <div className="pt-6">
        <DashboardPeriodFilter
          preset={period.preset}
          from={from}
          to={to}
          periodLabel={period.label}
          comparePreset={comparePreset}
          compareFrom={compareFrom}
          compareTo={compareTo}
        />
      </div>

      <div className="relative pt-6">
        {isPending ? (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center pt-28"
            aria-live="polite"
            aria-busy="true"
          >
            <Spinner className="size-8 text-[#ff7433]" />
          </div>
        ) : null}

        <div
          className={cn(
            "space-y-4 transition-opacity",
            isPending && "pointer-events-none opacity-70",
          )}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Cargos emitidos"
              value={formatDashboardUsd(snapshot.chargesUsd)}
              hint="Total facturado en el rango seleccionado"
              icon={CircleDollarSign}
              tone="money"
            />
            <MetricCard
              label="Cargos cobrados"
              value={formatDashboardUsd(snapshot.collectedUsd)}
              hint="Pagos registrados en el rango seleccionado"
              icon={HandCoins}
              tone="success"
            />
            <MetricCard
              label="Cargos por cobrar"
              value={formatDashboardUsd(snapshot.receivableUsd)}
              hint="Emitidos en el rango que aún no se cobraron"
              icon={Receipt}
              tone="danger"
            />
            <MetricCard
              label="Deuda"
              value={formatDashboardUsd(snapshot.debtUsd)}
              hint={`Cargos impagos con período vencido · ${snapshot.companiesWithDebt} ${snapshot.companiesWithDebt === 1 ? "cliente" : "clientes"}`}
              icon={Wallet}
              tone="danger"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SubscriptionStatusDonutChart subscriptionStatus={subscriptionStatus} />
            <PeriodActivityBarChart activity={activity} />
          </div>

          <div className="border-t border-[#edeef0] pt-8">
            <div className="pb-4">
              <h2 className="font-recoleta text-[22px] leading-[1.2] text-[#272a2d]">
                Planes por subscripción
              </h2>
              <p className="pt-1 text-sm leading-5 text-[#777b84]">
                Cantidades al cierre del período, por tipo de plan y tier de superficie.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <PlanGroupsBarChart planGroupBreakdown={metrics.planGroupBreakdown} />
              <PlanTiersBarChart planTierBreakdown={metrics.planTierBreakdown} />
            </div>
          </div>

          <div className="border-t border-[#edeef0] pt-8">
            <div className="pb-4">
              <h2 className="font-recoleta text-[22px] leading-[1.2] text-[#272a2d]">
                Comparativa
              </h2>
              <p className="pt-1 text-sm leading-5 text-[#777b84]">
                Variación del período principal respecto a otro rango de referencia.
              </p>
            </div>

            <DashboardComparePeriodFilter
              preset={comparePreset}
              from={compareFrom}
              to={compareTo}
              periodLabel={comparePeriodLabel}
              primaryPreset={period.preset}
              primaryFrom={from}
              primaryTo={to}
            />

            {comparison ? (
              <div className="pt-4">
                <DashboardCompareSection comparison={comparison} />
              </div>
            ) : (
              <div className="mt-4 rounded-[14px] border border-dashed border-[#edeef0] bg-[#f9f9fb] px-4 py-8 text-center">
                <p className="text-sm leading-5 text-[#777b84]">
                  Elegí un período de referencia para ver incrementos y decrementos
                  respecto a {period.label}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
