"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react"
import { createPortal } from "react-dom"
import { Building2, Check, ChevronDown, CircleAlert, MapPin, WifiOff } from "lucide-react"
import { CompanyLogoMark } from "@/components/company/CompanyLogoMark"
import { useToast } from "@/components/ui/toast"
import { RequestPlanUpgradeModal } from "@/components/team/RequestPlanUpgradeModal"
import { Button, Icon, Input } from "@/library/atoms"
import { DatePicker, Field, InputGroup, Notice } from "@/library/molecules"
import { cn } from "@/library/lib/cn"
import { AVISO_SIN_SENAL_PARA_GUARDAR, useEnLinea } from "@/lib/api/useEnLinea"
import { invalidateProjectQueries } from "@/lib/project/invalidateProjectQueries"
import { ConfigConfirmDialog } from "./ConfigConfirmDialog"
import { ConfiguracionSectionsSkeleton } from "./ConfiguracionSectionsSkeleton"
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
import { useProjectMobileMenuOpen } from "@/components/project-shell/ProjectMobileMenuContext"
import {
  buildConfigSnapshot,
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
import {
  formatSquareMeters,
  getProjectPlanSurfaceLimitErrorFromDraft,
  isTotalSurfaceOverPlanLimit,
  parseTotalSurfaceM2,
  scrollToStructureSurfaceLimitBanner,
} from "@/lib/projects/structureSurfaceLimits"
import {
  finalizeTotalSurfaceInput,
  normalizeTotalSurfaceInput,
} from "@/lib/projects/totalSurfaceInput"
import { AnimatedCollapsible, ANIMATED_COLLAPSE_DURATION_MS } from "@/components/ui/animated-collapsible"
import {
  clearUnitAssetsFromDraft,
  uploadUnitAssetsFromDraft,
} from "@/lib/projects/unitPlanPhoto.client"
import {
  updateProjectBasics,
  getConfigPageData,
  saveProjectStructure,
  saveProjectRubros,
  setUnitTaskAssignments,
  type FloorData,
  type ProjectBasics,
  type RubroGroupData,
  type UnitData,
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
  initialFloors: FloorData[]
  initialUnits: UnitData[]
  initialGroups: RubroGroupData[]
  initialAssignmentsByUnit: Record<string, string[]>
}

type SaveFeedback = { type: "success" | "error"; message: string } | null

function useAnimatedFooterVisibility(isDirty: boolean) {
  const [mounted, setMounted] = useState(isDirty)
  const [visible, setVisible] = useState(isDirty)
  const [prevDirty, setPrevDirty] = useState(isDirty)

  // Al cambiar isDirty: si hay cambios se monta la barra; si no, se empieza a esconder.
  if (prevDirty !== isDirty) {
    setPrevDirty(isDirty)
    if (isDirty) {
      setMounted(true)
    } else {
      setVisible(false)
    }
  }

  useEffect(() => {
    if (isDirty) {
      const frame = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(frame)
    }

    // Se desmonta cuando termina la animación de salida.
    const timeout = window.setTimeout(
      () => setMounted(false),
      CONFIG_SAVE_FOOTER_ANIMATION_MS,
    )
    return () => window.clearTimeout(timeout)
  }, [isDirty])

  return { mounted, visible }
}


const CONFIG_SAVE_FOOTER_ANIMATION_MS = 320
const CONFIG_SAVE_FOOTER_HEIGHT = 96
const CONFIG_SAVE_FOOTER_SCROLL_GAP = 16

/**
 * Tarjeta de cada sección de la configuración. Las plegables arman su contenido
 * recién al abrirse y lo desarman cuando termina la animación de cierre.
 */
function SettingsCard({
  id,
  title,
  children,
  collapsible = false,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
}: {
  id: string
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

  // Al abrirse (también desde afuera, por ejemplo por un error) se arma el contenido.
  if (open && !mountContent) {
    setMountContent(true)
  }

  useEffect(() => {
    if (open) return

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

  const titleId = `${id}-titulo`
  const contentId = `${id}-contenido`

  if (!collapsible) {
    return (
      <section
        aria-labelledby={titleId}
        className="flex flex-col gap-5 rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block"
      >
        <h2 id={titleId} className="text-reading">
          {title}
        </h2>
        {children}
      </section>
    )
  }

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block"
    >
      <h2 id={titleId} className="text-reading">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={contentId}
          className="focus-ring flex w-full cursor-pointer items-center gap-compact rounded-box text-left"
        >
          <span className="flex-1">{title}</span>
          <Icon
            icon={ChevronDown}
            className={cn(
              "text-ink-muted transition-transform duration-(--duration-base)",
              open && "rotate-180",
            )}
          />
        </button>
      </h2>
      <AnimatedCollapsible open={open}>
        <div id={contentId} className="mt-5 flex flex-col gap-5">
          {mountContent ? children : null}
        </div>
      </AnimatedCollapsible>
    </section>
  )
}

/**
 * Aviso de que la superficie total supera la del plan, con el pedido de mejora.
 * El atributo data-structure-surface-limit-banner es el que busca el scroll al aviso.
 */
function PlanSurfaceLimitNotice({
  planSurfaceMaxM2,
  projectId,
  reportedSurfaceM2,
}: {
  planSurfaceMaxM2: number
  projectId: string
  reportedSurfaceM2: number
}) {
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  return (
    <>
      <div data-structure-surface-limit-banner>
        <Notice
          tone="info"
          title={`Superaste la superficie permitida por tu plan (${formatSquareMeters(planSurfaceMaxM2)}).`}
          action={
            <Button variant="outline" size="compact" onClick={() => setUpgradeModalOpen(true)}>
              Mejorar plan
            </Button>
          }
        >
          Para agregar más metros cuadrados, pedile una mejora del plan al administrador de
          la organización.
        </Notice>
      </div>
      <RequestPlanUpgradeModal
        projectId={projectId}
        surfaceLimit={{
          planSurfaceMaxM2,
          unitsSurfaceM2: reportedSurfaceM2,
        }}
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
      />
    </>
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

/**
 * Barra de "Cambios sin guardar": aparece abajo cuando hay cambios, alineada con el
 * contenido de la página, y se esconde mientras está abierto el menú del celular.
 * Sin señal se puede seguir editando, pero no guardar.
 */
/** Para saber si ya estamos en el cliente (el portal necesita document). */
const subscribeNothing = () => () => {}

function ConfigSaveFooter({
  visible,
  saving,
  errorMessage,
  disableSave = false,
  offline,
  onRequestDiscard,
  onSave,
  align,
}: {
  visible: boolean
  saving: boolean
  errorMessage: string | null
  disableSave?: boolean
  offline: boolean
  onRequestDiscard: () => void
  onSave: () => void
  align: FooterAlign | null
}) {
  const footerRef = useRef<HTMLDivElement>(null)
  const isClient = useSyncExternalStore(subscribeNothing, () => true, () => false)
  const portalTarget = isClient ? document.body : null
  const [entered, setEntered] = useState(false)
  const mobileMenuOpen = useProjectMobileMenuOpen()
  const showFooter = visible && !mobileMenuOpen

  // Al esconderse vuelve al estado de entrada, para animar la próxima vez que aparezca.
  if (!showFooter && entered) {
    setEntered(false)
  }

  useLayoutEffect(() => {
    if (!showFooter || !align || entered) return

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
  }, [align, entered, showFooter])

  if (!portalTarget || !align) return null

  return createPortal(
    <div
      aria-hidden={!showFooter}
      className="pointer-events-none fixed bottom-0 z-(--z-sticky)"
      style={{
        left: align.left,
        width: align.width,
      }}
    >
      <div
        className={cn(
          "transition-[transform,opacity] ease-out will-change-transform",
          showFooter && entered
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-full opacity-0",
        )}
        style={{
          transitionDuration: `${CONFIG_SAVE_FOOTER_ANIMATION_MS}ms`,
        }}
      >
        <section
          ref={footerRef}
          aria-label="Cambios sin guardar"
          data-viewport-bottom-inset={showFooter ? "" : undefined}
          className="pointer-events-auto flex w-full flex-col gap-compact overflow-hidden rounded-t-control border border-b-0 border-action/20 bg-action-soft px-block py-group text-ink"
        >
          <div className="flex w-full items-center justify-end gap-compact sm:justify-between sm:gap-block">
            <div className="hidden min-w-0 flex-col sm:flex" aria-live="polite">
              <p className="text-reading font-medium">Cambios sin guardar</p>
              {errorMessage ? (
                <p className="mt-related flex items-start gap-related text-body text-fn-danger">
                  <Icon icon={CircleAlert} size="xs" className="mt-1" />
                  <span>{errorMessage}</span>
                </p>
              ) : offline ? (
                <p className="flex items-start gap-related text-body">
                  <Icon icon={WifiOff} size="xs" className="mt-1" />
                  <span>{AVISO_SIN_SENAL_PARA_GUARDAR}</span>
                </p>
              ) : (
                <p className="text-body">Guardá para aplicar la configuración del proyecto</p>
              )}
            </div>

            <div className="flex w-full min-w-0 shrink-0 items-center gap-compact sm:w-auto sm:justify-end">
              <Button
                variant="outline"
                onClick={onRequestDiscard}
                disabled={saving}
                className="min-w-0 flex-1 sm:flex-none"
              >
                Descartar cambios
              </Button>
              <Button
                onClick={onSave}
                loading={saving}
                loadingLabel="Guardando…"
                disabled={disableSave || offline}
                className="min-w-0 flex-1 sm:flex-none"
              >
                <Icon icon={Check} />
                {saving ? "Guardando…" : "Guardar cambios"}
              </Button>
            </div>
          </div>

          {/* En el celular el texto de la izquierda no entra: el error y la falta de señal van debajo de los botones. */}
          {errorMessage ? (
            <p className="flex items-start gap-related text-meta text-fn-danger sm:hidden">
              <Icon icon={CircleAlert} size="xs" className="mt-0.5" />
              <span>{errorMessage}</span>
            </p>
          ) : offline ? (
            <p className="flex items-start gap-related text-meta sm:hidden">
              <Icon icon={WifiOff} size="xs" className="mt-0.5" />
              <span>{AVISO_SIN_SENAL_PARA_GUARDAR}</span>
            </p>
          ) : null}
        </section>
      </div>
    </div>,
    portalTarget,
  )
}

export function ConfiguracionView({
  project,
  planSurfaceMaxM2 = null,
  initialFloors,
  initialUnits,
  initialGroups,
  initialAssignmentsByUnit,
}: ConfiguracionViewProps) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const enLinea = useEnLinea()
  const [draft, setDraft] = useState<CreateProjectDraft | null>(() =>
    buildConfigDraftFromProjectData({
      projectName: project.name,
      location: project.location,
      floors: initialFloors,
      units: initialUnits,
      groups: initialGroups,
      assignmentsByUnit: initialAssignmentsByUnit,
    }),
  )
  const [savedSnapshot, setSavedSnapshot] = useState<ConfigSavedSnapshot | null>(() =>
    buildConfigSnapshot(
      {
        name: project.name,
        location: project.location,
        totalSurface: project.totalSurface,
        startDate: project.startDate,
        endDate: project.endDate,
      },
      buildConfigDraftFromProjectData({
        projectName: project.name,
        location: project.location,
        floors: initialFloors,
        units: initialUnits,
        groups: initialGroups,
        assignmentsByUnit: initialAssignmentsByUnit,
      }),
    ),
  )

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
    const page = await getConfigPageData(project.id)
    if (!page) return null

    const nextDraft = buildConfigDraftFromProjectData({
      projectName: basics.name,
      location: basics.location,
      floors: page.floors,
      units: page.units,
      groups: page.groups,
      assignmentsByUnit: page.assignments.byUnit,
    })

    setDraft(nextDraft)
    if (options?.updateSnapshot !== false) {
      setSavedSnapshot(buildConfigSnapshot(basics, nextDraft))
    }

    return nextDraft
  }

  const updateDraft = (patch: Partial<CreateProjectDraft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current))
    setFeedback(null)
    if ("floors" in patch) {
      setStructureFieldErrors({})
    }
  }

  // Si aparecen errores en la estructura, se abre su sección.
  const [prevStructureFieldErrors, setPrevStructureFieldErrors] = useState(structureFieldErrors)
  if (prevStructureFieldErrors !== structureFieldErrors) {
    setPrevStructureFieldErrors(structureFieldErrors)
    if (hasStructureStepFieldErrors(structureFieldErrors)) {
      setStructureSectionOpen(true)
    }
  }

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
    // Abrir la sección cambia el estado: se hace en el próximo cuadro, fuera del cuerpo del efecto.
    requestAnimationFrame(() => focusStructureSurfaceLimit())
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
          unit_category: u.typeCategory,
          room_count,
          area_m2: parseTotalSurfaceM2(u.squareMeters),
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
    void invalidateProjectQueries(queryClient, project.id)
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
    // Guardar necesita señal: si se cortó con el diálogo abierto, se cierra y la barra de abajo lo avisa.
    if (!enLinea) {
      setSaveDialogOpen(false)
      return
    }
    const saved = await handleSave()
    if (saved) {
      setSaveDialogOpen(false)
      return
    }
    // Si no se pudo guardar, el diálogo queda abierto (el error se ve en la barra de abajo).
    throw new Error("No se pudieron guardar los cambios.")
  }


  return (
    <>
      <div ref={contentRef} className="mx-auto flex w-full max-w-224 flex-col">
        <div
          className="flex flex-col gap-group sm:gap-block"
          style={{ paddingBottom: footerScrollPadding }}
        >
          {/* Encabezado */}
          <div className="flex flex-col gap-compact">
            <h1 className="text-title">Configuración del Proyecto</h1>
            <p className="text-body text-ink-muted">
              Administrá la estructura, los rubros y las tareas de la obra.
            </p>
          </div>

          {!enLinea ? <Notice tone="caution">{AVISO_SIN_SENAL_PARA_GUARDAR}</Notice> : null}

          {/* Información Básica */}
          <SettingsCard id="config-basica" title="Información Básica">
            <div id="config-basic-info" className="flex flex-col gap-group">
              {totalSurfaceOverPlan && planSurfaceMaxM2 != null ? (
                <PlanSurfaceLimitNotice
                  planSurfaceMaxM2={planSurfaceMaxM2}
                  projectId={project.id}
                  reportedSurfaceM2={parseTotalSurfaceM2(totalSurface) ?? 0}
                />
              ) : null}

              <div className="flex flex-col gap-group sm:flex-row sm:items-end">
                <CompanyLogoMark
                  logoUrl={project.companyLogoUrl}
                  alt={`Logo de ${project.companyName || "la empresa"}`}
                  className="size-16 shrink-0 rounded-mark bg-action text-action-ink sm:size-20"
                  fallback={<Icon icon={Building2} size="lg" />}
                />
                <Field
                  label="Nombre del Proyecto"
                  required
                  error={basicFieldErrors.projectName}
                  className="min-w-0 flex-1"
                >
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
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-group sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Ubicación" required error={basicFieldErrors.location}>
                  <InputGroup
                    start={<Icon icon={MapPin} size="xs" />}
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value)
                      updateDraft({ location: e.target.value })
                      if (basicFieldErrors.location) {
                        setBasicFieldErrors((current) => ({ ...current, location: undefined }))
                      }
                    }}
                  />
                </Field>
                <Field label="Superficie total" required error={basicFieldErrors.totalSurface}>
                  <InputGroup
                    end="m²"
                    placeholder="Ej. 2.000,50"
                    inputMode="decimal"
                    value={totalSurface}
                    onChange={(e) => {
                      const nextValue = normalizeTotalSurfaceInput(e.target.value)
                      setTotalSurface(nextValue)
                      updateDraft({ totalSurface: nextValue })
                      if (basicFieldErrors.totalSurface) {
                        setBasicFieldErrors((current) => ({
                          ...current,
                          totalSurface: undefined,
                        }))
                      }
                    }}
                    onBlur={() => {
                      const nextValue = finalizeTotalSurfaceInput(totalSurface)
                      setTotalSurface(nextValue)
                      updateDraft({ totalSurface: nextValue })
                    }}
                  />
                </Field>
                <Field
                  id="config-start-date"
                  label="Fecha de inicio"
                  required
                  error={basicFieldErrors.startDate}
                >
                  <DatePicker
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
                    max={parsedEndDate}
                  />
                </Field>
                <Field
                  id="config-end-date"
                  label="Finalización estimada"
                  required
                  error={basicFieldErrors.endDate}
                >
                  <DatePicker
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
                    min={parsedStartDate}
                  />
                </Field>
              </div>
            </div>
          </SettingsCard>

          {/* Estructura, rubros y asignaciones por unidad */}
          {draft ? (
            <>
              <SettingsCard
                id="config-estructura"
                title="Configuración de Niveles y Locales"
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
                id="config-rubros"
                title="Rubros y Tareas"
                collapsible
                defaultOpen={false}
              >
                <CreateProjectTasksStep draft={draft} onChange={updateDraft} />
              </SettingsCard>

              <SettingsCard
                id="config-por-unidad"
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
          offline={!enLinea}
          onRequestDiscard={() => setDiscardDialogOpen(true)}
          onSave={() => {
            if (!enLinea) return
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
        onConfirm={handleConfirmSave}
      />

      <ConfigConfirmDialog
        open={discardDialogOpen}
        onOpenChange={setDiscardDialogOpen}
        title="¿Descartar cambios?"
        description="Se perderán todos los cambios no guardados en la configuración del proyecto. ¿Querés continuar?"
        confirmLabel="Descartar cambios"
        cancelLabel="Seguir editando"
        tone="danger"
        onConfirm={handleConfirmDiscard}
      />
    </>
  )
}
