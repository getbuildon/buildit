"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { BackButton } from "@/components/ui/BackButton"
import {
  createProjectFromDraft,
  loadProjectDraft,
  saveProjectDraft,
} from "@/app/projects/new/actions"
import { CreateProjectStageStep } from "@/components/projects/new/CreateProjectStageStep"
import { CreateProjectSuccessPanel } from "@/components/projects/new/CreateProjectSuccessPanel"
import { CreateProjectStepper } from "@/components/projects/new/CreateProjectStepper"
import { CreateProjectWizardFooter } from "@/components/projects/new/CreateProjectWizardFooter"
import { CreateProjectBasicInfoStep } from "@/components/projects/new/steps/CreateProjectBasicInfoStep"
import { CreateProjectStructureStep } from "@/components/projects/new/steps/CreateProjectStructureStep"
import { CreateProjectTasksStep } from "@/components/projects/new/steps/CreateProjectTasksStep"
import { CreateProjectTeamStep } from "@/components/projects/new/steps/CreateProjectTeamStep"
import { CreateProjectUnitTasksStep } from "@/components/projects/new/steps/CreateProjectUnitTasksStep"
import { CreateProjectWorkStatusStep } from "@/components/projects/new/steps/CreateProjectWorkStatusStep"
import {
  getCreateProjectStepConfig,
  getCreateProjectStepperState,
  getDraftSaveConfirmMessage,
  getNextCreateProjectStepId,
  getPreviousCreateProjectStepId,
  type CreateProjectStepId,
} from "@/lib/projects/createProjectSteps"
import {
  createEmptyProjectDraft,
  type CreateProjectDraft,
} from "@/lib/projects/createProjectDraft"
import {
  revokeProjectCoverPreview,
  uploadProjectCoverPhoto,
  type ProjectCoverImageDraft,
} from "@/lib/projects/projectCoverPhoto.client"
import { uploadUnitAssetsFromDraft } from "@/lib/projects/unitPlanPhoto.client"
import {
  CREATE_PROJECT_COLORS,
  CREATE_PROJECT_LAYOUT,
  CREATE_PROJECT_TYPE,
} from "@/lib/projects/createProjectTokens"
import {
  getBasicInfoFieldErrors,
  type BasicInfoFieldErrors,
} from "@/lib/projects/createProjectBasicValidation"
import {
  getStructureStepFieldErrors,
  getFirstStructureFieldErrorTarget,
  hasStructureStepFieldErrors,
  type StructureStepFieldErrors,
} from "@/lib/projects/createProjectStructureValidation"
import { getProjectPlanSurfaceLimit } from "@/lib/projects/getProjectPlanSurfaceLimit"
import {
  getProjectPlanSurfaceLimitErrorFromDraft,
  isTotalSurfaceOverPlanLimit,
  scrollToStructureSurfaceLimitBanner,
} from "@/lib/projects/structureSurfaceLimits"
import { CreateProjectDraftSavedModal } from "@/components/projects/new/CreateProjectDraftSavedModal"
import { CreateProjectLoadingScreen } from "@/components/projects/new/CreateProjectLoadingScreen"
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog"
import { cn } from "@/lib/utils"

type CreatedProject = {
  id: string
  name: string
}

