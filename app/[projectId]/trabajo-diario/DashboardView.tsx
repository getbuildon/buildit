"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns"
import { Calendar, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getUnitDisplayLabel,
  getUnitDisplayTitle,
} from "@/lib/projects/cargarAvance"
import { getFloorShortLabel } from "@/lib/projects/floorLabels"
import type { ProjectBasics } from "../configuracion/actions"
import { CargarAvanceView } from "./CargarAvanceView"
import { TaskDetailDialog } from "./TaskDetailDialog"
import type { TrabajoDiarioData, TrabajoDiarioTaskStatus } from "./actions"

const ALL_FLOORS_VALUE = "__all_floors__"
const ALL_UNITS_VALUE = "__all_units__"
const ALL_FLOORS_LABEL = "Todos los pisos"
const ALL_UNITS_LABEL = "Todas las unidades"
const UNIT_FILTER_DISABLED_LABEL = "Seleccioná un piso primero"

const filterLabelClassName =
  "text-[12px] font-normal leading-4 text-[#777b84] tracking-[-0.36px]"

const filterFieldClassName = "flex min-w-0 flex-col gap-1.5"

const statusStyles: Record<TrabajoDiarioTaskStatus, string> = {
  Completado: "bg-[#d6f1e3] text-[#208368]",
  "En Proceso": "bg-[#fff7c2] text-[#4f3422]",
  Bloqueado: "bg-[#ffdbdc] text-[#641723]",
}

type ViewMode = "list" | "load"

type Props = {
  project: ProjectBasics
  data: TrabajoDiarioData
}

