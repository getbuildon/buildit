"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react"
import { createPortal } from "react-dom"
import { AlertCircle, Building2, CalendarDays, Check, ChevronDown, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { ConfigConfirmDialog } from "./ConfigConfirmDialog"
import { ConfiguracionSectionsSkeleton } from "./ConfiguracionSectionsSkeleton"
import { FieldErrorTooltip } from "@/components/ui/field-error-tooltip"
import {
  createProjectFieldErrorInputClassName,
  createProjectFieldErrorInputStyle,
} from "@/components/projects/new/CreateProjectFormField"
import {
  getConfigBasicsFieldErrors,
  type ConfigBasicsFieldErrors,
} from "@/lib/projects/createProjectBasicValidation"
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
} from "@/lib/projects/unitTaskAssignments"
import {
  buildPreviousAssignmentsForDiff,
} from "@/lib/projects/buildPreviousAssignmentsForDiff"
import {
  emptyRubrosIdMaps,
  refreshConfigDraftAfterSave,
} from "@/lib/projects/refreshConfigDraftAfterSave"
import { CREATE_PROJECT_LAYOUT } from "@/lib/projects/createProjectTokens"
import {
  buildConfigSnapshot,
  buildAssignmentDraftFromSnapshot,
  getConfigDirtySections,
  getConfigSaveConfirmMessage,
  isConfigBasicsDirty,
  isConfigDirty,
  type ConfigBasicsState,
  type ConfigSavedSnapshot,
} from "@/lib/projects/configDirtyState"
import {
  getStructureStepFieldErrors,
  getFirstStructureFieldErrorTarget,
  hasStructureStepFieldErrors,
  type StructureStepFieldErrors,
} from "@/lib/projects/createProjectStructureValidation"
import { PlanSurfaceLimitNotice } from "@/components/projects/new/PlanSurfaceLimitNotice"
import {
  getProjectPlanSurfaceLimitErrorFromDraft,
  isTotalSurfaceOverPlanLimit,
  parseTotalSurfaceM2,
  scrollToStructureSurfaceLimitBanner,
} from "@/lib/projects/structureSurfaceLimits"
import { cn } from "@/lib/utils"
import { AnimatedCollapsible, ANIMATED_COLLAPSE_DURATION_MS } from "@/components/ui/animated-collapsible"
import {
  clearUnitAssetsFromDraft,
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
import {
  countAssignmentRows,
  createConfigSavePerfTrace,
  jsonPayloadBytes,
  summarizeConfigSaveRubros,
  summarizeConfigSaveStructure,
  summarizePendingUnitAssets,
} from "@/lib/observability/configSavePerformanceTrace"

type ConfiguracionViewProps = {
  project: ProjectBasics
  planSurfaceMaxM2?: number | null
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
const CONFIG_SAVE_FOOTER_HEIGHT = 96
const CONFIG_SAVE_FOOTER_SCROLL_GAP = 16

function SettingsCard({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
}: {
  title: string
  children: ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isControlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const open = isControlled ? controlledOpen : internalOpen
  const [mountContent, setMountContent] = useState(() => {
    if (!collapsible) return true
    return isControlled ? Boolean(controlledOpen) : defaultOpen
  })

  useEffect(() => {
    if (open) {
      setMountContent(true)
      return
    }

    const timeout = window.setTimeout(
      () => setMountContent(false),
      ANIMATED_COLLAPSE_DURATION_MS,
    )
    return () => window.clearTimeout(timeout)
  }, [open])

  const setOpen = (next: boolean) => {
    if (next) {
      setMountContent(true)
    }
    if (isControlled) {
      onOpenChange?.(next)
      return
    }
    setInternalOpen(next)
  }

  if (!collapsible) {
    return (
      <section
        className="flex flex-col gap-4 rounded-[16px] border border-[#edeef0] bg-white p-4 sm:gap-5 sm:p-6"
        style={{ boxShadow: CONFIG_CARD_SHADOW }}
      >
        <h2 className="text-[16px] font-normal leading-5 text-[#272a2d] sm:text-[18px]">{title}</h2>
        {children}
      </section>
    )
  }

  return (
    <section
      className="rounded-[16px] border border-[#edeef0] bg-white px-4 py-4 sm:px-6"
      style={{ boxShadow: CONFIG_CARD_SHADOW }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2"
        aria-expanded={open}
      >
        <h2 className="flex-1 text-left text-[16px] font-normal leading-5 text-[#272a2d] sm:text-[18px]">
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
        <div className="mt-5 flex flex-col gap-5">
          {mountContent ? children : null}
        </div>
      </AnimatedCollapsible>
    </section>
  )
}

function FieldLabel({
  icon,
  children,
  error,
}: {
  icon?: ReactNode
  children: ReactNode
  error?: string
}) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[12px] font-normal leading-4 text-[#43484e]">
      {icon ? <span className="shrink-0 text-[#43484e]">{icon}</span> : null}
      <span className="min-w-0">{children}</span>
      {error ? <FieldErrorTooltip message={error} className="ml-auto" /> : null}
    </span>
  )
}

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
  disableSave = false,
  onRequestDiscard,
  onSave,
  align,
}: {
  visible: boolean
  saving: boolean
  errorMessage: string | null
  disableSave?: boolean
  onRequestDiscard: () => void
  onSave: () => void
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
          visible && entered
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
          className="pointer-events-auto w-full overflow-hidden rounded-t-[12px] border border-b-0 border-[#ffeae0] bg-[#fff6f1] px-[25px] py-[17px]"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0 flex flex-col gap-0 leading-[1.4] text-[#111113]">
              <p className="text-[16px] font-medium">Cambios sin guardar</p>
              {errorMessage ? (
                <p className="mt-1 flex items-start gap-1.5 text-[14px] font-normal text-[#b91c1c]">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>{errorMessage}</span>
                </p>
              ) : (
                <p className="text-[14px] font-normal">
                  Guardá para aplicar la configuración del proyecto
                </p>
              )}
            </div>

            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onRequestDiscard}
                disabled={saving}
                className="h-auto min-h-[44px] w-full rounded-[10px] border-[#696e77] bg-transparent px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#363a3f] shadow-none hover:border-[#696e77] hover:bg-[#fff6f1] hover:text-[#272a2d] sm:w-auto"
              >
                Descartar cambios
              </Button>
              <Button
                type="button"
                variant="brand"
                size="brand"
                onClick={onSave}
                disabled={saving || disableSave}
                className="h-auto min-h-[44px] w-full gap-2 rounded-[10px] px-6 py-3 text-[14px] font-normal leading-[1.4] shadow-[0_0_10px_rgba(243,103,31,0.3)] sm:w-auto"
              >
                <Check className="size-4 shrink-0" aria-hidden />
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

export function ConfiguracionView({
  project,
  planSurfaceMaxM2 = null,
}: ConfiguracionViewProps) {
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
  const [structureFieldErrors, setStructureFieldErrors] = useState<StructureStepFieldErrors>({})
  const [basicFieldErrors, setBasicFieldErrors] = useState<ConfigBasicsFieldErrors>({})
  const [structureSectionOpen, setStructureSectionOpen] = useState(false)
  const wasOverSurfaceLimit = useRef(false)

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
  const planSurfaceLimitError = useMemo(() => {
    if (!draft) return null
    return getProjectPlanSurfaceLimitErrorFromDraft(
      { ...draft, totalSurface },
      planSurfaceMaxM2,
    )
  }, [draft, totalSurface, planSurfaceMaxM2])
  const totalSurfaceOverPlan = useMemo(
    () => isTotalSurfaceOverPlanLimit(totalSurface, planSurfaceMaxM2),
    [totalSurface, planSurfaceMaxM2],
  )
  const { mounted: footerMounted, visible: footerVisible } = useAnimatedFooterVisibility(isDirty)
  const contentRef = useRef<HTMLDivElement>(null)
  const footerAlign = useContentFooterAlign(contentRef)
  const footerScrollPadding =
    footerMounted && footerVisible
      ? CONFIG_SAVE_FOOTER_HEIGHT + CONFIG_SAVE_FOOTER_SCROLL_GAP
      : 0
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
    if ("floors" in patch) {
      setStructureFieldErrors({})
    }
  }

  useEffect(() => {
    if (hasStructureStepFieldErrors(structureFieldErrors)) {
      setStructureSectionOpen(true)
    }
  }, [structureFieldErrors])

  const scrollToStructureFieldError = (errors: StructureStepFieldErrors) => {
    const target = getFirstStructureFieldErrorTarget(errors)
    if (!target) return

    requestAnimationFrame(() => {
      const selector = target.unitId
        ? `[data-structure-unit-id="${target.unitId}"]`
        : `[data-structure-floor-id="${target.floorId}"]`
      document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "center" })
    })
  }

  const focusStructureSurfaceLimit = () => {
    setStructureSectionOpen(true)
    scrollToStructureSurfaceLimitBanner({
      delayMs: ANIMATED_COLLAPSE_DURATION_MS + 50,
    })
  }

  useEffect(() => {
    if (!planSurfaceLimitError) {
      wasOverSurfaceLimit.current = false
      return
    }
    if (wasOverSurfaceLimit.current) return
    wasOverSurfaceLimit.current = true
    if (totalSurfaceOverPlan) {
      scrollToStructureSurfaceLimitBanner()
      return
    }
    focusStructureSurfaceLimit()
  }, [planSurfaceLimitError, totalSurfaceOverPlan])

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

  const validateBeforeSave = (): boolean => {
    setFeedback(null)

    const basicsErrors = getConfigBasicsFieldErrors(basicsState)
    if (Object.keys(basicsErrors).length > 0) {
      setBasicFieldErrors(basicsErrors)
      document
        .getElementById("config-basic-info")
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
      return false
    }
    setBasicFieldErrors({})

    if (!draft) return false

    const draftForValidation = {
      ...draft,
      projectName: name,
      location,
      totalSurface,
      startDate,
      endDate,
    }

    const structureErrors = getStructureStepFieldErrors(draftForValidation)
    if (hasStructureStepFieldErrors(structureErrors)) {
      setStructureFieldErrors(structureErrors)
      setStructureSectionOpen(true)
      scrollToStructureFieldError(structureErrors)
      return false
    }
    setStructureFieldErrors({})

    const surfaceLimitError = getProjectPlanSurfaceLimitErrorFromDraft(
      draftForValidation,
      planSurfaceMaxM2,
    )
    if (surfaceLimitError) {
      if (isTotalSurfaceOverPlanLimit(totalSurface, planSurfaceMaxM2)) {
        scrollToStructureSurfaceLimitBanner()
      } else {
        setStructureSectionOpen(true)
        focusStructureSurfaceLimit()
      }
      return false
    }

    return true
  }

  const handleSave = async (): Promise<boolean> => {
    if (!validateBeforeSave()) {
      return false
    }

    // Capturar snapshot síncrono del draft antes de cualquier await
    const draftSnapshot = draft
    const snapshotAtSave = savedSnapshot
    const exclusionsSnapshot = draft?.unitTaskExclusions ?? {}
    const currentBasics: ConfigBasicsState = {
      name,
      location,
      totalSurface,
      startDate,
      endDate,
    }
    const basicsDirty = isConfigBasicsDirty(currentBasics, snapshotAtSave)
    const dirtySections = getConfigDirtySections(currentBasics, draftSnapshot, snapshotAtSave)
    const structureDirty = dirtySections.floors
    const rubrosDirty = dirtySections.groups
    const exclusionsDirty = dirtySections.exclusions

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

    const structureSummary = summarizeConfigSaveStructure(floorsData)
    const rubrosSummary = summarizeConfigSaveRubros(groupsData)
    const unitsWithAssets = (draftSnapshot?.floors ?? []).flatMap((floor) => floor.units)
    const assetsSummary = summarizePendingUnitAssets(unitsWithAssets)

    const perf = createConfigSavePerfTrace(project.id)
    perf.setPayload({
      floors: structureSummary.floorCount,
      units: structureSummary.unitCount,
      groups: rubrosSummary.groupCount,
      rubros: rubrosSummary.rubroCount,
      tasks: rubrosSummary.taskCount,
      assetUploads: assetsSummary.uploadCount,
      assetClears: assetsSummary.clearCount,
      floorsPayloadKb: Math.round(jsonPayloadBytes(floorsData) / 1024),
      rubrosPayloadKb: Math.round(jsonPayloadBytes(groupsData) / 1024),
      exclusionsPayloadKb: Math.round(jsonPayloadBytes(exclusionsSnapshot) / 1024),
    })

    setSaving(true)

    if (basicsDirty) {
      const basicResult = await updateProjectBasics({
        projectId: project.id,
        name,
        location,
        startDate,
        endDate,
        totalSurface,
      })
      perf.step("basics")

      if (!basicResult.ok) {
        setSaving(false)
        setFeedback({ type: "error", message: basicResult.error })
        perf.finish(false)
        return false
      }
    } else {
      perf.step("basics", { skipped: true })
    }

    // Guardar estructura (pisos y unidades)
    let floorIdByDraftId: Record<string, string> = {}
    let unitIdByDraftId: Record<string, string> = {}

    if (structureDirty) {
      const structureResult = await saveProjectStructure(project.id, floorsData)
      perf.step("structure", {
        mappedUnits: Object.keys(structureResult.ok ? structureResult.unitIdByDraftId : {}).length,
      })

      if (!structureResult.ok) {
        setSaving(false)
        const structureErrorsOnFailure = getStructureStepFieldErrors({
          ...draftSnapshot!,
          projectName: name,
          location,
          totalSurface,
          startDate,
          endDate,
        })
        if (hasStructureStepFieldErrors(structureErrorsOnFailure)) {
          setStructureFieldErrors(structureErrorsOnFailure)
          setStructureSectionOpen(true)
          scrollToStructureFieldError(structureErrorsOnFailure)
          setSaveDialogOpen(false)
        } else {
          setFeedback({ type: "error", message: structureResult.error })
        }
        perf.finish(false)
        return false
      }

      floorIdByDraftId = structureResult.floorIdByDraftId
      unitIdByDraftId = structureResult.unitIdByDraftId
    } else {
      perf.step("structure", { skipped: true })
      for (const floor of draftSnapshot?.floors ?? []) {
        floorIdByDraftId[floor.id] = floor.id
        for (const unit of floor.units) {
          unitIdByDraftId[unit.id] = unit.id
        }
      }
    }

    let unitAssetUpdates = {}

    if (structureDirty || assetsSummary.uploadCount > 0 || assetsSummary.clearCount > 0) {
      const assetUploadResult = await uploadUnitAssetsFromDraft(
        project.id,
        unitIdByDraftId,
        unitsWithAssets,
      )
      perf.step("unitAssets.upload", {
        skipped: assetsSummary.uploadCount === 0,
      })

      if (!assetUploadResult.ok) {
        setSaving(false)
        setFeedback({ type: "error", message: assetUploadResult.error })
        perf.finish(false)
        return false
      }

      unitAssetUpdates = assetUploadResult.assetUpdates

      const assetClearResult = await clearUnitAssetsFromDraft(
        project.id,
        unitIdByDraftId,
        unitsWithAssets,
      )
      perf.step("unitAssets.clear", {
        clearedAssets: assetClearResult.ok ? assetClearResult.clearedAssets : 0,
        skipped: assetsSummary.clearCount === 0,
      })

      if (!assetClearResult.ok) {
        setSaving(false)
        setFeedback({ type: "error", message: assetClearResult.error })
        perf.finish(false)
        return false
      }

      unitAssetUpdates = {
        ...unitAssetUpdates,
        ...assetClearResult.assetUpdates,
      }
    } else {
      perf.step("unitAssets.upload", { skipped: true })
      perf.step("unitAssets.clear", { skipped: true, clearedAssets: 0 })
    }

    let rubrosIdMaps = emptyRubrosIdMaps()

    if (rubrosDirty) {
      const rubrosResult = await saveProjectRubros(project.id, groupsData)
      perf.step("rubros")

      if (!rubrosResult.ok) {
        setSaving(false)
        setFeedback({ type: "error", message: rubrosResult.error })
        perf.finish(false)
        return false
      }

      rubrosIdMaps = {
        groupIdByDraftId: rubrosResult.groupIdByDraftId,
        rubroIdByDraftId: rubrosResult.rubroIdByDraftId,
        taskIdByDraftId: rubrosResult.taskIdByDraftId,
      }
    } else {
      perf.step("rubros", { skipped: true })
      if (draftSnapshot) {
        for (const group of draftSnapshot.groups) {
          rubrosIdMaps.groupIdByDraftId[group.id] = group.id
          for (const rubro of group.rubros) {
            rubrosIdMaps.rubroIdByDraftId[rubro.id] = rubro.id
            for (const task of rubro.tasks) {
              rubrosIdMaps.taskIdByDraftId[task.id] = task.id
            }
          }
        }
      }
    }

    const refreshedDraft = draftSnapshot
      ? refreshConfigDraftAfterSave(draftSnapshot, {
          projectName: name,
          location,
          structureMaps: { floorIdByDraftId, unitIdByDraftId },
          rubrosMaps: rubrosIdMaps,
          unitAssets: unitAssetUpdates,
        })
      : null

    perf.step("reload", { skipped: true, local: true })

    if (!refreshedDraft) {
      setSaving(false)
      perf.finish(false)
      return false
    }

    const assignmentsPayload = exclusionsToAssignments(
      refreshedDraft.unitTaskExclusions,
      refreshedDraft,
    )

    perf.setPayload({
      assignmentRows: countAssignmentRows(assignmentsPayload),
      assignmentsPayloadKb: Math.round(jsonPayloadBytes(assignmentsPayload) / 1024),
    })

    if (exclusionsDirty) {
      const previousAssignments =
        snapshotAtSave && draftSnapshot
          ? buildPreviousAssignmentsForDiff(
              snapshotAtSave,
              draftSnapshot,
              currentBasics,
              refreshedDraft,
              {
                structureSynced: structureDirty,
                rubrosSynced: rubrosDirty,
              },
            )
          : {}

      const assignmentsResult = await setUnitTaskAssignments(
        project.id,
        assignmentsPayload,
        previousAssignments,
      )
      perf.step("assignments", {
        inserted: assignmentsResult.ok ? assignmentsResult.inserted : 0,
        deleted: assignmentsResult.ok ? assignmentsResult.deleted : 0,
        unchanged: assignmentsResult.ok ? assignmentsResult.unchanged : 0,
      })

      if (!assignmentsResult.ok) {
        setSaving(false)
        setFeedback({ type: "error", message: assignmentsResult.error })
        perf.finish(false)
        return false
      }
    } else {
      perf.step("assignments", { skipped: true })
    }

    setSaving(false)
    setDraft(refreshedDraft)
    setSavedSnapshot(
      buildConfigSnapshot(
        { name, location, totalSurface, startDate, endDate },
        refreshedDraft,
      ),
    )
    toast.success("Cambios guardados correctamente.")
    setFeedback(null)
    perf.finish(true)
    return true
  }

  const handleConfirmSave = async () => {
    const saved = await handleSave()
    if (saved) {
      setSaveDialogOpen(false)
    }
  }

  return (
    <>
      <div
        ref={contentRef}
        className="mx-auto flex w-full flex-col"
        style={{
          maxWidth: CREATE_PROJECT_LAYOUT.contentMaxWidth,
        }}
      >
        <div
          className="flex flex-col gap-4 sm:gap-5"
          style={{ paddingBottom: footerScrollPadding }}
        >
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="font-recoleta text-[26px] font-normal leading-tight text-[#272a2d] sm:text-[28px]">
            Configuración del Proyecto
          </h1>
          <p className="text-[14px] leading-5 text-[#43484e]">
            Administra la estructura, rubros y equipo del proyecto.
          </p>
        </div>

      {/* Información Básica */}
      <SettingsCard title="Información Básica">
        <div id="config-basic-info" className="flex flex-col gap-4">
          {totalSurfaceOverPlan && planSurfaceMaxM2 != null ? (
            <PlanSurfaceLimitNotice
              planSurfaceMaxM2={planSurfaceMaxM2}
              projectId={project.id}
              reportedSurfaceM2={parseTotalSurfaceM2(totalSurface) ?? 0}
            />
          ) : null}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-[10px] bg-[#ff7433] sm:size-20">
              <Building2 className="size-8 text-white sm:size-10" aria-hidden />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <FieldLabel error={basicFieldErrors.projectName}>Nombre del Proyecto *</FieldLabel>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  updateDraft({ projectName: e.target.value })
                  setFeedback(null)
                  if (basicFieldErrors.projectName) {
                    setBasicFieldErrors((current) => ({ ...current, projectName: undefined }))
                  }
                }}
                className={cn(
                  basicInputClassName,
                  basicFieldErrors.projectName && createProjectFieldErrorInputClassName,
                )}
                style={
                  basicFieldErrors.projectName
                    ? { ...basicInputStyle, ...createProjectFieldErrorInputStyle }
                    : basicInputStyle
                }
                aria-invalid={Boolean(basicFieldErrors.projectName)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <FieldLabel icon={<MapPin className="size-3" aria-hidden />} error={basicFieldErrors.location}>
                Ubicación *
              </FieldLabel>
              <Input
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value)
                  updateDraft({ location: e.target.value })
                  if (basicFieldErrors.location) {
                    setBasicFieldErrors((current) => ({ ...current, location: undefined }))
                  }
                }}
                className={cn(
                  basicInputClassName,
                  basicFieldErrors.location && createProjectFieldErrorInputClassName,
                )}
                style={
                  basicFieldErrors.location
                    ? { ...basicInputStyle, ...createProjectFieldErrorInputStyle }
                    : basicInputStyle
                }
                aria-invalid={Boolean(basicFieldErrors.location)}
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
              <FieldLabel icon={<CalendarDays className="size-3" aria-hidden />} error={basicFieldErrors.startDate}>
                Fecha de Inicio *
              </FieldLabel>
              <DatePicker
                id="config-start-date"
                value={parsedStartDate}
                onChange={(date) => {
                  const nextStartDate = formatDraftDateString(date)
                  setStartDate(nextStartDate)
                  if (date && parsedEndDate && date > parsedEndDate) {
                    setEndDate(nextStartDate)
                  }
                  if (basicFieldErrors.startDate) {
                    setBasicFieldErrors((current) => ({ ...current, startDate: undefined }))
                  }
                }}
                toDate={parsedEndDate}
                placeholder="Seleccionar fecha"
                popoverSide="bottom"
                className={cn(
                  basicDatePickerClassName,
                  basicFieldErrors.startDate && createProjectFieldErrorInputClassName,
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel icon={<CalendarDays className="size-3" aria-hidden />} error={basicFieldErrors.endDate}>
                Finalización Estimada *
              </FieldLabel>
              <DatePicker
                id="config-end-date"
                value={parsedEndDate}
                onChange={(date) => {
                  const nextEndDate = formatDraftDateString(date)
                  setEndDate(nextEndDate)
                  if (date && parsedStartDate && date < parsedStartDate) {
                    setStartDate(nextEndDate)
                  }
                  if (basicFieldErrors.endDate) {
                    setBasicFieldErrors((current) => ({ ...current, endDate: undefined }))
                  }
                }}
                fromDate={parsedStartDate}
                placeholder="Seleccionar fecha"
                popoverSide="bottom"
                className={cn(
                  basicDatePickerClassName,
                  basicFieldErrors.endDate && createProjectFieldErrorInputClassName,
                )}
              />
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Estructura, rubros y asignaciones por unidad */}
      {draft ? (
        <>
          <SettingsCard
            title="Estructura del edificio"
            collapsible
            open={structureSectionOpen}
            onOpenChange={setStructureSectionOpen}
          >
            <CreateProjectStructureStep
              draft={draft}
              onChange={updateDraft}
              fieldErrors={structureFieldErrors}
              projectId={project.id}
              planSurfaceMaxM2={planSurfaceMaxM2}
            />
          </SettingsCard>

          <SettingsCard
            title="Rubros y Tareas"
            collapsible
            defaultOpen={false}
          >
            <CreateProjectTasksStep draft={draft} onChange={updateDraft} />
          </SettingsCard>

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
        </>
      ) : (
        <ConfiguracionSectionsSkeleton />
      )}
        </div>
      </div>

      {footerMounted ? (
        <ConfigSaveFooter
          visible={footerVisible}
          saving={saving}
          errorMessage={errorMessage}
          onRequestDiscard={() => setDiscardDialogOpen(true)}
          onSave={() => {
            if (!validateBeforeSave()) return
            setSaveDialogOpen(true)
          }}
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
        cancelLabel="Seguir editando"
        loading={saving}
        onConfirm={() => void handleConfirmSave()}
      />

      <ConfigConfirmDialog
        open={discardDialogOpen}
        onOpenChange={setDiscardDialogOpen}
        title="¿Descartar cambios?"
        description="Se perderán todos los cambios no guardados en la configuración del proyecto. ¿Deseás continuar?"
        confirmLabel="Descartar cambios"
        cancelLabel="Seguir editando"
        onConfirm={handleConfirmDiscard}
      />
    </>
  )
}
