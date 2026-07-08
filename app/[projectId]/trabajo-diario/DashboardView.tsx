"use client"

import { useState } from "react"
import { Calendar, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ProjectBasics } from "../configuracion/actions"

const mockTasks = [
  {
    id: "1",
    name: "Primera mano de pintura",
    category: "Pintura",
    floor: "Piso 5",
    unit: "Unidad 501",
    date: "5 may",
    status: "Completado" as const,
  },
  {
    id: "2",
    name: "Segunda mano de pintura",
    category: "Pintura",
    floor: "Piso 5",
    unit: "Unidad 501",
    date: "5 may",
    status: "En Proceso" as const,
  },
  {
    id: "3",
    name: "Lijado",
    category: "Pintura",
    floor: "Piso 5",
    unit: "Unidad 502",
    date: "5 may",
    status: "Completado" as const,
  },
  {
    id: "4",
    name: "Instalación de luminarias",
    category: "Instalaciones Eléctricas",
    floor: "Piso 5",
    unit: "Unidad 503",
    date: "4 may",
    status: "Completado" as const,
  },
  {
    id: "5",
    name: "Tablero eléctrico",
    category: "Instalaciones Eléctricas",
    floor: "Piso 5",
    unit: "Unidad 503",
    date: "4 may",
    status: "Bloqueado" as const,
  },
  {
    id: "6",
    name: "Colocación de cerámicos",
    category: "Pisos",
    floor: "Piso 5",
    unit: "Unidad 501",
    date: "3 may",
    status: "Completado" as const,
  },
  {
    id: "7",
    name: "Colocación de Porcelanatos",
    category: "Pisos",
    floor: "Piso 5",
    unit: "Unidad 501",
    date: "3 may",
    status: "Completado" as const,
  },
  {
    id: "8",
    name: "Zócalos",
    category: "Pisos",
    floor: "Piso 4",
    unit: "Unidad 403",
    date: "4 may",
    status: "Completado" as const,
  },
]

const statusStyles = {
  Completado: "bg-[#d6f1e3] text-[#208368]",
  "En Proceso": "bg-[#fff7c2] text-[#4f3422]",
  Bloqueado: "bg-[#ffdbdc] text-[#641723]",
}

type ProjectBasicsType = ProjectBasics

export function DashboardView({ project }: { project: ProjectBasicsType }) {
  const [fromDate, setFromDate] = useState("01/05/2026")
  const [toDate, setToDate] = useState("07/05/2026")
  const [selectedFloor, setSelectedFloor] = useState("Todos los pisos")
  const [selectedUnit, setSelectedUnit] = useState("Todas las unidades")

  const getStatusColor = (status: string): keyof typeof statusStyles => {
    return status as keyof typeof statusStyles
  }

  return (
    <div className="flex flex-col gap-6 px-24 py-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-recoleta text-[28px] font-normal leading-tight text-[#272a2d]">
            Trabajo Diario
          </h1>
          <div className="flex items-center gap-2 text-[14px] text-[#43484e]">
            <Calendar className="size-4" aria-hidden />
            <span>Jueves, 7 de mayo de 2026</span>
          </div>
        </div>
        <Button variant="brand" size="brand" className="gap-2">
          <Plus className="size-5" />
          Cargar Avances
        </Button>
      </div>

      {/* Main Content */}
      <div className="rounded-[14px] border border-[#edeef0] bg-white p-[25px] shadow-[0_0_5px_rgba(243,103,31,0.08)]">
        {/* Title */}
        <h2 className="mb-6 text-[20px] font-normal leading-7 text-[#1d293d] tracking-[0.4px]">
          Trabajos Cargados
        </h2>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          {/* From Date */}
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

          {/* To Date */}
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

          {/* Floor Dropdown */}
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-[12px] font-normal leading-4 text-[#777b84] tracking-[-0.36px]">
              Piso
            </label>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="rounded-[10px] border border-[#afb3ba] px-3 py-2.5 text-[14px] outline-none"
            >
              <option>Todos los pisos</option>
              <option>Piso 1</option>
              <option>Piso 2</option>
              <option>Piso 3</option>
              <option>Piso 4</option>
              <option>Piso 5</option>
            </select>
          </div>

          {/* Unit Dropdown */}
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-[12px] font-normal leading-4 text-[#777b84] tracking-[-0.36px]">
              Unidad
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="rounded-[10px] border border-[#afb3ba] px-3 py-2.5 text-[14px] outline-none"
            >
              <option>Todas las unidades</option>
              <option>Unidad 101</option>
              <option>Unidad 102</option>
              <option>Unidad 103</option>
              <option>Unidad 104</option>
              <option>Unidad 105</option>
            </select>
          </div>
        </div>

        {/* Tasks List */}
        <div className="flex flex-col gap-2">
          {mockTasks.map((task) => (
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
                  <span>{task.floor}</span>
                  <span>•</span>
                  <span>{task.unit}</span>
                  <span>•</span>
                  <span>{task.date}</span>
                </div>
              </div>
              <div
                className={`rounded-lg px-2 py-1.5 text-[12px] font-medium ${statusStyles[getStatusColor(task.status)]}`}
              >
                {task.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
