"use client"

import { useState } from "react"
import {
  TrendingUp,
  CheckCircle2,
  ClipboardCheck,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { formatUnitSequenceNumber } from "@/lib/projects/floorLabels"
import { getUnitTypeIcon } from "@/lib/projects/unitTypeIcons"
import { getUnitDashboardLabel } from "@/lib/projects/unitTypes"
import { cn } from "@/lib/utils"
import type { ProjectBasics, DashboardFloor, DashboardStats } from "../configuracion/actions"

const mockFloors: DashboardFloor[] = [
  {
    id: "mock-1",
    name: "Planta baja",
    progress: 100,
    units: [
      {
        id: "u1",
        code: "101",
        name: null,
        unit_type: "Estacionamiento",
        room_count: null,
        progress: 70, hasBlockedTasks: false,
      },
    ],
  },
  {
    id: "mock-2",
    name: "Piso 2",
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
    progress: 76,
    units: [
      { id: "u5", code: "301", name: "L", unit_type: "Oficina", room_count: null, progress: 80, hasBlockedTasks: false },
      { id: "u6", code: "302", name: null, unit_type: "Departamento", room_count: 3, progress: 65, hasBlockedTasks: true },
      { id: "u7", code: "303", name: null, unit_type: "Departamento", room_count: 2, progress: 90, hasBlockedTasks: false },
      { id: "u8", code: "304", name: null, unit_type: "Departamento", room_count: 4, progress: 50, hasBlockedTasks: true },
      { id: "u9", code: "305", name: null, unit_type: "Departamento", room_count: 1, progress: 55, hasBlockedTasks: false },
    ],
  },
  { id: "mock-4", name: "Piso 4", progress: 50, units: [
    { id: "u10", code: "401", name: null, unit_type: "Departamento", room_count: 2, progress: 60, hasBlockedTasks: false },
    { id: "u11", code: "402", name: null, unit_type: "Departamento", room_count: 3, progress: 40, hasBlockedTasks: false },
    { id: "u12", code: "403", name: "M", unit_type: "Oficina", room_count: null, progress: 45, hasBlockedTasks: true },
    { id: "u13", code: "404", name: null, unit_type: "Departamento", room_count: 4, progress: 50, hasBlockedTasks: false },
    { id: "u14", code: "405", name: null, unit_type: "Departamento", room_count: 1, progress: 45, hasBlockedTasks: false },
    { id: "u15", code: "406", name: null, unit_type: "Departamento", room_count: 3, progress: 50, hasBlockedTasks: false },
  ]},
  { id: "mock-5", name: "Piso 5", progress: 30, units: [
    { id: "u16", code: "501", name: null, unit_type: "Departamento", room_count: 2, progress: 35, hasBlockedTasks: false },
    { id: "u17", code: "502", name: null, unit_type: "Departamento", room_count: 3, progress: 25, hasBlockedTasks: false },
    { id: "u18", code: "503", name: null, unit_type: "Departamento", room_count: 2, progress: 30, hasBlockedTasks: false },
    { id: "u19", code: "504", name: null, unit_type: "Departamento", room_count: 4, progress: 30, hasBlockedTasks: false },
    { id: "u20", code: "505", name: null, unit_type: "Departamento", room_count: 1, progress: 30, hasBlockedTasks: false },
  ]},
  { id: "mock-6", name: "Piso 6", progress: 30, units: [
    { id: "u21", code: "601", name: null, unit_type: "Departamento", room_count: 2, progress: 30, hasBlockedTasks: false },
    { id: "u22", code: "602", name: null, unit_type: "Departamento", room_count: 3, progress: 30, hasBlockedTasks: false },
    { id: "u23", code: "603", name: null, unit_type: "Departamento", room_count: 2, progress: 30, hasBlockedTasks: false },
    { id: "u24", code: "604", name: null, unit_type: "Departamento", room_count: 4, progress: 30, hasBlockedTasks: false },
    { id: "u25", code: "605", name: null, unit_type: "Departamento", room_count: 1, progress: 30, hasBlockedTasks: false },
  ]},
  { id: "mock-7", name: "Piso 7", progress: 10, units: [
    { id: "u26", code: "701", name: null, unit_type: "Departamento", room_count: 2, progress: 10, hasBlockedTasks: false },
    { id: "u27", code: "702", name: null, unit_type: "Departamento", room_count: 3, progress: 10, hasBlockedTasks: false },
    { id: "u28", code: "703", name: null, unit_type: "Departamento", room_count: 2, progress: 10, hasBlockedTasks: false },
    { id: "u29", code: "704", name: null, unit_type: "Departamento", room_count: 4, progress: 10, hasBlockedTasks: false },
  ]},
  { id: "mock-8", name: "Piso 8", progress: 10, units: [
    { id: "u30", code: "801", name: null, unit_type: "Departamento", room_count: 2, progress: 10, hasBlockedTasks: false },
    { id: "u31", code: "802", name: null, unit_type: "Departamento", room_count: 3, progress: 10, hasBlockedTasks: false },
    { id: "u32", code: "803", name: null, unit_type: "Departamento", room_count: 2, progress: 10, hasBlockedTasks: false },
    { id: "u33", code: "804", name: null, unit_type: "Departamento", room_count: 4, progress: 10, hasBlockedTasks: false },
  ]},
  { id: "mock-9", name: "Piso 9", progress: 10, units: [
    { id: "u34", code: "901", name: null, unit_type: "Departamento", room_count: 2, progress: 10, hasBlockedTasks: false },
    { id: "u35", code: "902", name: null, unit_type: "Departamento", room_count: 3, progress: 10, hasBlockedTasks: false },
    { id: "u36", code: "903", name: null, unit_type: "Departamento", room_count: 2, progress: 10, hasBlockedTasks: false },
  ]},
  { id: "mock-10", name: "Piso 10", progress: 10, units: [
    { id: "u37", code: "1001", name: null, unit_type: "Departamento", room_count: 2, progress: 10, hasBlockedTasks: false },
    { id: "u38", code: "1002", name: null, unit_type: "Departamento", room_count: 3, progress: 10, hasBlockedTasks: false },
    { id: "u39", code: "1003", name: null, unit_type: "Departamento", room_count: 2, progress: 10, hasBlockedTasks: false },
  ]},
]

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
    <div className="flex flex-1 flex-col gap-6 rounded-[14px] border border-[#edeef0] bg-white px-4 py-4.25 shadow-[0_0_5px_rgba(243,103,31,0.08)]">
      <div className="flex items-center gap-3">
        <div
          className="flex shrink-0 items-center justify-center rounded-[10px]"
          style={{ width: 31, height: 31, backgroundColor: iconBg }}
        >
          <Icon className={cn("size-4", iconColor)} />
        </div>
        <p className="font-recoleta text-[28px] leading-[1.05] text-[#111113]">{value}</p>
      </div>
      <div className="flex flex-col gap-0.75">
        <p className="text-[12px] leading-[1.4] tracking-[-0.36px] text-[#212225]">{label}</p>
        <p className="text-[12px] leading-[1.4] tracking-[-0.36px] text-[#696e77]">{sublabel}</p>
      </div>
    </div>
  )
}

