"use client"

import { Check } from "lucide-react"
import type { ProjectWorkStage } from "@/lib/projects/createProjectDraft"
import { CREATE_PROJECT_STAGE } from "@/lib/projects/createProjectTokens"
import { cn } from "@/lib/utils"

const STAGE_OPTIONS: Array<{
  value: ProjectWorkStage
  title: string
  description: string
}> = [
  {
    value: "not_started",
    title: "La obra aún no comenzó",
    description:
      'Vas a configurar la obra desde cero y el seguimiento iniciará con todos los rubros y tareas como "pendientes".',
  },
  {
    value: "in_execution",
    title: "La obra ya está en ejecución",
    description:
      'Podrás indicar qué rubros ya están "Completados" o "En Proceso" para comenzar el seguimiento de avance desde el estado actual.',
  },
]

type CreateProjectStageStepProps = {
  value: ProjectWorkStage
  onChange: (value: ProjectWorkStage) => void
  onContinue: () => void
}

function StageRadio({ selected }: { selected: boolean }) {
  if (selected) {
    return (
      <span className={CREATE_PROJECT_STAGE.radioSelected} aria-hidden>
        <Check className="size-3 text-white" strokeWidth={2.5} />
      </span>
    )
  }

  return <span className={CREATE_PROJECT_STAGE.radioUnselected} aria-hidden />
}

export function CreateProjectStageStep({
  value,
  onChange,
  onContinue,
}: CreateProjectStageStepProps) {
  return (
    <div className={CREATE_PROJECT_STAGE.page}>
      <div className={CREATE_PROJECT_STAGE.content}>
        <div className={CREATE_PROJECT_STAGE.copy}>
          <h1 className={CREATE_PROJECT_STAGE.title}>
            Antes de empezar, contanos en qué etapa está tu obra.
          </h1>
          <p className={CREATE_PROJECT_STAGE.subtitle}>
            Esto nos ayudará a configurar el proyecto de la forma más adecuada.
          </p>
        </div>

        <div className={CREATE_PROJECT_STAGE.cards} role="radiogroup" aria-label="Etapa de la obra">
          {STAGE_OPTIONS.map((option) => {
            const selected = value === option.value

            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(option.value)}
                className={cn(
                  CREATE_PROJECT_STAGE.cardBase,
                  selected ? CREATE_PROJECT_STAGE.cardSelected : CREATE_PROJECT_STAGE.cardUnselected,
                )}
              >
                <StageRadio selected={selected} />
                <p className={CREATE_PROJECT_STAGE.cardTitle}>{option.title}</p>
                <p className={CREATE_PROJECT_STAGE.cardDescription}>{option.description}</p>
              </button>
            )
          })}
        </div>

        <button type="button" onClick={onContinue} className={CREATE_PROJECT_STAGE.continueBtn}>
          Comenzar configuración
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M8.00008 3.33398L12.6667 8.00065L8.00008 12.6673"
              stroke="currentColor"
              strokeWidth="1.33333"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3.33325 8H12.6666"
              stroke="currentColor"
              strokeWidth="1.33333"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
