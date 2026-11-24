import { Check } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "../../lib/cn"
import { Button } from "../../atoms/button/Button"
import { Icon } from "../../atoms/icon/Icon"
import { Progress } from "../../atoms/progress/Progress"

export type WizardStep = { id: string; label: string; description?: string }

export type StepperProps = {
  steps: readonly WizardStep[]
  /** Índice del paso actual (0 = el primero). */
  current: number
  /** Volver a un paso ya hecho. Los que faltan no se pueden saltear. */
  onStepClick?: (index: number) => void
  className?: string
}

/**
 * Los pasos de un proceso largo (crear una obra). En escritorio, la lista con estado;
 * en el celular, «Paso 2 de 5» con barra. aria-current="step" marca dónde se está.
 */
export function Stepper({ steps, current, onStepClick, className }: StepperProps) {
  const step = steps[current]
  return (
    <nav aria-label="Pasos" className={className}>
      <div className="flex flex-col gap-compact md:hidden">
        <p className="text-meta text-ink-muted">
          Paso {current + 1} de {steps.length}
        </p>
        <p className="text-section">{step?.label}</p>
        <Progress value={((current + 1) / steps.length) * 100} label={`Paso ${current + 1} de ${steps.length}`} size="thin" />
      </div>
      <ol className="hidden flex-col gap-related md:flex">
        {steps.map((item, index) => {
          const state = index < current ? "done" : index === current ? "current" : "upcoming"
          const clickable = state === "done" && onStepClick
          const content = (
            <>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-pill border text-meta font-medium tabular-nums",
                  state === "done" && "border-action bg-action text-action-ink",
                  state === "current" && "border-action text-action-text",
                  state === "upcoming" && "border-line-strong text-ink-muted",
                )}
              >
                {state === "done" ? <Icon icon={Check} size="xs" /> : index + 1}
              </span>
              <span className="flex min-w-0 flex-col text-left">
                <span className={state === "upcoming" ? "text-body text-ink-muted" : "text-label"}>{item.label}</span>
                {item.description ? <span className="text-meta text-ink-muted">{item.description}</span> : null}
              </span>
              {state === "done" ? <span className="sr-only">(listo)</span> : null}
            </>
          )
          return (
            <li key={item.id} aria-current={state === "current" ? "step" : undefined}>
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick(index)}
                  className="focus-ring state-veil flex w-full items-center gap-snug rounded-control p-compact"
                >
                  {content}
                </button>
              ) : (
                <div className={cn("flex items-center gap-snug rounded-control p-compact", state === "current" && "bg-surface-selected")}>{content}</div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export type WizardFooterProps = {
  current: number
  total: number
  onBack: () => void
  onNext: () => void
  /** Texto del último paso: «Crear obra». */
  finishLabel?: string
  nextLabel?: string
  /** Mientras guarda el paso. */
  loading?: boolean
  /** Acción secundaria a la izquierda: «Guardar borrador». */
  secondary?: ReactNode
  className?: string
}

/** Atrás y Siguiente, fijos abajo. En el último paso, Siguiente dice qué termina. */
export function WizardFooter({
  current,
  total,
  onBack,
  onNext,
  finishLabel = "Terminar",
  nextLabel = "Siguiente",
  loading,
  secondary,
  className,
}: WizardFooterProps) {
  const last = current === total - 1
  return (
    <div className={cn("flex items-center gap-snug border-t border-line bg-canvas-raised px-group py-snug", className)}>
      {secondary}
      <div className="ml-auto flex gap-snug">
        {current > 0 ? (
          <Button variant="outline" onClick={onBack} disabled={loading}>
            Atrás
          </Button>
        ) : null}
        <Button onClick={onNext} loading={loading}>
          {last ? finishLabel : nextLabel}
        </Button>
      </div>
    </div>
  )
}
