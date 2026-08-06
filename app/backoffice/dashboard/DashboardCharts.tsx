"use client"

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { getBackofficeStatusFilterLabel } from "@/lib/backoffice/proyectosFilters"
import type { BackofficeProjectStatusKind } from "@/lib/backoffice/proyectosQuery"
import type {
  BackofficeDashboardActivityMetrics,
  DashboardPlanGroupBreakdown,
  DashboardPlanTierBreakdown,
} from "@/lib/backoffice/dashboardMetrics"
import { cn } from "@/lib/utils"

const STATUS_ORDER: BackofficeProjectStatusKind[] = [
  "active",
  "inactive",
  "expired",
  "disabled",
]

const STATUS_COLORS: Record<BackofficeProjectStatusKind, string> = {
  active: "#208368",
  inactive: "#afb3ba",
  expired: "#c2410c",
  disabled: "#dc3e42",
}

const PLAN_GROUP_COLORS = ["#ff7433", "#363a3f", "#696e77"] as const

const ACTIVITY_COLORS = ["#ff7433", "#363a3f", "#696e77", "#208368"] as const

type ChartCardProps = {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

function ChartCard({ title, description, children, className }: ChartCardProps) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-[#edeef0] bg-white p-4 shadow-[0_0_5px_rgba(243,103,31,0.08)]",
        className,
      )}
    >
      <div className="border-b border-[#f4f5f6] pb-3">
        <h2 className="text-sm font-medium leading-5 text-[#18191b]">{title}</h2>
        {description ? (
          <p className="pt-1 text-xs leading-4 text-[#777b84]">{description}</p>
        ) : null}
      </div>
      <div className="pt-4">{children}</div>
    </div>
  )
}

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-xl bg-[#f9f9fb] px-4 text-center">
      <p className="text-sm leading-5 text-[#777b84]">{message}</p>
    </div>
  )
}

type ChartTooltipProps = {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string }>
  label?: string
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  const entry = payload[0]
  const value = entry.value ?? 0

  return (
    <div className="rounded-lg border border-[#edeef0] bg-white px-3 py-2 shadow-[0_4px_16px_rgba(24,25,27,0.08)]">
      <p className="text-xs font-medium leading-4 text-[#777b84]">
        {label ?? entry.name}
      </p>
      <p className="pt-0.5 text-sm font-semibold tabular-nums text-[#18191b]">
        {value}
      </p>
    </div>
  )
}

type SubscriptionStatusDonutProps = {
  subscriptionStatus: Record<BackofficeProjectStatusKind, number>
}