function UnitCard({
  unit,
  unitIndex,
}: {
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
    <div className="flex w-[200px] shrink-0 flex-col gap-2 rounded-[10px] border border-[#edeef0] bg-[#fbfdff] p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium leading-[1.4] text-[#212225]">
          {formatUnitSequenceNumber(unitIndex)}
        </span>
        <span className="text-[12px] leading-[1.4] text-[#696e77]">{unit.progress}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#edeef0]">
        <div
          className="h-full rounded-full bg-[#212225] transition-all"
          style={{ width: `${unit.progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <Icon className="size-3.5 shrink-0 text-[#212225]" aria-hidden />
          <span className="truncate text-[12px] font-normal leading-[1.4] text-[#212225]">
            {displayTypeLabel}
          </span>
        </div>
        {unit.hasBlockedTasks ? (
          <AlertTriangle
            className="size-3.5 shrink-0 text-[#CE2C31]"
            aria-label="Tiene tareas bloqueadas"
          />
        ) : null}
      </div>
    </div>
  )
}

function FloorCard({ floor, defaultOpen = false }: { floor: DashboardFloor; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const progressColor = floor.progress === 100 ? "#208368" : "#FF7433"
  const blockedUnitsCount = floor.units.filter((unit) => unit.hasBlockedTasks).length

  return (
    <div className="rounded-[14px] border border-[#edeef0] bg-white shadow-[0_0_5px_rgba(243,103,31,0.08)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-[11.5px] text-left transition-colors hover:bg-[#f9f9fb]"
        style={{ borderRadius: open ? "14px 14px 0 0" : "14px" }}
      >
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-[#696e77]" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-[#696e77]" />
        )}

        <span className="w-28 shrink-0 text-[14px] font-semibold leading-5 tracking-[-0.15px] text-[#212225]">
          {floor.name}
        </span>

        <div className="flex flex-1 items-center gap-2">
          <div className="h-2 w-75 shrink-0 overflow-hidden rounded-full bg-[#edeef0]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${floor.progress}%`, backgroundColor: progressColor }}
            />
          </div>
          <span className="w-10 shrink-0 text-[12px] leading-[1.4] tracking-[-0.36px] text-[#696e77]">
            {floor.progress}%
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2 text-[12px] leading-[1.4] tracking-[-0.36px] text-[#696e77]">
          <span>
            {floor.units.length} {floor.units.length === 1 ? "unidad" : "unidades"}
          </span>
          {blockedUnitsCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-[#CE2C31]">
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
              <span className="font-medium">{blockedUnitsCount}</span>
            </span>
          ) : null}
        </div>
      </button>

      {open && (
        <div className="border-t border-[#edeef0] px-4 pb-4 pt-3">
          <div className="flex gap-3 overflow-x-auto">
            {floor.units.map((unit, index) => (
              <UnitCard key={unit.id} unit={unit} unitIndex={index + 1} />
            ))}
          </div>
        </div>
      )}
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
    totalUnits: mockFloors.reduce((s, f) => s + f.units.length, 0),
    generalProgress: 52,
    completedUnits: 1,
    completedTasksThisWeek: null,
    blockedTasks: null,
  }

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-recoleta text-[28px] font-normal leading-[1.05] text-[#111113]">
          {project.name}
        </h1>
        <p className="text-[14px] leading-5 tracking-[-0.36px] text-[#696e77]">
          {stats.totalFloors} Pisos · {stats.totalUnits} Unidades · Progreso General: {stats.generalProgress}%
        </p>
      </div>

      {/* Stat Cards */}
      <div className="flex gap-3">
        <StatCard
          iconBg="#eff6ff"
          icon={TrendingUp}
          iconColor="text-blue-600"
          value={`${stats.generalProgress}%`}
          label="Progreso General"
          sublabel="promedio de todas las unidades"
        />
        <StatCard
          iconBg="#e6f7ed"
          icon={CheckCircle2}
          iconColor="text-[#208368]"
          value={`${stats.completedUnits}/${stats.totalUnits}`}
          label="Completo"
          sublabel="unidades terminadas"
        />
        <StatCard
          iconBg="#fefbe9"
          icon={ClipboardCheck}
          iconColor="text-[#AB6400]"
          value={stats.completedTasksThisWeek == null ? "—" : String(stats.completedTasksThisWeek)}
          label="Tareas completadas"
          sublabel="esta semana"
        />
        <StatCard
          iconBg="#feebec"
          icon={AlertTriangle}
          iconColor="text-[#CE2C31]"
          value={stats.blockedTasks == null ? "—" : String(stats.blockedTasks)}
          label="Problemas"
          sublabel="tareas bloqueadas"
        />
      </div>

      {/* Floor Cards */}
      <div className="flex flex-col gap-3">
        {floors.map((floor, idx) => (
          <FloorCard key={floor.id} floor={floor} defaultOpen={idx < 2} />
        ))}
      </div>
    </div>
  )
}