export function DashboardView({ project, data }: Props) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [selectedLoadFloorId, setSelectedLoadFloorId] = useState<string | null>(null)
  const [selectedLoadRubroId, setSelectedLoadRubroId] = useState<string | null>(null)
  const [fromDate, setFromDate] = useState(() => startOfMonth(new Date()))
  const [toDate, setToDate] = useState(() => endOfMonth(new Date()))
  const [selectedFloorId, setSelectedFloorId] = useState(ALL_FLOORS_VALUE)
  const [selectedUnitId, setSelectedUnitId] = useState(ALL_UNITS_VALUE)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [taskDetailOpen, setTaskDetailOpen] = useState(false)

  const isUnitFilterEnabled = selectedFloorId !== ALL_FLOORS_VALUE

  const unitFilterOptions = useMemo(() => {
    if (!isUnitFilterEnabled) return []

    const floor = data.floors.find((item) => item.id === selectedFloorId)
    if (!floor) return []

    return floor.units.map((unit, index) => ({
      unitId: unit.id,
      label: getUnitDisplayLabel(floor.name, index + 1),
      title: getUnitDisplayTitle(unit, floor.name, index + 1),
    }))
  }, [data.floors, isUnitFilterEnabled, selectedFloorId])

  const visibleTasks = useMemo(() => {
    const rangeStart = startOfDay(fromDate)
    const rangeEnd = endOfDay(toDate)

    return data.tasks.filter((task) => {
      if (selectedFloorId !== ALL_FLOORS_VALUE && task.floorId !== selectedFloorId) return false
      if (selectedUnitId !== ALL_UNITS_VALUE && task.unitId !== selectedUnitId) return false

      if (task.occurredAt) {
        const taskDate = new Date(task.occurredAt)
        if (taskDate < rangeStart || taskDate > rangeEnd) return false
      }

      return true
    })
  }, [data.tasks, fromDate, selectedFloorId, selectedUnitId, toDate])

  const todayLabel = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date())

  const exitLoadMode = () => {
    setViewMode("list")
    setSelectedLoadFloorId(null)
    setSelectedLoadRubroId(null)
  }

  const handleSelectFloor = (floorId: string) => {
    setSelectedLoadFloorId(floorId)
    setSelectedLoadRubroId(null)
  }

  const handleSelectRubro = (rubroId: string) => {
    setSelectedLoadRubroId(rubroId)
  }

  const handleSaved = () => {
    exitLoadMode()
    router.refresh()
  }

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
            {viewMode === "list" ? (
              <span className="text-[#777b84]">• {project.name}</span>
            ) : null}
          </div>
        </div>

        {viewMode === "list" ? (
          <Button
            variant="brand"
            size="brand"
            className="gap-2"
            onClick={() => setViewMode("load")}
          >
            <Plus className="size-5" />
            Cargar Avances
          </Button>
        ) : (
          <Button variant="brand" size="brand" className="gap-2" onClick={exitLoadMode}>
            <X className="size-4" />
            Cancelar
          </Button>
        )}
      </div>

      {viewMode === "load" ? (
        <CargarAvanceView
          projectId={project.id}
          floors={data.floors}
          rubroGroups={data.rubroGroups}
          assignmentsByUnit={data.assignmentsByUnit}
          selectedFloorId={selectedLoadFloorId}
          selectedRubroId={selectedLoadRubroId}
          onSelectFloor={handleSelectFloor}
          onSelectRubro={handleSelectRubro}
          onClose={exitLoadMode}
          onSaved={handleSaved}
        />
      ) : (
        <div className="rounded-[14px] border border-[#edeef0] bg-white p-[25px] shadow-[0_0_5px_rgba(243,103,31,0.08)]">
          <h2 className="mb-6 text-[20px] font-normal leading-7 text-[#1d293d] tracking-[0.4px]">
            Trabajos Cargados
          </h2>

          <div className="mb-6 grid grid-cols-4 gap-4">
            <div className={filterFieldClassName}>
              <Label htmlFor="filter-from-date" className={filterLabelClassName}>
                Desde
              </Label>
              <DatePicker
                id="filter-from-date"
                value={fromDate}
                onChange={(date) => {
                  if (!date) return
                  setFromDate(date)
                  if (date > toDate) setToDate(date)
                }}
                toDate={toDate}
              />
            </div>

            <div className={filterFieldClassName}>
              <Label htmlFor="filter-to-date" className={filterLabelClassName}>
                Hasta
              </Label>
              <DatePicker
                id="filter-to-date"
                value={toDate}
                onChange={(date) => {
                  if (!date) return
                  setToDate(date)
                  if (date < fromDate) setFromDate(date)
                }}
                fromDate={fromDate}
              />
            </div>

            <div className={filterFieldClassName}>
              <Label className={filterLabelClassName}>Piso</Label>
              <Select
                value={selectedFloorId}
                onValueChange={(value) => {
                  setSelectedFloorId(value)
                  setSelectedUnitId(ALL_UNITS_VALUE)
                }}
              >
                <SelectTrigger aria-label="Filtrar por piso">
                  <SelectValue placeholder={ALL_FLOORS_LABEL} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FLOORS_VALUE}>{ALL_FLOORS_LABEL}</SelectItem>
                  {data.floors.map((floor) => (
                    <SelectItem key={floor.id} value={floor.id} title={floor.name}>
                      {getFloorShortLabel(floor.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={filterFieldClassName}>
              <Label className={filterLabelClassName}>Unidad</Label>
              <Select
                value={selectedUnitId}
                onValueChange={setSelectedUnitId}
                disabled={!isUnitFilterEnabled}
              >
                <SelectTrigger aria-label="Filtrar por unidad">
                  {isUnitFilterEnabled ? (
                    <SelectValue placeholder={ALL_UNITS_LABEL} />
                  ) : (
                    <span className="text-[14px] font-normal text-[#777b84]">
                      {UNIT_FILTER_DISABLED_LABEL}
                    </span>
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_UNITS_VALUE}>{ALL_UNITS_LABEL}</SelectItem>
                  {unitFilterOptions.map((option) => (
                    <SelectItem key={option.unitId} value={option.unitId} title={option.title}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {visibleTasks.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-[#edeef0] px-4 py-8 text-center text-[14px] text-[#777b84]">
                No hay trabajos cargados para los filtros seleccionados.
              </div>
            ) : (
              visibleTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => {
                    setSelectedTaskId(task.id)
                    setTaskDetailOpen(true)
                  }}
                  className="flex w-full items-center justify-between rounded-[12px] border border-[#edeef0] p-3.5 text-left transition-colors hover:border-[#d8dade] hover:bg-[#fafafa]"
                >
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-normal text-[#272a2d]">{task.name}</h3>
                      <span className="text-[12px] font-normal text-[#777b84]">{task.category}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[12px] text-[#62748e]">
                      <span>{task.floorName}</span>
                      <span>•</span>
                      <span>
                        {task.unitName ? `${task.unitCode} — ${task.unitName}` : task.unitCode}
                      </span>
                      <span>•</span>
                      <span>{task.date}</span>
                    </div>
                  </div>
                  <div
                    className={`rounded-lg px-2 py-1.5 text-[12px] font-medium ${statusStyles[task.status]}`}
                  >
                    {task.status}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <TaskDetailDialog
        open={taskDetailOpen}
        onOpenChange={setTaskDetailOpen}
        projectId={project.id}
        entryId={selectedTaskId}
        onEntryIdChange={setSelectedTaskId}
        onSaved={() => router.refresh()}
      />
    </div>
  )
}
