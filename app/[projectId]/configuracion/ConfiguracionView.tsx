"use client"

import { useState, type ReactNode } from "react"
import { Building2, CalendarDays, Check, Layers, MapPin, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CreateProjectStructureStep } from "@/components/projects/new/steps/CreateProjectStructureStep"
import { CreateProjectTasksStep } from "@/components/projects/new/steps/CreateProjectTasksStep"
import {
  createDefaultFloor,
  createEmptyProjectDraft,
  type CreateProjectDraft,
} from "@/lib/projects/createProjectDraft"

type ConfiguracionViewProps = {
  projectName: string
}

// Inputs de la card Información Básica — Figma 1226:6422: 42px, r10, borde #e2e8f0
const basicInputClassName =
  "h-[42px] w-full rounded-[10px] border bg-white px-3 text-[14px] font-normal leading-5 text-[#0a0a0a] shadow-none placeholder:text-[#777b84] focus-visible:border-[#ff7433] focus-visible:ring-0"
const basicInputStyle = { borderColor: "#e2e8f0" } as const

function SettingsCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <section
      className="flex flex-col gap-5 rounded-[16px] border border-[#edeef0] bg-white p-6"
      style={{ boxShadow: "0 0 10px rgba(243, 103, 31, 0.08)" }}
    >
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-[#ff7433]">{icon}</span>
        <h2 className="text-[18px] font-normal leading-5 text-[#272a2d]">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function FieldLabel({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-[12px] font-normal leading-4 text-[#43484e]">
      {icon ? <span className="shrink-0 text-[#43484e]">{icon}</span> : null}
      {children}
    </span>
  )
}

export function ConfiguracionView({ projectName }: ConfiguracionViewProps) {
  const [draft, setDraft] = useState<CreateProjectDraft>(() => {
    const base = createEmptyProjectDraft()
    return {
      ...base,
      projectName: projectName || "Emerald",
      location: "Padre Patiño 651, Formosa",
      floors: [
        { ...createDefaultFloor(1), name: "Planta Baja" },
        createDefaultFloor(2),
        createDefaultFloor(3),
      ],
    }
  })

  const [name, setName] = useState(draft.projectName)
  const [location, setLocation] = useState(draft.location)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const updateDraft = (patch: Partial<CreateProjectDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
  }

  return (
    <div className="flex flex-col gap-5 pt-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-recoleta text-[28px] font-normal leading-tight text-[#272a2d]">
            Configuración del Proyecto
          </h1>
          <p className="text-[14px] leading-5 text-[#43484e]">
            Administra la estructura, rubros y equipo del proyecto.
          </p>
        </div>
        <Button
          variant="brand"
          size="brand"
          className="gap-1.5 text-[14px] font-normal leading-5"
        >
          <Check className="size-4" aria-hidden />
          Guardar Cambios
        </Button>
      </div>

      {/* Información Básica */}
      <SettingsCard icon={<Building2 className="size-5" aria-hidden />} title="Información Básica">
        <div className="flex flex-col gap-4">
          <div className="flex items-end gap-4">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-[10px] bg-[#ff7433]">
              <Building2 className="size-10 text-white" aria-hidden />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <FieldLabel>Nombre del Proyecto *</FieldLabel>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  updateDraft({ projectName: e.target.value })
                }}
                className={basicInputClassName}
                style={basicInputStyle}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <FieldLabel icon={<MapPin className="size-3" aria-hidden />}>Ubicación *</FieldLabel>
              <Input
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value)
                  updateDraft({ location: e.target.value })
                }}
                className={basicInputClassName}
                style={basicInputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel icon={<CalendarDays className="size-3" aria-hidden />}>Fecha de Inicio *</FieldLabel>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={basicInputClassName}
                style={basicInputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel icon={<CalendarDays className="size-3" aria-hidden />}>Finalización Estimada *</FieldLabel>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={basicInputClassName}
                style={basicInputStyle}
              />
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Configuración de Pisos y Unidades */}
      <SettingsCard icon={<Layers className="size-5" aria-hidden />} title="Configuración de Pisos y Unidades">
        <CreateProjectStructureStep draft={draft} onChange={updateDraft} />
      </SettingsCard>

      {/* Rubros y Checklists */}
      <SettingsCard icon={<Wrench className="size-5" aria-hidden />} title="Rubros y Checklists">
        <CreateProjectTasksStep draft={draft} onChange={updateDraft} />
      </SettingsCard>
    </div>
  )
}