export function CreateNewProjectView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialProjectId = searchParams.get("projectId")

  const [draftProjectId, setDraftProjectId] = useState<string | null>(initialProjectId)
  const [phase, setPhase] = useState<"stage" | "wizard">("stage")
  const [activeStepId, setActiveStepId] = useState<CreateProjectStepId>("basic")
  const [draft, setDraft] = useState<CreateProjectDraft>(createEmptyProjectDraft)
  const [coverImage, setCoverImage] = useState<ProjectCoverImageDraft | null>(null)
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isLoadingDraft, setIsLoadingDraft] = useState(Boolean(initialProjectId))
  const [createdProject, setCreatedProject] = useState<CreatedProject | null>(null)
  const [basicFieldErrors, setBasicFieldErrors] = useState<BasicInfoFieldErrors>({})
  const [structureFieldErrors, setStructureFieldErrors] = useState<StructureStepFieldErrors>({})
  const [saveDraftDialogOpen, setSaveDraftDialogOpen] = useState(false)
  const [showDraftSavedModal, setShowDraftSavedModal] = useState(false)
  const [planSurfaceMaxM2, setPlanSurfaceMaxM2] = useState<number | null>(null)

  const isSuccess = createdProject !== null

  const activeStep = getCreateProjectStepConfig(activeStepId)
  const stepperState = getCreateProjectStepperState(activeStepId, draft.workStage)
  const draftSaveConfirmMessage = useMemo(
    () => getDraftSaveConfirmMessage(activeStepId),
    [activeStepId],
  )
  const planSurfaceLimitError = useMemo(
    () => getProjectPlanSurfaceLimitErrorFromDraft(draft, planSurfaceMaxM2),
    [draft, planSurfaceMaxM2],
  )
  const planSurfaceLimitTargetStep = useMemo((): CreateProjectStepId => {
    if (isTotalSurfaceOverPlanLimit(draft.totalSurface, planSurfaceMaxM2)) {
      return "basic"
    }
    return "structure"
  }, [draft.totalSurface, planSurfaceMaxM2])
  const pendingSurfaceBannerScroll = useRef(false)
  const wasOverSurfaceLimit = useRef(false)

  const focusPlanSurfaceLimit = useCallback(() => {
    pendingSurfaceBannerScroll.current = true
    if (activeStepId !== planSurfaceLimitTargetStep) {
      setActiveStepId(planSurfaceLimitTargetStep)
      return
    }
    scrollToStructureSurfaceLimitBanner()
    pendingSurfaceBannerScroll.current = false
  }, [activeStepId, planSurfaceLimitTargetStep])

  useEffect(() => {
    if (!pendingSurfaceBannerScroll.current) return
    if (activeStepId !== planSurfaceLimitTargetStep) return
    scrollToStructureSurfaceLimitBanner({ delayMs: 100 })
    pendingSurfaceBannerScroll.current = false
  }, [activeStepId, planSurfaceLimitTargetStep, planSurfaceLimitError])

  useEffect(() => {
    if (!planSurfaceLimitError) {
      wasOverSurfaceLimit.current = false
      return
    }
    if (wasOverSurfaceLimit.current) return
    wasOverSurfaceLimit.current = true
    if (activeStepId !== planSurfaceLimitTargetStep) {
      focusPlanSurfaceLimit()
    }
  }, [planSurfaceLimitError, activeStepId, planSurfaceLimitTargetStep, focusPlanSurfaceLimit])

  useEffect(() => {
    if (!draftProjectId) {
      setPlanSurfaceMaxM2(null)
      return
    }

    let cancelled = false

    void getProjectPlanSurfaceLimit(draftProjectId).then((limit) => {
      if (!cancelled) {
        setPlanSurfaceMaxM2(limit)
      }
    })

    return () => {
      cancelled = true
    }
  }, [draftProjectId])

  const updateDraft = useCallback((patch: Partial<CreateProjectDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setSubmitError(null)
    setBasicFieldErrors((current) => {
      if (Object.keys(current).length === 0) return current
      const next = { ...current }
      if ("projectName" in patch) delete next.projectName
      if ("totalSurface" in patch) delete next.totalSurface
      if ("startDate" in patch) delete next.startDate
      if ("endDate" in patch) delete next.endDate
      return next
    })
    if ("floors" in patch) {
      setStructureFieldErrors({})
    }
  }, [])

  useEffect(() => {
    return () => revokeProjectCoverPreview(coverImage)
  }, [coverImage])

  useEffect(() => {
    if (!initialProjectId) return

    let cancelled = false

    void loadProjectDraft(initialProjectId).then((result) => {
      if (cancelled) return

      if (!result.ok) {
        setSubmitError(result.error)
        setIsLoadingDraft(false)
        return
      }

      setDraftProjectId(result.projectId)
      setDraft(result.draft)
      setPhase("stage")
      setActiveStepId("basic")
      setExistingCoverUrl(result.coverUrl)
      setIsLoadingDraft(false)
    })

    return () => {
      cancelled = true
    }
  }, [initialProjectId])

  const syncDraftProjectUrl = useCallback(
    (projectId: string) => {
      setDraftProjectId(projectId)
      router.replace(`/projects/new?projectId=${projectId}`, { scroll: false })
    },
    [router],
  )

  const handleSaveDraft = async (): Promise<boolean> => {
    if (planSurfaceLimitError) {
      setSubmitError(planSurfaceLimitError)
      focusPlanSurfaceLimit()
      return false
    }

    setIsSavingDraft(true)
    setSubmitError(null)

    try {
      const result = await saveProjectDraft({
        draft,
        phase,
        activeStepId,
        projectId: draftProjectId,
      })

      if (!result.ok) {
        setSubmitError(result.error)
        return false
      }

      if (draftProjectId !== result.projectId) {
        syncDraftProjectUrl(result.projectId)
      }

      if (result.companyId !== draft.companyId) {
        updateDraft({ companyId: result.companyId })
      }

      if (coverImage) {
        const uploadResult = await uploadProjectCoverPhoto(result.projectId, coverImage.file)
        if (!uploadResult.ok) {
          setSubmitError(uploadResult.error)
          return false
        }
        setExistingCoverUrl(uploadResult.publicUrl)
      }

      setShowDraftSavedModal(true)
      return true
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handleConfirmSaveDraft = async () => {
    const saved = await handleSaveDraft()
    if (saved) {
      setSaveDraftDialogOpen(false)
    }
  }

  const handleSubmit = async () => {
    const basicErrors = getBasicInfoFieldErrors(draft)
    if (Object.keys(basicErrors).length > 0) {
      setBasicFieldErrors(basicErrors)
      setActiveStepId("basic")
      setSubmitError(null)
      return
    }
    setBasicFieldErrors({})

    if (planSurfaceLimitError) {
      setSubmitError(planSurfaceLimitError)
      focusPlanSurfaceLimit()
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await createProjectFromDraft(draft, draftProjectId)

      if (!result.ok) {
        setSubmitError(result.error)
        return
      }

      if (coverImage) {
        const uploadResult = await uploadProjectCoverPhoto(result.projectId, coverImage.file)
        if (!uploadResult.ok) {
          setSubmitError(uploadResult.error)
          return
        }
        setExistingCoverUrl(uploadResult.publicUrl)
      }

      const unitAssets = draft.floors.flatMap((floor) => floor.units)
      const unitAssetResult = await uploadUnitAssetsFromDraft(
        result.projectId,
        result.unitIdByDraftId,
        unitAssets,
      )
      if (!unitAssetResult.ok) {
        setSubmitError(unitAssetResult.error)
        return
      }

      setCreatedProject({
        id: result.projectId,
        name: draft.projectName.trim() || "Nueva obra",
      })
      window.scrollTo({ top: 0, behavior: "smooth" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    if (activeStepId === "basic") {
      const errors = getBasicInfoFieldErrors(draft)
      if (Object.keys(errors).length > 0) {
        setBasicFieldErrors(errors)
        setSubmitError(null)
        return
      }
      setBasicFieldErrors({})
    }

    if (activeStepId === "structure") {
      const errors = getStructureStepFieldErrors(draft)
      if (hasStructureStepFieldErrors(errors)) {
        setStructureFieldErrors(errors)
        setSubmitError(null)
        const target = getFirstStructureFieldErrorTarget(errors)
        if (target) {
          requestAnimationFrame(() => {
            const selector = target.unitId
              ? `[data-structure-unit-id="${target.unitId}"]`
              : `[data-structure-floor-id="${target.floorId}"]`
            document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "center" })
          })
        }
        return
      }
      setStructureFieldErrors({})
    }

    if (planSurfaceLimitError) {
      setSubmitError(planSurfaceLimitError)
      focusPlanSurfaceLimit()
      return
    }

    if (activeStepId === "team") {
      void handleSubmit()
      return
    }

    const nextStepId = getNextCreateProjectStepId(activeStepId, draft.workStage)
    if (nextStepId) {
      setActiveStepId(nextStepId)
    }
  }

  const handleBack = () => {
    if (activeStepId === "basic") {
      setPhase("stage")
      return
    }

    const previousStepId = getPreviousCreateProjectStepId(activeStepId, draft.workStage)
    if (previousStepId) {
      setActiveStepId(previousStepId)
    }
  }

  const handleStartWizard = () => {
    setPhase("wizard")
    setActiveStepId("basic")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const renderStepContent = () => {
    switch (activeStepId) {
      case "basic":
        return (
          <CreateProjectBasicInfoStep
            draft={draft}
            onChange={updateDraft}
            coverImage={coverImage}
            onCoverImageChange={setCoverImage}
            existingCoverUrl={existingCoverUrl}
            onExistingCoverRemove={() => setExistingCoverUrl(null)}
            fieldErrors={basicFieldErrors}
            projectId={draftProjectId}
            planSurfaceMaxM2={planSurfaceMaxM2}
          />
        )
      case "structure":
        return (
          <CreateProjectStructureStep
            draft={draft}
            onChange={updateDraft}
            fieldErrors={structureFieldErrors}
            projectId={draftProjectId}
            planSurfaceMaxM2={planSurfaceMaxM2}
          />
        )
      case "tasks":
        return <CreateProjectTasksStep draft={draft} onChange={updateDraft} />
      case "unit-tasks":
        return <CreateProjectUnitTasksStep draft={draft} onChange={updateDraft} />
      case "work-status":
        return <CreateProjectWorkStatusStep draft={draft} onChange={updateDraft} />
      case "team":
        return <CreateProjectTeamStep draft={draft} onChange={updateDraft} />
      default:
        return null
    }
  }

  if (isLoadingDraft) {
    return <CreateProjectLoadingScreen />
  }

  if (phase === "stage" && !isSuccess) {
    return (
      <CreateProjectStageStep
        value={draft.workStage}
        onChange={(workStage) => updateDraft({ workStage })}
        onContinue={handleStartWizard}
      />
    )
  }

  return (
    <div
      className="min-h-screen w-full px-6 pt-8 pb-16"
      style={{ backgroundColor: CREATE_PROJECT_COLORS.pageBg }}
    >
      <div
        className="mx-auto flex w-full flex-col gap-6"
        style={{ maxWidth: CREATE_PROJECT_LAYOUT.contentMaxWidth }}
      >
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-8">
            <BackButton href="/home" />
            <div className="flex flex-col gap-2">
              <h1
                className={cn(CREATE_PROJECT_TYPE.pageTitle, "font-recoleta")}
                style={{ color: CREATE_PROJECT_COLORS.title }}
              >
                Crear nueva obra
              </h1>
              <p
                className={CREATE_PROJECT_TYPE.pageSubtitle}
                style={{ color: CREATE_PROJECT_COLORS.subtitle }}
              >
                Configurá los detalles de tu nuevo proyecto de construcción.
              </p>
            </div>
          </header>

          <CreateProjectStepper
            steps={stepperState.steps}
            activeStepperIndex={stepperState.activeStepperIndex}
            partialConnectorAfterIndex={stepperState.partialConnectorAfterIndex}
          />

          <section
            className={cn(
              "rounded-[16px] border bg-white px-[33px] py-[33px] transition-opacity duration-300",
              isSuccess && "pointer-events-none opacity-40",
              showDraftSavedModal && "pointer-events-none opacity-40",
            )}
            style={{
              borderColor: CREATE_PROJECT_COLORS.cardBorder,
              backgroundColor: CREATE_PROJECT_COLORS.cardBg,
              boxShadow: "0 0 5px rgba(243, 103, 31, 0.08)",
            }}
            aria-labelledby="create-project-form-title"
            aria-hidden={isSuccess}
          >
            <h2
              id="create-project-form-title"
              className={cn(CREATE_PROJECT_TYPE.sectionTitle, "mb-2")}
              style={{ color: CREATE_PROJECT_COLORS.sectionTitle }}
            >
              {activeStep.sectionTitle}
            </h2>

            {renderStepContent()}
          </section>
        </div>

        {submitError ? (
          <p
            className="rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[14px] leading-5 text-[#b91c1c]"
            role="alert"
          >
            {submitError}
          </p>
        ) : null}

        {!isSuccess ? (
          <CreateProjectWizardFooter
            canGoBack
            isLastStep={activeStepId === "team"}
            isSubmitting={isSubmitting}
            isSavingDraft={isSavingDraft}
            disableContinue={Boolean(planSurfaceLimitError)}
            onBack={handleBack}
            onSaveDraft={() => setSaveDraftDialogOpen(true)}
            onNext={handleNext}
          />
        ) : null}

        {createdProject ? (
          <CreateProjectSuccessPanel
            projectId={createdProject.id}
            projectName={createdProject.name}
          />
        ) : null}

        <ConfirmActionDialog
          open={saveDraftDialogOpen}
          onOpenChange={(open) => {
            if (isSavingDraft) return
            setSaveDraftDialogOpen(open)
          }}
          title="Guardar borrador"
          description={draftSaveConfirmMessage}
          confirmLabel="Confirmar"
          cancelLabel="Seguir editando"
          loading={isSavingDraft}
          loadingLabel="Guardando borrador..."
          onConfirm={() => void handleConfirmSaveDraft()}
        />

        <CreateProjectDraftSavedModal open={showDraftSavedModal} />
      </div>
    </div>
  )
}
