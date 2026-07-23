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
import { getUnitTypeIcon } from "@/lib/projects/unitTypeIcons"
import { getUnitDashboardLabel } from "@/lib/projects/unitTypes"
import { DASHBOARD_SHADOW, DASHBOARD_TYPE } from "@/lib/project/dashboardDesignTokens"
import { cn } from "@/lib/utils"
import type { ProjectBasics, DashboardFloor, DashboardStats } from "../configuracion/actions"

const mockFloors: DashboardFloor[] = [
  {
    id: "mock-1",
    name: "Planta baja",
    identifier: "PB",
    progress: 100,
    units: [
      {
        id: "u1",
        code: "101",
        name: null,
        unit_type: "Estacionamiento",
        room_count: null,
        progress: 70,
        hasBlockedTasks: false,
      },
    ],
  },
  {
    id: "mock-2",
    name: "Piso 2",
    identifier: null,
    progress: 87,
    units: [
      { id: "u2", code: "201", name: "XL", unit_type: "Oficina", room_count: null, progress: 70, hasBlockedTasks: false },
      { id: "u3", code: "202", name: null, unit_type: "SUM", room_count: null, progress: 45, hasBlockedTasks: false },
      { id: "u4", code: "203", name: null, unit_type: "Patio", room_count: null, progress: 90, hasBlockedTasks: false },
    ],
  },
  {
    id: "mock-3",
    name: "Piso 3",
    identifier: null,
    progress: 76,
    units: [
      { id: "u5", code: "301", name: "L", unit_type: "Oficina", room_count: null, progress: 80, hasBlockedTasks: false },
      { id: "u6", code: "302", name: null, unit_type: "Departamento", room_count: 3, progress: 65, hasBlockedTasks: true },
      { id: "u7", code: "303", name: null, unit_type: "Departamento", room_count: 2, progress: 90, hasBlockedTasks: false },
      { id: "u8", code: "304", name: null, unit_type: "Departamento", room_count: 4, progress: 50, hasBlockedTasks: true },
      { id: "u9", code: "305", name: null, unit_type: "Departamento", room_count: 1, progress: 55, hasBlockedTasks: false },
    ],
  },
  { id: "mock-4", name: "Piso 4", identifier: null, progress: 50, units: [
    { id: "u10", code: "401", name: null, unit_type: "Departamento", room_count: 2, progress: 60, hasBlockedTasks: false },
    { id: "u11", code: "402", name: null, unit_type: "Departamento", room_count: 3, progress: 40, hasBlockedTasks: false },
    { id: "u12", code: "403", name: "M", unit_type: "Oficina", room_count: null, progress: 45, hasBlockedTasks: true },
    { id: "u13", code: "404", name: null, unit_type: "Departamento", room_count: 4, progress: 50, hasBlockedTasks: false },
    { id: "u14", code: "405", name: null, unit_type: "Departamento", room_count: 1, progress: 45, hasBlockedTasks: false },
    { id: "u15", code: "406", name: null, unit_type: "Departamento", room_count: 3, progress: 50, hasBlockedTasks: true },
  ]},
  { id: "mock-5", name: "Piso 5", identifier: null, progress: 30, units: [
    { id: "u16", code: "501", name: null, unit_type: "Departamento", room_count: 2, progress: 35, hasBlockedTasks: false },
    { id: "u17", code: "502", name: null, unit_type: "Departamento", room_count: 3, progress: 25, hasBlockedTasks: false },
    { id: "u18", code: "503", name: null, unit_type: "Departamento", room_count: 2, progress: 30, hasBlockedTasks: false },
    { id: "u19", code: "504", name: null, unit_type: "Departamento", room_count: 4, progress: 30, hasBlockedTasks: false },
    { id: "u20", code: "505", name: null, unit_type: "Departamento", room_count: 1, progress: 30, hasBlockedTasks: false },
  ]},
  { id: "mock-6", name: "Piso 6", identifier: null, progress: 30, units: [
    { id: "u21", code: "601", name: null, unit_type: "Departamento", room_count: 2, progress: 30, hasBlockedTasks: false },
    { id: "u22", code: "602", name: null, unit_type: "Departamento", room_count: 3, progress: 30, hasBlockedTasks: false },
    { id: "u23", code: "603", name: null, unit_type: "Departamento", room_count: 2, progress: 30, hasBlockedTasks: false },
    { id: "u24", code: "604", name: null, unit_type: "Departamento", room_count: 4, progress: 30, hasBlockedTasks: false },
    { id: "u25", code: "605", name: null, unit_type: "Departamento", room_count: 1, progress: 30, hasBlockedTasks: false },
  ]},
  { id: "mock-7", name: "Piso 7", identifier: null, progress: 10, units: [
    { id: "u26", code: "701", name: null, unit_type: "Departamento", room_count: 2, progress: 10, hasBlockedTasks: false },
    { id: "u27", code: "702", name: null, unit_type: "Departamento", room_count: 3, progress: 10, hasBlockedTasks: false },
    { id: "u28", code: "703", name: null, unit_type: "Departamento", room_count: 2, progress: 10, hasBlockedTasks: false },
    { id: "u29", code: "704", name: null, unit_type: "Departamento", room_count: 4, progress: 10, hasBlockedTasks: false },
  ]},
  { id: "mock-8", name: "Piso 8", identifier: null, progress: 10, units: [
    { id: "u30", code: "801", name: null, unit_type: "Departamento", room_count: 2, progress: 10, hasBlockedTasks: false },
    { id: "u31", code: "802", name: null, unit_type: "Departamento", room_count: 3, progress: 10, hasBlockedTasks: false },
    { id: "u32", code: "803", name: null, unit_type: "Departamento", room_count: 2, progress: 10, hasBlockedTasks: false },
    { id: "u33", code: "804", name: null, unit_type: "Departamento", room_count: 4, progress: 10, hasBlockedTasks: false },
  ]},
  { id: "mock-9", name: "Piso 9", identifier: null, progress: 10, units: [
    { id: "u34", code: "901", name: null, unit_type: "Departamento", room_count: 2, progress: 10, hasBlockedTasks: false },
    { id: "u35", code: "902", name: null, unit_type: "Departamento", room_count: 3, progress: 10, hasBlockedTasks: false },
    { id: "u36", code: "903", name: null, unit_type: "Departamento", room_count: 2, progress: 10, hasBlockedTasks: false },
  ]},
  { id: "mock-10", name: "Piso 10", identifier: null, progress: 10, units: [
    { id: "u37", code: "1001", name: null, unit_type: "Departamento", room_count: 2, progress: 10, hasBlockedTasks: false },
    { id: "u38", code: "1002", name: null, unit_type: "Departamento", room_count: 3, progress: 10, hasBlockedTasks: false },
    { id: "u39", code: "1003", name: null, unit_type: "Departamento", room_count: 2, progress: 10, hasBlockedTasks: false },
  ]},
]

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
          width: `${progress}%`,
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
      className="flex flex-1 flex-col gap-6 rounded-[14px] border border-[#edeef0] bg-white px-4 py-[17px]"
      style={{ boxShadow: DASHBOARD_SHADOW }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex size-[31px] shrink-0 items-center justify-center rounded-[10px]"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className={cn("size-4", iconColor)} aria-hidden />
        </div>
        <p className={DASHBOARD_TYPE.statValue}>{value}</p>
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
      href={`/${projectId}/unidades/${unit.id}`}
      className="flex w-[200px] shrink-0 flex-col gap-2 rounded-[8px] border border-[#edeef0] bg-[#fbfdff] px-[9px] py-[13px] transition-colors hover:border-[#ff7433]/40 hover:bg-white"
    >
      <div className="flex flex-col gap-[2px]">
        <div className="flex items-center justify-between">
          <span className={DASHBOARD_TYPE.unitCode}>
            {getUnitDisplayCode(unit, unitIndex)}
          </span>
          <span className={DASHBOARD_TYPE.unitProgress}>{unit.progress}%</span>
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
        className="flex w-full items-center gap-3 px-4 py-[11.5px] text-left transition-colors hover:bg-[#f9f9fb]"
      >
        <div className="flex min-w-0 flex-1 items-center gap-6">
          <div className="flex shrink-0 items-center gap-1">
            {open ? (
              <ChevronDown className="size-4 text-[#696e77]" aria-hidden />
            ) : (
              <ChevronRight className="size-4 text-[#696e77]" aria-hidden />
            )}
            <span className={DASHBOARD_TYPE.floorName}>{floor.name}</span>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <DashboardProgressBar progress={floor.progress} className="h-2 w-[300px] shrink-0" />
            <span className={DASHBOARD_TYPE.floorProgress}>{floor.progress}%</span>
          </div>
        </div>

        <div className={cn("flex shrink-0 items-center gap-2", DASHBOARD_TYPE.floorMeta)}>
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

export function DashboardMainView({
  project,
  dashboard,
}: {
  project: ProjectBasics
  dashboard: { floors: DashboardFloor[]; stats: DashboardStats } | null
}) {
  const floors = dashboard?.floors ?? mockFloors
  const stats = dashboard?.stats ?? {
    totalFloors: mockFloors.length,
    totalUnits: mockFloors.reduce((sum, floor) => sum + floor.units.length, 0),
    generalProgress: 52,
    completedUnits: 1,
    completedTasksThisWeek: 24,
    blockedTasks: 7,
  }

  return (
    <div className="flex flex-col gap-8 py-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className={DASHBOARD_TYPE.pageTitle}>{project.name}</h1>
          <p className={DASHBOARD_TYPE.pageSubtitle}>
            {stats.totalFloors} Pisos · {stats.totalUnits} Unidades · Progreso General:{" "}
            {stats.generalProgress}%
          </p>
        </div>

        <div className="flex gap-3">
          <StatCard
            iconBg="#eff6ff"
            icon={TrendingUp}
            iconColor="text-[#0d74ce]"
            value={`${stats.generalProgress}%`}
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
            value={stats.completedTasksThisWeek == null ? "—" : String(stats.completedTasksThisWeek)}
            label="Tareas certificadas"
            sublabel="esta semana"
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
