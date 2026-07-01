"use client"

import { useEffect, useState, type ReactNode } from "react"
import { AlertCircle, Building2, CalendarDays, Check, Layers, MapPin, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CreateProjectStructureStep } from "@/components/projects/new/steps/CreateProjectStructureStep"
import { CreateProjectTasksStep } from "@/components/projects/new/steps/CreateProjectTasksStep"
import {
  createDefaultFloor,
  createDefaultRubroItem,
  createDefaultRubroTask,
  createDefaultUnit,
  createEmptyProjectDraft,
  type CreateProjectDraft,
  type RubroGroupDraft,
  type RubroItemDraft,
  type StructureFloorDraft,
  type StructureUnitDraft,
} from "@/lib/projects/createProjectDraft"
import {
  updateProjectBasics,
  getProjectStructure,
  getProjectUnits,
  getProjectRubros,
  saveProjectStructure,
  saveProjectRubros,
  type ProjectBasics,
} from "./actions"

type ConfiguracionViewProps = {
  project: ProjectBasics
}

type SaveFeedback = { type: "success" | "error"; message: string } | null

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

export function ConfiguracionView({ project }: ConfiguracionViewProps) {
  // El draft de estructura/rubros usa IDs aleatorios (crypto.randomUUID), que
  // difieren entre el render del servidor y el del cliente. Lo construimos solo
  // en el cliente, tras montar, para evitar errores de hidratación.
  const [draft, setDraft] = useState<CreateProjectDraft | null>(null)

  useEffect(() => {
    const loadProjectData = async () => {
      const [floors, units, rubros] = await Promise.all([
        getProjectStructure(project.id),
        getProjectUnits(project.id),
        getProjectRubros(project.id),
      ])

      const base = createEmptyProjectDraft()

      // Construir floors con sus units
      const floorsWithUnits: StructureFloorDraft[] = floors.length > 0
        ? floors.map((f) => ({
            id: f.id,
            name: f.name,
            level: f.level || "",
            units: units
              .filter((u) => u.floor_id === f.id)
              .map((u) => ({
                id: u.id,
                type: (u.unit_type || "Departamento") as StructureUnitDraft["type"],
                squareMeters: u.area_m2?.toString() || "",
                roomCount: u.rooms?.toString() || "",
              })),
          }))
        : [
            { ...createDefaultFloor(1), name: "Planta Baja" },
            createDefaultFloor(2),
            createDefaultFloor(3),
          ]

      // Construir grupos de rubros
      const groups: RubroGroupDraft[] = rubros.length > 0
        ? [
            {
              id: "default-group",
              name: "Rubros",
              rubros: rubros.map((r) => ({
                id: r.id,
                name: r.name,
                trackingType: r.tracking_scope as RubroItemDraft["trackingType"],
                tasks: r.tasks.map((t) => ({
                  id: t.id,
                  name: t.name,
                  weightPercent: t.default_weight?.toString() || "",
                })),
              })),
            },
          ]
        : base.groups

      setDraft({
        ...base,
        projectName: project.name,
        location: project.location,
        floors: floorsWithUnits,
        groups,
      })
    }

    loadProjectData()
    // Solo al montar: el proyecto es estable durante la vida de la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [name, setName] = useState(project.name)
  const [location, setLocation] = useState(project.location)
  const [startDate, setStartDate] = useState(project.startDate)
  const [endDate, setEndDate] = useState(project.endDate)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<SaveFeedback>(null)

  const updateDraft = (patch: Partial<CreateProjectDraft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current))
  }

  const handleSave = async () => {
    setFeedback(null)

    if (!name.trim()) {
      setFeedback({ type: "error", message: "El nombre del proyecto es obligatorio." })
      return
    }

    setSaving(true)

    // Guardar datos básicos
    const basicResult = await updateProjectBasics({
      projectId: project.id,
      name,
      location,
      startDate,
      endDate,
    })

    if (!basicResult.ok) {
      setSaving(false)
      setFeedback({ type: "error", message: basicResult.error })
      return
    }

    // Guardar estructura (pisos y unidades)
    const floorsData = draft?.floors.map((f) => ({
      name: f.name,
      level: f.level || null,
      units: f.units.map((u) => ({
        code: `${f.name}-${u.roomCount || u.squareMeters || u.id.slice(0, 4)}`,
        name: null,
        unit_type: u.type,
        room_count: u.roomCount ? parseInt(u.roomCount) : null,
        area_m2: u.squareMeters ? parseFloat(u.squareMeters) : null,
      })),
    })) || []

    const structureResult = await saveProjectStructure(project.id, floorsData)

    if (!structureResult.ok) {
      setSaving(false)
      setFeedback({ type: "error", message: structureResult.error })
      return
    }

    // Guardar rubros y tareas
    const rubrosData = draft?.groups
      .flatMap((g) =>
        g.rubros.map((r) => ({
          name: r.name,
          description: null,
          tracking_scope: r.trackingType,
          tasks: r.tasks.map((t) => ({
            name: t.name,
            description: null,
            default_weight: t.weightPercent ? parseFloat(t.weightPercent) : null,
          })),
        }))
      ) || []

    const rubrosResult = await saveProjectRubros(project.id, rubrosData)

    setSaving(false)

    if (rubrosResult.ok) {
      setFeedback({ type: "success", message: "Cambios guardados correctamente." })
    } else {
      setFeedback({ type: "error", message: rubrosResult.error })
    }
  }

  return (
    <div
      className="flex flex-col gap-5 pt-6"
      style={{
        maxWidth: "747px",
        width: "100%",
        margin: "0 auto",
      }}
    >
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
        <div className="flex flex-col items-end gap-1.5">
          <Button
            variant="brand"
            size="brand"
            onClick={handleSave}
            disabled={saving}
            className="gap-1.5 text-[14px] font-normal leading-5"
          >
            <Check className="size-4" aria-hidden />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
          {feedback ? (
            <span
              className={`flex items-center gap-1.5 text-[13px] leading-4 ${
                feedback.type === "success" ? "text-[#15803d]" : "text-[#b91c1c]"
              }`}
            >
              {feedback.type === "success" ? (
                <Check className="size-3.5" aria-hidden />
              ) : (
                <AlertCircle className="size-3.5" aria-hidden />
              )}
              {feedback.message}
            </span>
          ) : null}
        </div>
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
      {draft ? (
        <SettingsCard icon={<Layers className="size-5" aria-hidden />} title="Configuración de Pisos y Unidades">
          <CreateProjectStructureStep draft={draft} onChange={updateDraft} />
        </SettingsCard>
      ) : null}

      {/* Rubros y Checklists */}
      {draft ? (
        <SettingsCard icon={<Wrench className="size-5" aria-hidden />} title="Rubros y Checklists">
          <CreateProjectTasksStep draft={draft} onChange={updateDraft} />
        </SettingsCard>
      ) : null}
    </div>
  )
}
