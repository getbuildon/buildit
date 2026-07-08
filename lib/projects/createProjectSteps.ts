import {
  Building2,
  ClipboardList,
  Layers,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react"

export const CREATE_PROJECT_STEP_IDS = [
  "basic",
  "structure",
  "tasks",
  "unit-tasks",
  "team",
] as const

export type CreateProjectStepId = (typeof CREATE_PROJECT_STEP_IDS)[number]

export type CreateProjectStepConfig = {
  id: CreateProjectStepId
  label: string
  icon: LucideIcon
  sectionTitle: string
}

export const CREATE_PROJECT_STEPS: CreateProjectStepConfig[] = [
  {
    id: "basic",
    label: "Información Básica",
    icon: Building2,
    sectionTitle: "Información del Proyecto",
  },
  {
    id: "structure",
    label: "Estructura del Edificio",
    icon: Layers,
    sectionTitle: "Configuración de Pisos y Unidades",
  },
  {
    id: "tasks",
    label: "Rubros y Tareas",
    icon: Wrench,
    sectionTitle: "Rubros y Checklists",
  },
  {
    id: "unit-tasks",
    label: "Asignación por Unidad",
    icon: ClipboardList,
    sectionTitle: "Revisar aplicación por unidad",
  },
  {
    id: "team",
    label: "Equipo de Trabajo",
    icon: Users,
    sectionTitle: "Equipo de Trabajo",
  },
]

export function getCreateProjectStepIndex(stepId: CreateProjectStepId): number {
  return CREATE_PROJECT_STEP_IDS.indexOf(stepId)
}

export function getNextCreateProjectStepId(
  stepId: CreateProjectStepId,
): CreateProjectStepId | null {
  const index = getCreateProjectStepIndex(stepId)
  if (index < 0 || index >= CREATE_PROJECT_STEP_IDS.length - 1) return null
  return CREATE_PROJECT_STEP_IDS[index + 1]
}

export function getPreviousCreateProjectStepId(
  stepId: CreateProjectStepId,
): CreateProjectStepId | null {
  const index = getCreateProjectStepIndex(stepId)
  if (index <= 0) return null
  return CREATE_PROJECT_STEP_IDS[index - 1]
}
