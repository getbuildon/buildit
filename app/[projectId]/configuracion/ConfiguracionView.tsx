"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react"
import { createPortal } from "react-dom"
import { AlertCircle, Building2, CalendarDays, Check, ChevronDown, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { ConfigConfirmDialog } from "./ConfigConfirmDialog"
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
import { SHELL_LAYOUT } from "@/lib/project/designTokens"
import {
  buildConfigSnapshot,
  getConfigSaveConfirmMessage,
  isConfigDirty,
  type ConfigBasicsState,
  type ConfigSavedSnapshot,
} from "@/lib/projects/configDirtyState"
import { cn } from "@/lib/utils"
import { AnimatedCollapsible } from "@/components/ui/animated-collapsible"
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

function useAnimatedFooterVisibility(isDirty: boolean) {
  const [mounted, setMounted] = useState(isDirty)
  const [visible, setVisible] = useState(isDirty)

  useEffect(() => {
    if (isDirty) {
      setMounted(true)
      const frame = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(frame)
    }

    setVisible(false)
    const timeout = window.setTimeout(
      () => setMounted(false),
      CONFIG_SAVE_FOOTER_ANIMATION_MS,
    )
    return () => window.clearTimeout(timeout)
  }, [isDirty])

  return { mounted, visible }
}

// Inputs de la card Información Básica — Figma 1226:6422: 42px, r10, borde #e2e8f0
const basicInputClassName =
  "h-[42px] w-full rounded-[10px] border bg-white px-3 text-[14px] font-normal leading-5 text-[#0a0a0a] shadow-none placeholder:text-[#777b84] focus-visible:border-[#ff7433] focus-visible:ring-0"
const basicInputStyle = { borderColor: "#e2e8f0" } as const
const basicDatePickerClassName = cn(basicInputClassName, "border-[#e2e8f0] text-left")

const CONFIG_CARD_SHADOW = "0 0 10px rgba(243, 103, 31, 0.08)" as const

const CONFIG_SAVE_FOOTER_ANIMATION_MS = 320

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
        style={{ boxShadow: CONFIG_CARD_SHADOW }}
      >
        <h2 className="text-[18px] font-normal leading-5 text-[#272a2d]">{title}</h2>
        {children}
      </section>
    )
  }

  return (
    <section
      className="rounded-[16px] border border-[#edeef0] bg-white px-6 py-4"
      style={{ boxShadow: CONFIG_CARD_SHADOW }}
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
          className={cn(
            "size-4 shrink-0 text-[#43484e] transition-transform duration-300 ease-in-out",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <AnimatedCollapsible open={open}>
        <div className="mt-5 flex flex-col gap-5">{children}</div>
      </AnimatedCollapsible>
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

const CONFIG_SAVE_FOOTER_SCROLL_GAP = 20
const CONFIG_SAVE_FOOTER_FALLBACK_HEIGHT = 88

type FooterAlign = {
  left: number
  width: number
}

function useContentFooterAlign(contentRef: RefObject<HTMLDivElement | null>) {
  const [align, setAlign] = useState<FooterAlign | null>(null)

  useEffect(() => {
    const node = contentRef.current
    if (!node) return

    const update = () => {
      const rect = node.getBoundingClientRect()
      const next = {
        left: Math.round(rect.left),
        width: Math.round(rect.width),
      }

      setAlign((current) => {
        if (
          current &&
          current.left === next.left &&
          current.width === next.width
        ) {
          return current
        }
        return next
      })
    }

    update()

    const observer = new ResizeObserver(update)
    observer.observe(node)

    const layoutRoot = node.closest("main")
    if (layoutRoot instanceof HTMLElement) {
      observer.observe(layoutRoot)
    }

    window.addEventListener("resize", update)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", update)
    }
  }, [contentRef])

  return align
}

function ConfigSaveFooter({
  visible,
  saving,
  errorMessage,
  onRequestDiscard,
  onSave,
  onHeightChange,
  align,
}: {
  visible: boolean
  saving: boolean
  errorMessage: string | null
  onRequestDiscard: () => void
  onSave: () => void
  onHeightChange?: (height: number) => void
  align: FooterAlign | null
}) {
  const footerRef = useRef<HTMLDivElement>(null)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    setPortalTarget(document.body)
  }, [])

  useLayoutEffect(() => {
    if (!visible) {
      setEntered(false)
      return
    }

    if (!align || entered) return

    setEntered(false)
    let innerFrame = 0
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        setEntered(true)
      })
    })

    return () => {
      cancelAnimationFrame(outerFrame)
      cancelAnimationFrame(innerFrame)
    }
  }, [align, entered, visible])

  useLayoutEffect(() => {
    const node = footerRef.current
    if (!node || !visible) return
    onHeightChange?.(node.getBoundingClientRect().height)
  }, [align, entered, onHeightChange, visible])

  useEffect(() => {
    const node = footerRef.current
    if (!node) return

    if (!visible) {
      const timeout = window.setTimeout(() => {
        onHeightChange?.(0)
      }, CONFIG_SAVE_FOOTER_ANIMATION_MS)
      return () => window.clearTimeout(timeout)
    }

    const reportHeight = () => {
      onHeightChange?.(node.getBoundingClientRect().height)
    }

    reportHeight()

    const observer = new ResizeObserver(reportHeight)
    observer.observe(node)
    return () => observer.disconnect()
  }, [onHeightChange, visible])

  if (!portalTarget || !align) return null

  return createPortal(
    <div
      aria-hidden={!visible}
      className="pointer-events-none fixed bottom-0 z-50"
      style={{
        left: align.left,
        width: align.width,
      }}
    >
      <div
        className={cn(
          "transition-[transform,opacity] ease-out will-change-transform",
          entered
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-full opacity-0",
        )}
        style={{
          transitionDuration: `${CONFIG_SAVE_FOOTER_ANIMATION_MS}ms`,
        }}
      >
        <section
          ref={footerRef}
          data-viewport-bottom-inset={visible ? "" : undefined}
          className="pointer-events-auto w-full overflow-hidden rounded-t-[16px] border border-b-0 border-[#d8d9db] bg-[#edeef0] px-6 py-4 shadow-[0_-8px_24px_rgba(24,25,27,0.08)]"
        >
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {errorMessage ? (
              <span className="mr-auto flex items-center gap-1.5 text-[13px] leading-4 text-[#b91c1c]">
                <AlertCircle className="size-3.5 shrink-0" aria-hidden />
                {errorMessage}
              </span>
            ) : (
              <div className="mr-auto flex min-w-0 items-center gap-2.5">
                <span className="size-2 shrink-0 rounded-full bg-[#696e77]" aria-hidden />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium leading-4 text-[#272a2d]">
                    Cambios sin guardar
                  </p>
                  <p className="hidden text-[12px] leading-4 text-[#777b84] sm:block">
                    Guardá para aplicar la configuración del proyecto
                  </p>
                </div>
              </div>
            )}

            <div className="flex w-full flex-wrap items-center justify-end gap-2.5 sm:w-auto sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onRequestDiscard}
                disabled={saving}
                className="h-11 rounded-[10px] border-[#afb3ba] bg-white px-4 text-[14px] font-medium text-[#43484e] shadow-none hover:border-[#696e77] hover:bg-[#f4f5f6] hover:text-[#272a2d]"
              >
                Descartar cambios
              </Button>
              <Button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="inline-flex h-11 min-w-[168px] items-center justify-center gap-2 rounded-[10px] border border-[#43484e] bg-[#43484e] px-4 text-[14px] font-medium text-white shadow-none transition-colors hover:border-[#363a3f] hover:bg-[#363a3f] disabled:pointer-events-none disabled:opacity-50"
              >
                <Check className="size-4" aria-hidden />
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>,
    portalTarget,
  )
}

