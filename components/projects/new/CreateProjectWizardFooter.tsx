"use client"

import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  CREATE_PROJECT_COLORS,
  CREATE_PROJECT_TYPE,
} from "@/lib/projects/createProjectTokens"
import { cn } from "@/lib/utils"

type CreateProjectWizardFooterProps = {
  canGoBack: boolean
  isLastStep: boolean
  isSubmitting?: boolean
  isSavingDraft?: boolean
  disableContinue?: boolean
  onBack: () => void
  onSaveDraft: () => void
  onNext: () => void
}

export function CreateProjectWizardFooter({
  canGoBack,
  isLastStep,
  isSubmitting = false,
  isSavingDraft = false,
  disableContinue = false,
  onBack,
  onSaveDraft,
  onNext,
}: CreateProjectWizardFooterProps) {
  const isBusy = isSubmitting || isSavingDraft
  const isPrimaryDisabled = isBusy || disableContinue

  return (
    <footer className="flex items-center justify-between gap-4">
      <Button
        type="button"
        variant="outline"
        disabled={!canGoBack || isBusy}
        onClick={onBack}
        className={cn(
          CREATE_PROJECT_TYPE.navButton,
          "h-[44px] rounded-[10px] px-4 gap-2",
          !canGoBack && "opacity-50",
        )}
        style={{
          borderColor: CREATE_PROJECT_COLORS.btnSecondaryBorder,
          color: CREATE_PROJECT_COLORS.btnSecondaryText,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M7.99992 12.6673L3.33325 8.00065L7.99992 3.33398" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12.6666 8H3.33325" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Anterior
      </Button>

      <div className="flex items-center gap-6">
        <Button
          type="button"
          variant="ghost"
          size="brand"
          disabled={isBusy || disableContinue}
          onClick={onSaveDraft}
          className={cn(
            CREATE_PROJECT_TYPE.navButton,
            "cursor-pointer font-medium shadow-none",
            "text-[#777b84] hover:bg-[#f5f6f7] hover:text-[#363a3f]",
            "active:bg-[#edeef0] active:text-[#272a2d]",
            "disabled:cursor-not-allowed",
          )}
        >
          {isSavingDraft ? "Guardando…" : "Guardar borrador"}
        </Button>

        <Button
          type="button"
          variant="brand"
          size="brand"
          disabled={isPrimaryDisabled}
          onClick={onNext}
          className={CREATE_PROJECT_TYPE.navButton}
        >
          {isSubmitting
            ? "Creando…"
            : isLastStep
              ? "Crear Proyecto"
              : "Siguiente"}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </footer>
  )
}