export function SubscriptionStatusDonutChart({
  subscriptionStatus,
}: SubscriptionStatusDonutProps) {
  const data = STATUS_ORDER.map((status) => ({
    status,
    name: getBackofficeStatusFilterLabel(status),
    value: subscriptionStatus[status],
    color: STATUS_COLORS[status],
  })).filter((item) => item.value > 0)

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <ChartCard
      title="Estado de subscripciones"
      description="Distribución al cierre del período"
    >
      {total === 0 ? (
        <ChartEmptyState message="No hay subscripciones en el período seleccionado." />
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="mx-auto h-[220px] w-full max-w-[260px] lg:mx-0 lg:shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((item) => (
                    <Cell key={item.status} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="flex min-w-0 flex-1 flex-col gap-2">
            {STATUS_ORDER.map((status) => {
              const value = subscriptionStatus[status]
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0

              return (
                <li
                  key={status}
                  className="flex items-center justify-between gap-3 rounded-lg bg-[#f9f9fb] px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[status] }}
                    />
                    <span className="truncate text-sm text-[#363a3f]">
                      {getBackofficeStatusFilterLabel(status)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-baseline gap-2 tabular-nums">
                    <span className="text-sm font-medium text-[#18191b]">{value}</span>
                    <span className="text-xs text-[#777b84]">{percentage}%</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </ChartCard>
  )
}

type PeriodActivityBarChartProps = {
  activity: BackofficeDashboardActivityMetrics
}

export function PeriodActivityBarChart({ activity }: PeriodActivityBarChartProps) {
  const data = [
    { name: "Usuarios", value: activity.newUsers },
    { name: "Empresas", value: activity.newCompanies },
    { name: "Proyectos", value: activity.newProjects },
    { name: "Subscrip.", value: activity.newSubscriptions },
  ]

  const hasActivity = data.some((item) => item.value > 0)

  return (
    <ChartCard
      title="Actividad del período"
      description="Altas registradas en el rango seleccionado"
    >
      {!hasActivity ? (
        <ChartEmptyState message="Sin altas en este período." />
      ) : (
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#777b84", fontSize: 12 }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#777b84", fontSize: 12 }}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(244,245,246,0.6)" }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={48}>
                {data.map((item, index) => (
                  <Cell key={item.name} fill={ACTIVITY_COLORS[index % ACTIVITY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  )
}

type PlanGroupsBarChartProps = {
  planGroupBreakdown: DashboardPlanGroupBreakdown[]
}

export function PlanGroupsBarChart({ planGroupBreakdown }: PlanGroupsBarChartProps) {
  const data = planGroupBreakdown.map((group, index) => ({
    name: group.label,
    value: group.count,
    color: PLAN_GROUP_COLORS[index % PLAN_GROUP_COLORS.length],
  }))

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <ChartCard
      title="Distribución por tipo de plan"
      description="Subscripciones activas al cierre, por categoría"
    >
      {total === 0 ? (
        <ChartEmptyState message="No hay subscripciones con plan asignado." />
      ) : (
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 0, right: 12, left: 4, bottom: 0 }}
            >
              <XAxis
                type="number"
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#777b84", fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={88}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#363a3f", fontSize: 12 }}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(244,245,246,0.6)" }} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} maxBarSize={28}>
                {data.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  )
}

function TierAxisTick(props: {
  x?: string | number
  y?: string | number
  payload?: { value?: string }
}) {
  const x = typeof props.x === "number" ? props.x : Number(props.x ?? 0)
  const y = typeof props.y === "number" ? props.y : Number(props.y ?? 0)

  return (
    <text x={x} y={y} dy={4} textAnchor="end" fill="#363a3f" fontSize={12}>
      {props.payload?.value}
    </text>
  )
}

type PlanTiersBarChartProps = {
  planTierBreakdown: DashboardPlanTierBreakdown[]
}

export function PlanTiersBarChart({ planTierBreakdown }: PlanTiersBarChartProps) {
  const groupColorById = new Map<string, string>()
  let groupColorIndex = 0

  for (const tier of planTierBreakdown) {
    if (!groupColorById.has(tier.groupId)) {
      groupColorById.set(
        tier.groupId,
        PLAN_GROUP_COLORS[groupColorIndex % PLAN_GROUP_COLORS.length],
      )
      groupColorIndex += 1
    }
  }

  const data = planTierBreakdown.map((tier) => ({
    name: tier.tierLabel.replace(" m²", "\u00A0m²"),
    groupLabel: tier.groupLabel,
    value: tier.count,
    color: groupColorById.get(tier.groupId) ?? PLAN_GROUP_COLORS[0],
  }))

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const chartHeight = Math.max(220, data.length * 36)

  return (
    <ChartCard
      title="Distribución por tier"
      description="Subscripciones al cierre, por superficie"
    >
      {total === 0 ? (
        <ChartEmptyState message="No hay subscripciones con plan asignado." />
      ) : (
        <div className="w-full" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 0, right: 12, left: 4, bottom: 0 }}
            >
              <XAxis
                type="number"
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#777b84", fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={84}
                axisLine={false}
                tickLine={false}
                tick={TierAxisTick}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const entry = payload[0]?.payload as (typeof data)[number] | undefined
                  if (!entry) return null

                  return (
                    <div className="rounded-lg border border-[#edeef0] bg-white px-3 py-2 shadow-[0_4px_16px_rgba(24,25,27,0.08)]">
                      <p className="text-xs font-medium leading-4 text-[#777b84]">
                        {entry.groupLabel} · {entry.name}
                      </p>
                      <p className="pt-0.5 text-sm font-semibold tabular-nums text-[#18191b]">
                        {entry.value}
                      </p>
                    </div>
                  )
                }}
                cursor={{ fill: "rgba(244,245,246,0.6)" }}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} maxBarSize={24}>
                {data.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  )
}
