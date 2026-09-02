"use client"

import { useState } from "react"
import Link from "next/link"
import {
  TrendingUp,
  CheckCircle2,
  ClipboardCheck,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { getUnitDisplayCode } from "@/lib/projects/floorLabels"
import {
  getDashboardProgressBarColor,
  getUnitBlockProgressBarColor,
  DASHBOARD_PROGRESS_TRACK_COLOR,
} from "@/lib/projects/dashboardProgressBarColors"
import {
  formatProgressPercentLabel,
  progressBarWidthPercent,
} from "@/lib/projects/dashboardProgress"
import { getUnitTypeIcon } from "@/lib/projects/unitTypeIcons"
import { getUnitDashboardLabel } from "@/lib/projects/unitTypes"
import { DASHBOARD_SHADOW, DASHBOARD_TYPE } from "@/lib/project/dashboardDesignTokens"
import { projectHref } from "@/lib/project/routes"
import { cn } from "@/lib/utils"
import type { DashboardFloor, DashboardStats } from "../configuracion/actions"

function DashboardProgressBar({
  progress,
  className,
  variant = "default",
}: {
  progress: number
  className?: string
  variant?: "default" | "unit"
}) {
  const fillColor =
    variant === "unit"
      ? getUnitBlockProgressBarColor(progress)
      : getDashboardProgressBarColor(progress)

  return (
    <div
      className={cn("overflow-hidden rounded-full", className)}
      style={{ backgroundColor: DASHBOARD_PROGRESS_TRACK_COLOR }}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${progressBarWidthPercent(progress)}%`,
          backgroundColor: fillColor,
        }}
      />
    </div>
  )
}

function StatCard({
  iconBg,
  icon: Icon,
  iconColor,
  value,
  label,
  sublabel,
}: {
  iconBg: string
  icon: React.ElementType
  iconColor: string
  value: string
  label: string
  sublabel: string
}) {
  return (
    <div
      className="flex min-w-0 flex-col gap-4 rounded-[14px] border border-[#edeef0] bg-white px-3 py-3 sm:gap-6 sm:px-4 sm:py-[17px] md:flex-1"
      style={{ boxShadow: DASHBOARD_SHADOW }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex size-[31px] shrink-0 items-center justify-center rounded-[10px]"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className={cn("size-4", iconColor)} aria-hidden />
        </div>
        <p className={cn(DASHBOARD_TYPE.statValue, "text-[22px] sm:text-[28px]")}>{value}</p>
      </div>
      <div className="flex flex-col gap-0.5">
        <p className={DASHBOARD_TYPE.statLabel}>{label}</p>
        <p className={DASHBOARD_TYPE.statSublabel}>{sublabel}</p>
      </div>
    </div>
  )
}

function UnitCard({
  projectId,
  unit,
  unitIndex,
}: {
  projectId: string
  unit: DashboardFloor["units"][number]
  unitIndex: number
}) {
  const Icon = getUnitTypeIcon(unit.unit_type)
  const displayTypeLabel = getUnitDashboardLabel({
    unit_type: unit.unit_type,
    name: unit.name,
    room_count: unit.room_count,
  })

  return (
    <Link
      href={projectHref(projectId, `unidades/${unit.id}`)}
      className="flex w-[200px] shrink-0 flex-col gap-2 rounded-[8px] border border-[#edeef0] bg-[#fbfdff] px-[9px] py-[13px] transition-colors hover:border-[#ff7433]/40 hover:bg-white"
    >
      <div className="flex flex-col gap-[2px]">
        <div className="flex items-center justify-between">
          <span className={DASHBOARD_TYPE.unitCode}>
            {getUnitDisplayCode(unit, unitIndex)}
          </span>
          <span className={DASHBOARD_TYPE.unitProgress}>
            {formatProgressPercentLabel(unit.progress)}
          </span>
        </div>
        <DashboardProgressBar progress={unit.progress} className="h-[6px] w-full" variant="unit" />
      </div>
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex min-w-0 items-center gap-1">
          <Icon className="size-3 shrink-0 text-[#272a2d]" aria-hidden />
          <span className={DASHBOARD_TYPE.unitType}>{displayTypeLabel}</span>
        </div>
        {unit.hasBlockedTasks ? (
          <AlertTriangle
            className="size-3 shrink-0 text-[#CE2C31]"
            aria-label="Tiene tareas bloqueadas"
          />
        ) : null}
      </div>
    </Link>
  )
}

function FloorCard({
  projectId,
  floor,
  defaultOpen = false,
}: {
  projectId: string
  floor: DashboardFloor
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const blockedUnitsCount = floor.units.filter((unit) => unit.hasBlockedTasks).length

  return (
    <div
      className="overflow-hidden rounded-[14px] border border-[#edeef0] bg-white"
      style={{ boxShadow: DASHBOARD_SHADOW }}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full flex-col gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f9f9fb] sm:flex-row sm:items-center sm:gap-3 sm:py-[11.5px]"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex shrink-0 items-center gap-1">
            {open ? (
              <ChevronDown className="size-4 text-[#696e77]" aria-hidden />
            ) : (
              <ChevronRight className="size-4 text-[#696e77]" aria-hidden />
            )}
            <span className={cn(DASHBOARD_TYPE.floorName, "w-auto")}>{floor.name}</span>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <DashboardProgressBar progress={floor.progress} className="h-2 min-w-0 flex-1" />
            <span className={DASHBOARD_TYPE.floorProgress}>
              {formatProgressPercentLabel(floor.progress)}
            </span>
          </div>
        </div>

        <div className={cn("flex shrink-0 items-center gap-2 sm:justify-end", DASHBOARD_TYPE.floorMeta)}>
          <span>
            {floor.units.length} {floor.units.length === 1 ? "unidad" : "unidades"}
          </span>
          {blockedUnitsCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-[#CE2C31]">
              <AlertTriangle className="size-3 shrink-0" aria-hidden />
              <span className="text-[12px] font-medium leading-4 tracking-[-0.36px]">
                {blockedUnitsCount}
              </span>
            </span>
          ) : null}
        </div>
      </button>

      {open ? (
        <div className="border-t border-[#edeef0] px-4 py-3">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {floor.units.map((unit, index) => (
              <UnitCard
                key={unit.id}
                projectId={projectId}
                unit={unit}
                unitIndex={index + 1}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function certifiedThisWeekLabel(count: number): string {
  if (count === 1) return "1 esta semana"
  return `${count} esta semana`
}

export function DashboardMainView({
  project,
  dashboard,
}: {
  project: { id: string; name: string }
  dashboard: { floors: DashboardFloor[]; stats: DashboardStats }
}) {
  const { floors, stats } = dashboard

  return (
    <div className="flex flex-col gap-6 py-4 sm:gap-8 sm:py-6">
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-2">
          <h1
            className={cn(
              DASHBOARD_TYPE.pageTitle,
              "text-[26px] leading-[1.08] sm:text-[30px] lg:text-[36px] lg:leading-[1.05]",
            )}
          >
            {project.name}
          </h1>
          <p className={cn(DASHBOARD_TYPE.pageSubtitle, "text-[13px] sm:text-[14px]")}>
            {stats.totalFloors} Niveles · {stats.totalUnits} Unidades · Progreso General:{" "}
            {formatProgressPercentLabel(stats.generalProgress)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            iconBg="#eff6ff"
            icon={TrendingUp}
            iconColor="text-[#0d74ce]"
            value={formatProgressPercentLabel(stats.generalProgress)}
            label="Progreso General"
            sublabel="promedio de todas las unidades"
          />
          <StatCard
            iconBg="#e6f7ed"
            icon={CheckCircle2}
            iconColor="text-[#29a383]"
            value={`${stats.completedUnits}/${stats.totalUnits}`}
            label="Completo"
            sublabel="unidades terminadas"
          />
          <StatCard
            iconBg="#fefbe9"
            icon={ClipboardCheck}
            iconColor="text-[#ab6400]"
            value={String(stats.certifiedTasks)}
            label="Tareas certificadas"
            sublabel={certifiedThisWeekLabel(stats.certifiedTasksThisWeek)}
          />
          <StatCard
            iconBg="#feebec"
            icon={AlertTriangle}
            iconColor="text-[#ce2c31]"
            value={stats.blockedTasks == null ? "—" : String(stats.blockedTasks)}
            label="Problemas"
            sublabel="tareas bloqueadas"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {floors.map((floor, index) => (
          <FloorCard
            key={floor.id}
            projectId={project.id}
            floor={floor}
            defaultOpen={index < 2}
          />
        ))}
      </div>
    </div>
  )
}
