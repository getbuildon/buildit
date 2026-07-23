"use client"

import { useCallback, useEffect, useState } from "react"
import { BackButton } from "@/components/ui/BackButton"
import { createProjectFromDraft } from "@/app/projects/new/actions"
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
import { cn } from "@/lib/utils"

type CreatedProject = {
  id: string
  name: string
}

export function CreateNewProjectView() {
  const [phase, setPhase] = useState<"stage" | "wizard">("stage")
  const [activeStepId, setActiveStepId] = useState<CreateProjectStepId>("basic")
  const [draft, setDraft] = useState<CreateProjectDraft>(createEmptyProjectDraft)
  const [coverImage, setCoverImage] = useState<ProjectCoverImageDraft | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdProject, setCreatedProject] = useState<CreatedProject | null>(null)

  const isSuccess = createdProject !== null

  const activeStep = getCreateProjectStepConfig(activeStepId)
  const stepperState = getCreateProjectStepperState(activeStepId, draft.workStage)

  const updateDraft = useCallback((patch: Partial<CreateProjectDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setSubmitError(null)
  }, [])

  useEffect(() => {
    return () => revokeProjectCoverPreview(coverImage)
  }, [coverImage])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await createProjectFromDraft(draft)

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
          />
        )
      case "structure":
        return <CreateProjectStructureStep draft={draft} onChange={updateDraft} />
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
            onBack={handleBack}
            onNext={handleNext}
          />
        ) : null}

        {createdProject ? (
          <CreateProjectSuccessPanel
            projectId={createdProject.id}
            projectName={createdProject.name}
          />
        ) : null}
      </div>
    </div>
  )
}