export function ConfiguracionView({ project }: ConfiguracionViewProps) {
  const toast = useToast()
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
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

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
  const saveConfirmMessage = useMemo(
    () => getConfigSaveConfirmMessage(basicsState, draft, savedSnapshot),
    [basicsState, draft, savedSnapshot],
  )
  const { mounted: footerMounted, visible: footerVisible } = useAnimatedFooterVisibility(isDirty)
  const [footerHeight, setFooterHeight] = useState(0)
  const footerContentInset = useMemo(() => {
    if (!footerMounted) {
      return Number.parseInt(SHELL_LAYOUT.contentPadding, 10) || 24
    }

    return (
      Math.max(footerHeight, CONFIG_SAVE_FOOTER_FALLBACK_HEIGHT) +
      CONFIG_SAVE_FOOTER_SCROLL_GAP
    )
  }, [footerHeight, footerMounted])
  const contentRef = useRef<HTMLDivElement>(null)
  const footerAlign = useContentFooterAlign(contentRef)
  const errorMessage = feedback?.type === "error" ? feedback.message : null

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
    setDiscardDialogOpen(false)
    applySavedBasics(savedSnapshot.basics)
    await loadProjectData(savedSnapshot.basics, { updateSnapshot: false })
  }

  const handleConfirmDiscard = () => {
    void handleCancel()
  }

  const handleSave = async (): Promise<boolean> => {
    setFeedback(null)

    if (!name.trim()) {
      setFeedback({ type: "error", message: "El nombre del proyecto es obligatorio." })
      return false
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
      return false
    }

    // Guardar estructura (pisos y unidades)
    const structureResult = await saveProjectStructure(project.id, floorsData)

    if (!structureResult.ok) {
      setSaving(false)
      setFeedback({ type: "error", message: structureResult.error })
      return false
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
      return false
    }

    for (const unit of unitsWithAssets) {
      const dbUnitId = structureResult.unitIdByDraftId[unit.id] ?? unit.id

      if (unit.planRemoved) {
        const clearResult = await clearUnitPlanPhoto(project.id, dbUnitId)
        if (!clearResult.ok) {
          setSaving(false)
          setFeedback({ type: "error", message: clearResult.error })
          return false
        }
      }

      if (unit.renderRemoved) {
        const clearResult = await clearUnitRenderPhoto(project.id, dbUnitId)
        if (!clearResult.ok) {
          setSaving(false)
          setFeedback({ type: "error", message: clearResult.error })
          return false
        }
      }
    }

    // Guardar grupos de rubros y tareas
    const rubrosResult = await saveProjectRubros(project.id, groupsData)

    if (!rubrosResult.ok) {
      setSaving(false)
      setFeedback({ type: "error", message: rubrosResult.error })
      return false
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
      toast.success("Cambios guardados correctamente.")
      setFeedback(null)
      return true
    }

    setFeedback({ type: "error", message: assignmentsResult.error })
    return false
  }

  const handleConfirmSave = async () => {
    await handleSave()
    setSaveDialogOpen(false)
  }

  return (
    <>
      <div
        ref={contentRef}
        className="mx-auto flex min-h-full w-full flex-col"
        style={{
          maxWidth: CREATE_PROJECT_LAYOUT.contentMaxWidth,
        }}
      >
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
          <CreateProjectTasksStep draft={draft} onChange={updateDraft} />
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
          />
        </SettingsCard>
      ) : null}

          <div
            aria-hidden
            className="shrink-0"
            style={{ height: footerContentInset }}
          />
        </div>
      </div>

      {footerMounted ? (
        <ConfigSaveFooter
          visible={footerVisible}
          saving={saving}
          errorMessage={errorMessage}
          onRequestDiscard={() => setDiscardDialogOpen(true)}
          onSave={() => setSaveDialogOpen(true)}
          onHeightChange={setFooterHeight}
          align={footerAlign}
        />
      ) : null}

      <ConfigConfirmDialog
        open={saveDialogOpen}
        onOpenChange={(open) => {
          if (saving) return
          setSaveDialogOpen(open)
        }}
        title="Confirmar cambios"
        description={saveConfirmMessage}
        confirmLabel="Confirmar"
        loading={saving}
        onConfirm={() => void handleConfirmSave()}
      />

      <ConfigConfirmDialog
        open={discardDialogOpen}
        onOpenChange={setDiscardDialogOpen}
        title="¿Descartar cambios?"
        description="Se perderán todos los cambios no guardados en la configuración del proyecto. ¿Deseás continuar?"
        confirmLabel="Descartar cambios"
        onConfirm={handleConfirmDiscard}
      />
    </>
  )
}
