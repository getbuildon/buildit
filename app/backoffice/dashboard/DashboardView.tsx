"use client"

import {
  Building2,
  CircleDollarSign,
  FolderKanban,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"

import type { BackofficeDashboardMetrics } from "@/lib/backoffice/dashboardMetrics"
import { DashboardPeriodFilter } from "@/app/backoffice/dashboard/DashboardPeriodFilter"
import { formatDashboardUsd } from "@/lib/backoffice/clientesBilling"
import {
  BACKOFFICE_PLAN_FILTER_GROUPS,
  getBackofficeStatusFilterLabel,
} from "@/lib/backoffice/proyectosFilters"
import type { BackofficeProjectStatusKind } from "@/lib/backoffice/proyectosQuery"
import { cn } from "@/lib/utils"

type DashboardViewProps = {
  metrics: BackofficeDashboardMetrics
  from?: string
  to?: string
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

function BreakdownCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[14px] border border-[#edeef0] bg-white p-4 shadow-[0_0_5px_rgba(243,103,31,0.08)]">
      <div className="border-b border-[#f4f5f6] pb-3">
        <h2 className="text-sm font-medium leading-5 text-[#18191b]">{title}</h2>
        {description ? (
          <p className="pt-1 text-xs leading-4 text-[#777b84]">{description}</p>
        ) : null}
      </div>
      <div className="pt-3">{children}</div>
    </div>
  )
}

function BreakdownRow({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <p className="text-sm leading-5 text-[#363a3f]">{label}</p>
      <p className={cn("text-sm font-medium leading-5 tabular-nums text-[#18191b]", valueClassName)}>
        {value}
      </p>
    </div>
  )
}

const STATUS_ORDER: BackofficeProjectStatusKind[] = [
  "active",
  "inactive",
  "expired",
  "disabled",
]

export function DashboardView({ metrics, from, to }: DashboardViewProps) {
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
        />
      </div>

      <div className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="MRR al cierre del período"
          value={formatDashboardUsd(snapshot.mrrUsd)}
          hint="Ingreso mensual recurrente de subscripciones activas"
          icon={CircleDollarSign}
          tone="money"
        />
        <MetricCard
          label="Deuda estimada"
          value={formatDashboardUsd(snapshot.debtUsd)}
          hint={`${snapshot.companiesWithDebt} ${snapshot.companiesWithDebt === 1 ? "cliente con deuda" : "clientes con deuda"}`}
          icon={Wallet}
          tone="danger"
        />
        <MetricCard
          label="Subscripciones activas"
          value={String(snapshot.activeSubscriptions)}
          hint={`${snapshot.payingCompanies} empresas pagando`}
          icon={TrendingUp}
          tone="success"
        />
        <MetricCard
          label="Usuarios confirmados"
          value={String(snapshot.confirmedUsers)}
          hint={`${snapshot.totalUsers} usuarios registrados al cierre`}
          icon={Users}
        />
      </div>

      <div className="grid gap-4 pt-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Nuevos usuarios"
          value={String(activity.newUsers)}
          hint={`${activity.newConfirmedUsers} confirmados en el período`}
          icon={Users}
        />
        <MetricCard
          label="Nuevas empresas"
          value={String(activity.newCompanies)}
          hint={`${snapshot.totalCompanies} empresas al cierre`}
          icon={Building2}
        />
        <MetricCard
          label="Nuevos proyectos"
          value={String(activity.newProjects)}
          hint={`${snapshot.totalProjects} proyectos al cierre`}
          icon={FolderKanban}
        />
        <MetricCard
          label="Nuevas subscripciones"
          value={String(activity.newSubscriptions)}
          hint={`${activity.cancelledSubscriptions} canceladas en el período`}
          icon={TrendingUp}
        />
      </div>

      <div className="pt-4 lg:max-w-xl">
        <BreakdownCard
          title="Estado de subscripciones"
          description="Snapshot al cierre del período seleccionado"
        >
          {STATUS_ORDER.map((status) => (
            <BreakdownRow
              key={status}
              label={getBackofficeStatusFilterLabel(status)}
              value={String(subscriptionStatus[status])}
              valueClassName={
                status === "expired"
                  ? "text-[#c2410c]"
                  : status === "disabled"
                    ? "text-[#dc3e42]"
                    : status === "active"
                      ? "text-[#208368]"
                      : undefined
              }
            />
          ))}
        </BreakdownCard>
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

        <div className="grid gap-4 md:grid-cols-3">
          {metrics.planGroupBreakdown.map((group) => (
            <div
              key={group.id}
              className="rounded-[14px] border border-[#edeef0] bg-white p-4 shadow-[0_0_5px_rgba(243,103,31,0.08)]"
            >
              <p className="text-xs font-medium leading-4 text-[#777b84]">
                {group.label}
              </p>
              <p className="pt-2 font-recoleta text-[32px] leading-none text-[#272a2d]">
                {group.count}
              </p>
              <p className="pt-2 text-xs leading-4 text-[#777b84]">
                {group.count === 1 ? "subscripción" : "subscripciones"}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 pt-4 lg:grid-cols-3">
          {BACKOFFICE_PLAN_FILTER_GROUPS.map((group) => {
            const tiers = metrics.planTierBreakdown.filter(
              (tier) => tier.groupId === group.id,
            )

            return (
              <BreakdownCard
                key={group.id}
                title={group.label}
                description="Tiers de superficie"
              >
                {tiers.map((tier) => (
                  <BreakdownRow
                    key={tier.slug}
                    label={tier.tierLabel}
                    value={String(tier.count)}
                    valueClassName={tier.count > 0 ? undefined : "text-[#afb3ba]"}
                  />
                ))}
              </BreakdownCard>
            )
          })}
        </div>
      </div>
    </div>
  )
}
