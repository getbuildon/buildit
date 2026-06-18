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
  onBack: () => void
  onNext: () => void
}

export function CreateProjectWizardFooter({
  canGoBack,
  isLastStep,
  isSubmitting = false,
  onBack,
  onNext,
}: CreateProjectWizardFooterProps) {
  return (
    <footer className="flex items-center justify-between gap-4">
      <Button
        type="button"
        variant="outline"
        disabled={!canGoBack || isSubmitting}
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
        {/* Same arrow SVG as Figma */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M7.99992 12.6673L3.33325 8.00065L7.99992 3.33398" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12.6666 8H3.33325" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Anterior
      </Button>
      <Button
        type="button"
        variant="brand"
        size="brand"
        disabled={isSubmitting}
        onClick={onNext}
        className={CREATE_PROJECT_TYPE.navButton}
      >
        {isSubmitting
          ? "Creando…"
          : isLastStep
            ? "Crear Proyecto"
            : "Siguiente"}
        {/* Right arrow SVG */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M8.00008 3.33398L12.6667 8.00065L8.00008 12.6673" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3.33325 8H12.6666" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Button>
    </footer>
  )
}
