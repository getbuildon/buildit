"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { AlertCircle, Building2, CalendarDays, Check, ChevronDown, MapPin } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { CreateProjectStructureStep } from "@/components/projects/new/steps/CreateProjectStructureStep"
import { CreateProjectTasksStep } from "@/components/projects/new/steps/CreateProjectTasksStep"
import { CreateProjectUnitTasksStep } from "@/components/projects/new/steps/CreateProjectUnitTasksStep"
import {
  formatDraftDateString,
  parseDraftDateString,
  type CreateProjectDraft,
} from "@/lib/projects/createProjectDraft"
import { unitTypeToDbFields } from "@/lib/projects/unitTypes"
import { parseRubroWeightInput } from "@/lib/projects/rubroWeights"
import {
  buildConfigDraftFromProjectData,
  exclusionsToAssignments,
  remapUnitTaskExclusions,
} from "@/lib/projects/unitTaskAssignments"
import { CREATE_PROJECT_LAYOUT } from "@/lib/projects/createProjectTokens"
import {
  buildConfigSnapshot,
  isConfigDirty,
  type ConfigBasicsState,
  type ConfigSavedSnapshot,
} from "@/lib/projects/configDirtyState"
import { cn } from "@/lib/utils"
import {
  clearUnitPlanPhoto,
  clearUnitRenderPhoto,
  uploadUnitAssetsFromDraft,
} from "@/lib/projects/unitPlanPhoto.client"
import {
  updateProjectBasics,
  getProjectStructure,
  getProjectUnits,
  getProjectRubroGroups,
  getUnitTaskAssignments,
  saveProjectStructure,
  saveProjectRubros,
  setUnitTaskAssignments,
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
const basicDatePickerClassName = cn(basicInputClassName, "border-[#e2e8f0] text-left")

function SettingsCard({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string
  children: ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  if (!collapsible) {
    return (
      <section
        className="flex flex-col gap-5 rounded-[16px] border border-[#edeef0] bg-white p-6"
        style={{ boxShadow: "0 0 10px rgba(243, 103, 31, 0.08)" }}
      >
        <h2 className="text-[18px] font-normal leading-5 text-[#272a2d]">{title}</h2>
        {children}
      </section>
    )
  }

  return (
    <section
      className="rounded-[16px] border border-[#edeef0] bg-white px-6 py-4"
      style={{ boxShadow: "0 0 10px rgba(243, 103, 31, 0.08)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2"
        aria-expanded={open}
      >
        <h2 className="flex-1 text-left text-[18px] font-normal leading-5 text-[#272a2d]">
          {title}
        </h2>
        <ChevronDown
          className={`size-4 shrink-0 text-[#43484e] transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? <div className="mt-5 flex flex-col gap-5">{children}</div> : null}
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

function ConfigSaveFooter({
  saving,
  feedback,
  onCancel,
  onSave,
}: {
  saving: boolean
  feedback: SaveFeedback
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#edeef0] bg-white/95 backdrop-blur-sm">
      <div
        className="mx-auto flex w-full flex-wrap items-center justify-end gap-4 px-6 py-4"
        style={{ maxWidth: CREATE_PROJECT_LAYOUT.contentMaxWidth }}
      >
        {feedback ? (
          <span
            className={cn(
              "mr-auto flex items-center gap-1.5 text-[13px] leading-4",
              feedback.type === "success" ? "text-[#15803d]" : "text-[#b91c1c]",
            )}
          >
            {feedback.type === "success" ? (
              <Check className="size-3.5" aria-hidden />
            ) : (
              <AlertCircle className="size-3.5" aria-hidden />
            )}
            {feedback.message}
          </span>
        ) : null}

        <div className="flex items-center justify-end gap-6 rounded-[8px] bg-[rgba(237,238,240,0.4)] px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="text-[14px] font-medium leading-[1.4] text-[#777b84] transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-[10px] px-2 py-3 text-[14px] font-medium leading-[1.4] text-[#111113] shadow-[0_0_10px_rgba(243,103,31,0.3)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Check className="size-4" aria-hidden />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ConfiguracionView({ project }: ConfiguracionViewProps) {
  // El draft de estructura/rubros usa IDs aleatorios (crypto.randomUUID), que
  // difieren entre el render del servidor y el del cliente. Lo construimos solo
  // en el cliente, tras montar, para evitar errores de hidratación.
  const [draft, setDraft] = useState<CreateProjectDraft | null>(null)
  const [savedSnapshot, setSavedSnapshot] = useState<ConfigSavedSnapshot | null>(null)

  const [name, setName] = useState(project.name)
  const [location, setLocation] = useState(project.location)
  const [totalSurface, setTotalSurface] = useState(project.totalSurface)
  const [startDate, setStartDate] = useState(project.startDate)
  const [endDate, setEndDate] = useState(project.endDate)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<SaveFeedback>(null)

  const parsedStartDate = parseDraftDateString(startDate)
  const parsedEndDate = parseDraftDateString(endDate)

  const basicsState = useMemo<ConfigBasicsState>(
    () => ({ name, location, totalSurface, startDate, endDate }),
    [name, location, totalSurface, startDate, endDate],
  )

  const isDirty = useMemo(
    () => isConfigDirty(basicsState, draft, savedSnapshot),
    [basicsState, draft, savedSnapshot],
  )

  const loadProjectData = async (
    basicsOverride?: ConfigBasicsState,
    options?: { updateSnapshot?: boolean },
  ) => {
    const basics = basicsOverride ?? basicsState
    const [floors, units, groups, assignments] = await Promise.all([
      getProjectStructure(project.id),
      getProjectUnits(project.id),
      getProjectRubroGroups(project.id),
      getUnitTaskAssignments(project.id),
    ])

    const nextDraft = buildConfigDraftFromProjectData({
      projectName: basics.name,
      location: basics.location,
      floors,
      units,
      groups,
      assignmentsByUnit: assignments.byUnit,
    })

    setDraft(nextDraft)
    if (options?.updateSnapshot !== false) {
      setSavedSnapshot(buildConfigSnapshot(basics, nextDraft))
    }

    return nextDraft
  }

  useEffect(() => {
    void loadProjectData({
      name: project.name,
      location: project.location,
      totalSurface: project.totalSurface,
      startDate: project.startDate,
      endDate: project.endDate,
    })
    // Solo al montar: el proyecto es estable durante la vida de la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateDraft = (patch: Partial<CreateProjectDraft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current))
    setFeedback(null)
  }

  const applySavedBasics = (basics: ConfigBasicsState) => {
    setName(basics.name)
    setLocation(basics.location)
    setTotalSurface(basics.totalSurface)
    setStartDate(basics.startDate)
    setEndDate(basics.endDate)
  }

  const handleCancel = async () => {
    if (!savedSnapshot) return

    setFeedback(null)
    applySavedBasics(savedSnapshot.basics)
    await loadProjectData(savedSnapshot.basics, { updateSnapshot: false })
  }

  const handleSave = async () => {
    setFeedback(null)

    if (!name.trim()) {
      setFeedback({ type: "error", message: "El nombre del proyecto es obligatorio." })
      return
    }

    // Capturar snapshot síncrono del draft antes de cualquier await
    // para evitar closures stale si hay re-renders durante los awaits.
    const draftSnapshot = draft
    const exclusionsSnapshot = draft?.unitTaskExclusions ?? {}

    const floorsData = (draftSnapshot?.floors || []).map((f) => ({
      id: f.id,
      name: f.name,
      identifier: f.identifier.trim() || null,
      level: f.level || null,
      units: f.units.map((u) => {
        const { room_count, name } = unitTypeToDbFields({
          type: u.type,
          roomCount: u.roomCount,
          officeSize: u.officeSize,
        })

        return {
          id: u.id,
          code: u.code.trim(),
          name,
          unit_type: u.type,
          room_count,
          area_m2: u.squareMeters ? parseFloat(u.squareMeters) : null,
        }
      }),
    }))

    const groupsData = (draftSnapshot?.groups || []).map((g) => ({
      id: g.id,
      name: g.name,
      rubros: g.rubros.map((r) => ({
        id: r.id,
        name: r.name,
        weight_percent: parseRubroWeightInput(r.weightPercent),
        tasks: r.tasks.map((t) => ({
          id: t.id,
          name: t.name,
          default_weight: t.weightPercent ? parseFloat(t.weightPercent) : null,
        })),
      })),
    }))

    setSaving(true)

    // Guardar datos básicos
    const basicResult = await updateProjectBasics({
      projectId: project.id,
      name,
      location,
      startDate,
      endDate,
      totalSurface,
    })

    if (!basicResult.ok) {
      setSaving(false)
      setFeedback({ type: "error", message: basicResult.error })
      return
    }

    // Guardar estructura (pisos y unidades)
    const structureResult = await saveProjectStructure(project.id, floorsData)

    if (!structureResult.ok) {
      setSaving(false)
      setFeedback({ type: "error", message: structureResult.error })
      return
    }

    const unitsWithAssets = (draftSnapshot?.floors ?? []).flatMap((floor) => floor.units)
    const assetUploadResult = await uploadUnitAssetsFromDraft(
      project.id,
      structureResult.unitIdByDraftId,
      unitsWithAssets,
    )
    if (!assetUploadResult.ok) {
      setSaving(false)
      setFeedback({ type: "error", message: assetUploadResult.error })
      return
    }

    for (const unit of unitsWithAssets) {
      const dbUnitId = structureResult.unitIdByDraftId[unit.id] ?? unit.id

      if (unit.planRemoved) {
        const clearResult = await clearUnitPlanPhoto(project.id, dbUnitId)
        if (!clearResult.ok) {
          setSaving(false)
          setFeedback({ type: "error", message: clearResult.error })
          return
        }
      }

      if (unit.renderRemoved) {
        const clearResult = await clearUnitRenderPhoto(project.id, dbUnitId)
        if (!clearResult.ok) {
          setSaving(false)
          setFeedback({ type: "error", message: clearResult.error })
          return
        }
      }
    }

    // Guardar grupos de rubros y tareas
    const rubrosResult = await saveProjectRubros(project.id, groupsData)

    if (!rubrosResult.ok) {
      setSaving(false)
      setFeedback({ type: "error", message: rubrosResult.error })
      return
    }

    const [floors, units, groups, assignments] = await Promise.all([
      getProjectStructure(project.id),
      getProjectUnits(project.id),
      getProjectRubroGroups(project.id),
      getUnitTaskAssignments(project.id),
    ])

    const refreshedDraft = buildConfigDraftFromProjectData({
      projectName: name,
      location,
      floors,
      units,
      groups,
      assignmentsByUnit: assignments.byUnit,
    })

    const remappedExclusions = draftSnapshot
      ? remapUnitTaskExclusions(exclusionsSnapshot, draftSnapshot, refreshedDraft)
      : refreshedDraft.unitTaskExclusions

    const assignmentsResult = await setUnitTaskAssignments(
      project.id,
      exclusionsToAssignments(remappedExclusions, {
        ...refreshedDraft,
        unitTaskExclusions: remappedExclusions,
      }),
    )

    setSaving(false)

    if (assignmentsResult.ok) {
      const savedDraft = {
        ...refreshedDraft,
        unitTaskExclusions: remappedExclusions,
      }
      setDraft(savedDraft)
      setSavedSnapshot(
        buildConfigSnapshot(
          { name, location, totalSurface, startDate, endDate },
          savedDraft,
        ),
      )
      setFeedback({ type: "success", message: "Cambios guardados correctamente." })
    } else {
      setFeedback({ type: "error", message: assignmentsResult.error })
    }
  }

  return (
    <>
      <div
        className={cn("flex flex-col gap-5 pt-6", isDirty && "pb-28")}
        style={{
          maxWidth: CREATE_PROJECT_LAYOUT.contentMaxWidth,
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
        </div>

      {/* Información Básica */}
      <SettingsCard title="Información Básica">
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
                  setFeedback(null)
                }}
                className={basicInputClassName}
                style={basicInputStyle}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <FieldLabel>Superficie total</FieldLabel>
              <Input
                placeholder="Ej: 2.000 m2"
                value={totalSurface}
                onChange={(e) => {
                  setTotalSurface(e.target.value)
                  updateDraft({ totalSurface: e.target.value })
                }}
                className={basicInputClassName}
                style={basicInputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel icon={<CalendarDays className="size-3" aria-hidden />}>Fecha de Inicio *</FieldLabel>
              <DatePicker
                id="config-start-date"
                value={parsedStartDate}
                onChange={(date) => {
                  const nextStartDate = formatDraftDateString(date)
                  setStartDate(nextStartDate)
                  if (date && parsedEndDate && date > parsedEndDate) {
                    setEndDate(nextStartDate)
                  }
                }}
                toDate={parsedEndDate}
                placeholder="Seleccionar fecha"
                popoverSide="bottom"
                className={basicDatePickerClassName}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel icon={<CalendarDays className="size-3" aria-hidden />}>Finalización Estimada *</FieldLabel>
              <DatePicker
                id="config-end-date"
                value={parsedEndDate}
                onChange={(date) => {
                  const nextEndDate = formatDraftDateString(date)
                  setEndDate(nextEndDate)
                  if (date && parsedStartDate && date < parsedStartDate) {
                    setStartDate(nextEndDate)
                  }
                }}
                fromDate={parsedStartDate}
                placeholder="Seleccionar fecha"
                popoverSide="bottom"
                className={basicDatePickerClassName}
              />
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Estructura del edificio */}
      {draft ? (
        <SettingsCard
          title="Estructura del edificio"
          collapsible
          defaultOpen={false}
        >
          <CreateProjectStructureStep
            draft={draft}
            onChange={updateDraft}
            scrollableList
          />
        </SettingsCard>
      ) : null}

      {/* Rubros y Tareas */}
      {draft ? (
        <SettingsCard
          title="Rubros y Tareas"
          collapsible
          defaultOpen={false}
        >
          <CreateProjectTasksStep draft={draft} onChange={updateDraft} scrollableList />
        </SettingsCard>
      ) : null}

      {/* Aplicación de Rubros y Tareas por Unidad Funcional */}
      {draft ? (
        <SettingsCard
          title="Aplicación de Rubros y Tareas por Unidad Funcional"
          collapsible
          defaultOpen={false}
        >
          <CreateProjectUnitTasksStep
            draft={draft}
            onChange={updateDraft}
            scrollableList
          />
        </SettingsCard>
      ) : null}
      </div>

      {isDirty ? (
        <ConfigSaveFooter
          saving={saving}
          feedback={feedback}
          onCancel={handleCancel}
          onSave={handleSave}
        />
      ) : null}
    </>
  )
}
