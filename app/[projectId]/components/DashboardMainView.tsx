"use client"

import { useState } from "react"
import {
  TrendingUp,
  CheckCircle2,
  ClipboardCheck,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Car,
  Users,
  Dumbbell,
  Trees,
  Home,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProjectBasics, DashboardFloor, DashboardStats } from "../configuracion/actions"

const UNIT_TYPE_ICONS: Record<string, React.ElementType> = {
  Estacionamiento: Car,
  Oficina: Users,
  Gimnasio: Dumbbell,
  Jardín: Trees,
  Patio: Trees,
}

function unitIcon(unitType: string | null): React.ElementType {
  if (!unitType) return Home
  return UNIT_TYPE_ICONS[unitType] ?? Home
}

const mockFloors: DashboardFloor[] = [
  {
    id: "mock-1",
    name: "Planta baja",
    progress: 100,
    units: [{ id: "u1", code: "101", name: "Estacionamiento", unit_type: "Estacionamiento", progress: 70 }],
  },
  {
    id: "mock-2",
    name: "Piso 2",
    progress: 87,
    units: [
      { id: "u2", code: "201", name: "Oficina XL", unit_type: "Oficina", progress: 70 },
      { id: "u3", code: "202", name: "Gimnasio", unit_type: "Gimnasio", progress: 45 },
      { id: "u4", code: "203", name: "Patio", unit_type: "Patio", progress: 90 },
    ],
  },
  {
    id: "mock-3",
    name: "Piso 3",
    progress: 76,
    units: [
      { id: "u5", code: "301", name: "Depto A", unit_type: null, progress: 80 },
      { id: "u6", code: "302", name: "Depto B", unit_type: null, progress: 65 },
      { id: "u7", code: "303", name: "Depto C", unit_type: null, progress: 90 },
      { id: "u8", code: "304", name: "Depto D", unit_type: null, progress: 50 },
      { id: "u9", code: "305", name: "Depto E", unit_type: null, progress: 55 },
    ],
  },
  { id: "mock-4", name: "Piso 4", progress: 50, units: [
    { id: "u10", code: "401", name: "Depto A", unit_type: null, progress: 60 },
    { id: "u11", code: "402", name: "Depto B", unit_type: null, progress: 40 },
    { id: "u12", code: "403", name: "Depto C", unit_type: null, progress: 55 },
    { id: "u13", code: "404", name: "Depto D", unit_type: null, progress: 50 },
    { id: "u14", code: "405", name: "Depto E", unit_type: null, progress: 45 },
    { id: "u15", code: "406", name: "Depto F", unit_type: null, progress: 50 },
  ]},
  { id: "mock-5", name: "Piso 5", progress: 30, units: [
    { id: "u16", code: "501", name: "Depto A", unit_type: null, progress: 35 },
    { id: "u17", code: "502", name: "Depto B", unit_type: null, progress: 25 },
    { id: "u18", code: "503", name: "Depto C", unit_type: null, progress: 30 },
    { id: "u19", code: "504", name: "Depto D", unit_type: null, progress: 30 },
    { id: "u20", code: "505", name: "Depto E", unit_type: null, progress: 30 },
  ]},
  { id: "mock-6", name: "Piso 6", progress: 30, units: [
    { id: "u21", code: "601", name: "Depto A", unit_type: null, progress: 30 },
    { id: "u22", code: "602", name: "Depto B", unit_type: null, progress: 30 },
    { id: "u23", code: "603", name: "Depto C", unit_type: null, progress: 30 },
    { id: "u24", code: "604", name: "Depto D", unit_type: null, progress: 30 },
    { id: "u25", code: "605", name: "Depto E", unit_type: null, progress: 30 },
  ]},
  { id: "mock-7", name: "Piso 7", progress: 10, units: [
    { id: "u26", code: "701", name: "Depto A", unit_type: null, progress: 10 },
    { id: "u27", code: "702", name: "Depto B", unit_type: null, progress: 10 },
    { id: "u28", code: "703", name: "Depto C", unit_type: null, progress: 10 },
    { id: "u29", code: "704", name: "Depto D", unit_type: null, progress: 10 },
  ]},
  { id: "mock-8", name: "Piso 8", progress: 10, units: [
    { id: "u30", code: "801", name: "Depto A", unit_type: null, progress: 10 },
    { id: "u31", code: "802", name: "Depto B", unit_type: null, progress: 10 },
    { id: "u32", code: "803", name: "Depto C", unit_type: null, progress: 10 },
    { id: "u33", code: "804", name: "Depto D", unit_type: null, progress: 10 },
  ]},
  { id: "mock-9", name: "Piso 9", progress: 10, units: [
    { id: "u34", code: "901", name: "Depto A", unit_type: null, progress: 10 },
    { id: "u35", code: "902", name: "Depto B", unit_type: null, progress: 10 },
    { id: "u36", code: "903", name: "Depto C", unit_type: null, progress: 10 },
  ]},
  { id: "mock-10", name: "Piso 10", progress: 10, units: [
    { id: "u37", code: "1001", name: "Depto A", unit_type: null, progress: 10 },
    { id: "u38", code: "1002", name: "Depto B", unit_type: null, progress: 10 },
    { id: "u39", code: "1003", name: "Depto C", unit_type: null, progress: 10 },
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

function UnitCard({ unit }: { unit: DashboardFloor["units"][number] }) {
  const Icon = unitIcon(unit.unit_type)
  return (
    <div className="flex w-50 shrink-0 flex-col gap-2 rounded-[10px] border border-[#edeef0] p-3" style={{ backgroundColor: "#fbfdff" }}>
      <div className="flex items-center justify-between">
        <span className="text-[12px] leading-[1.4] text-[#212225]">{unit.code}</span>
        <span className="text-[12px] leading-[1.4] text-[#696e77]">{unit.progress}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#edeef0]">
        <div className="h-full rounded-full bg-[#212225]" style={{ width: `${unit.progress}%` }} />
      </div>
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 shrink-0 text-[#696e77]" />
        <span className="text-[12px] leading-[1.4] text-[#212225]">{unit.name ?? unit.code}</span>
      </div>
    </div>
  )
}

function FloorCard({ floor, defaultOpen = false }: { floor: DashboardFloor; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const progressColor = floor.progress === 100 ? "#208368" : "#FF7433"

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

        <span className="min-w-17.5 text-right text-[12px] leading-[1.4] tracking-[-0.36px] text-[#696e77]">
          {floor.units.length} unidades
        </span>
      </button>

      {open && (
        <div className="border-t border-[#edeef0] px-4 pb-4 pt-3">
          <div className="flex gap-3 overflow-x-auto">
            {floor.units.map((unit) => (
              <UnitCard key={unit.id} unit={unit} />
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
          value="—"
          label="Tareas completadas"
          sublabel="esta semana"
        />
        <StatCard
          iconBg="#feebec"
          icon={AlertTriangle}
          iconColor="text-[#CE2C31]"
          value="—"
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
