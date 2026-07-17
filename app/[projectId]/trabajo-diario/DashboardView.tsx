"use client"

import { useMemo, useState } from "react"
import { Calendar, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ProjectBasics } from "../configuracion/actions"
import type { TrabajoDiarioData, TrabajoDiarioTaskStatus } from "./actions"

const ALL_FLOORS = "Todos los pisos"
const ALL_UNITS = "Todas las unidades"

const statusStyles: Record<TrabajoDiarioTaskStatus, string> = {
  Completado: "bg-[#d6f1e3] text-[#208368]",
  "En Proceso": "bg-[#fff7c2] text-[#4f3422]",
  Bloqueado: "bg-[#ffdbdc] text-[#641723]",
}

type Props = {
  project: ProjectBasics
  data: TrabajoDiarioData
}

export function DashboardView({ project, data }: Props) {
  const [fromDate, setFromDate] = useState("01/05/2026")
  const [toDate, setToDate] = useState("07/05/2026")
  const [selectedFloor, setSelectedFloor] = useState(ALL_FLOORS)
  const [selectedUnit, setSelectedUnit] = useState(ALL_UNITS)

  const availableUnits = useMemo(() => {
    if (selectedFloor === ALL_FLOORS) {
      return data.floors.flatMap((floor) => floor.units)
    }
    const floor = data.floors.find((item) => item.name === selectedFloor)
    return floor?.units ?? []
  }, [data.floors, selectedFloor])

  const visibleTasks = useMemo(() => {
    return data.tasks.filter((task) => {
      if (selectedFloor !== ALL_FLOORS && task.floorName !== selectedFloor) return false
      if (selectedUnit !== ALL_UNITS && task.unitCode !== selectedUnit) return false
      return true
    })
  }, [data.tasks, selectedFloor, selectedUnit])

  const todayLabel = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date())

  return (
    <div className="flex flex-col gap-6 px-24 py-6">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-recoleta text-[28px] font-normal leading-tight text-[#272a2d]">
            Trabajo Diario
          </h1>
          <div className="flex items-center gap-2 text-[14px] text-[#43484e]">
            <Calendar className="size-4" aria-hidden />
            <span className="capitalize">{todayLabel}</span>
            <span className="text-[#777b84]">• {project.name}</span>
          </div>
        </div>
        <Button variant="brand" size="brand" className="gap-2">
          <Plus className="size-5" />
          Cargar Avances
        </Button>
      </div>

      <div className="rounded-[14px] border border-[#edeef0] bg-white p-[25px] shadow-[0_0_5px_rgba(243,103,31,0.08)]">
        <h2 className="mb-6 text-[20px] font-normal leading-7 text-[#1d293d] tracking-[0.4px]">
          Trabajos Cargados
        </h2>

        <div className="mb-6 flex gap-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-[12px] font-normal leading-4 text-[#777b84] tracking-[-0.36px]">
              Desde
            </label>
            <div className="flex items-center gap-2 rounded-[10px] border border-[#afb3ba] px-3 py-2.5">
              <Calendar className="size-4 text-[#777b84]" />
              <input
                type="text"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="flex-1 border-0 bg-transparent text-[14px] outline-none"
              />
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-[12px] font-normal leading-4 text-[#777b84] tracking-[-0.36px]">
              Hasta
            </label>
            <div className="flex items-center gap-2 rounded-[10px] border border-[#afb3ba] px-3 py-2.5">
              <Calendar className="size-4 text-[#777b84]" />
              <input
                type="text"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="flex-1 border-0 bg-transparent text-[14px] outline-none"
              />
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-[12px] font-normal leading-4 text-[#777b84] tracking-[-0.36px]">
              Piso
            </label>
            <select
              value={selectedFloor}
              onChange={(e) => {
                setSelectedFloor(e.target.value)
                setSelectedUnit(ALL_UNITS)
              }}
              className="rounded-[10px] border border-[#afb3ba] px-3 py-2.5 text-[14px] outline-none"
            >
              <option>{ALL_FLOORS}</option>
              {data.floors.map((floor) => (
                <option key={floor.id} value={floor.name}>
                  {floor.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-[12px] font-normal leading-4 text-[#777b84] tracking-[-0.36px]">
              Unidad
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="rounded-[10px] border border-[#afb3ba] px-3 py-2.5 text-[14px] outline-none"
            >
              <option>{ALL_UNITS}</option>
              {availableUnits.map((unit) => (
                <option key={unit.id} value={unit.code}>
                  {unit.name ? `${unit.code} — ${unit.name}` : unit.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {visibleTasks.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-[#edeef0] px-4 py-8 text-center text-[14px] text-[#777b84]">
              No hay trabajos cargados para los filtros seleccionados.
            </div>
          ) : (
            visibleTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-[12px] border border-[#edeef0] p-3.5"
              >
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-normal text-[#272a2d]">{task.name}</h3>
                    <span className="text-[12px] font-normal text-[#777b84]">{task.category}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[12px] text-[#62748e]">
                    <span>{task.floorName}</span>
                    <span>•</span>
                    <span>{task.unitName ? `${task.unitCode} — ${task.unitName}` : task.unitCode}</span>
                    <span>•</span>
                    <span>{task.date}</span>
                  </div>
                </div>
                <div
                  className={`rounded-lg px-2 py-1.5 text-[12px] font-medium ${statusStyles[task.status]}`}
                >
                  {task.status}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
