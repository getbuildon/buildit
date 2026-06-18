"use client"

import Link from "next/link"
import { useCallback, useState } from "react"
import { createProjectFromDraft } from "@/app/projects/new/actions"
import { CreateProjectSuccessPanel } from "@/components/projects/new/CreateProjectSuccessPanel"
import { CreateProjectStepper } from "@/components/projects/new/CreateProjectStepper"
import { CreateProjectWizardFooter } from "@/components/projects/new/CreateProjectWizardFooter"
import { CreateProjectBasicInfoStep } from "@/components/projects/new/steps/CreateProjectBasicInfoStep"
import { CreateProjectStructureStep } from "@/components/projects/new/steps/CreateProjectStructureStep"
import { CreateProjectTasksStep } from "@/components/projects/new/steps/CreateProjectTasksStep"
import { CreateProjectTeamStep } from "@/components/projects/new/steps/CreateProjectTeamStep"
import {
  CREATE_PROJECT_STEPS,
  getNextCreateProjectStepId,
  getPreviousCreateProjectStepId,
  type CreateProjectStepId,
} from "@/lib/projects/createProjectSteps"
import {
  createEmptyProjectDraft,
  type CreateProjectDraft,
} from "@/lib/projects/createProjectDraft"
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
  const [activeStepId, setActiveStepId] = useState<CreateProjectStepId>("basic")
  const [draft, setDraft] = useState<CreateProjectDraft>(createEmptyProjectDraft)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdProject, setCreatedProject] = useState<CreatedProject | null>(null)

  const isSuccess = createdProject !== null

  const activeStep =
    CREATE_PROJECT_STEPS.find((step) => step.id === activeStepId) ??
    CREATE_PROJECT_STEPS[0]

  const updateDraft = useCallback((patch: Partial<CreateProjectDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setSubmitError(null)
  }, [])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    const result = await createProjectFromDraft(draft)

    setIsSubmitting(false)

    if (!result.ok) {
      setSubmitError(result.error)
      return
    }

    setCreatedProject({
      id: result.projectId,
      name: draft.projectName.trim() || "Nueva obra",
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleNext = () => {
    if (activeStepId === "team") {
      void handleSubmit()
      return
    }

    const nextStepId = getNextCreateProjectStepId(activeStepId)
    if (nextStepId) {
      setActiveStepId(nextStepId)
    }
  }

  const handleBack = () => {
    const previousStepId = getPreviousCreateProjectStepId(activeStepId)
    if (previousStepId) {
      setActiveStepId(previousStepId)
    }
  }

  const renderStepContent = () => {
    switch (activeStepId) {
      case "basic":
        return <CreateProjectBasicInfoStep draft={draft} onChange={updateDraft} />
      case "structure":
        return <CreateProjectStructureStep draft={draft} onChange={updateDraft} />
      case "tasks":
        return <CreateProjectTasksStep draft={draft} onChange={updateDraft} />
      case "team":
        return <CreateProjectTeamStep draft={draft} onChange={updateDraft} />
      default:
        return null
    }
  }

  return (
    <div
      className="min-h-screen w-full pt-8 pb-16"
      style={{ backgroundColor: CREATE_PROJECT_COLORS.pageBg }}
    >
      <div
        className="mx-auto flex w-full flex-col gap-8 px-6"
        style={{ maxWidth: CREATE_PROJECT_LAYOUT.contentMaxWidth }}
      >
        <header className="flex flex-col gap-4">
          <Link
            href="/home"
            className={cn(
              CREATE_PROJECT_TYPE.backLink,
              "inline-flex w-fit items-center gap-1.5 transition-opacity hover:opacity-80",
            )}
            style={{ color: CREATE_PROJECT_COLORS.backLink }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M7.99992 12.6673L3.33325 8.00065L7.99992 3.33398" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12.6666 8H3.33325" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver
          </Link>
          <div className="flex flex-col gap-2">
            <h1
              className={CREATE_PROJECT_TYPE.pageTitle}
              style={{ color: CREATE_PROJECT_COLORS.title, fontFamily: "var(--font-recoleta, serif)" }}
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
          steps={CREATE_PROJECT_STEPS}
          activeStepId={activeStepId}
        />

        <section
          className={cn(
            "rounded-[16px] border bg-white px-[33px] py-[33px] transition-opacity duration-300",
            isSuccess && "pointer-events-none opacity-40",
          )}
          style={{
            borderColor: CREATE_PROJECT_COLORS.cardBorder,
            backgroundColor: CREATE_PROJECT_COLORS.cardBg,
            boxShadow: "0 0 10px 0 rgba(243, 103, 31, 0.08)",
          }}
          aria-labelledby="create-project-form-title"
          aria-hidden={isSuccess}
        >
          <h2
            id="create-project-form-title"
            className={cn(CREATE_PROJECT_TYPE.sectionTitle, "mb-4")}
            style={{ color: CREATE_PROJECT_COLORS.sectionTitle }}
          >
            {activeStep.sectionTitle}
          </h2>

          {renderStepContent()}
        </section>

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
            canGoBack={activeStepId !== "basic"}
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
