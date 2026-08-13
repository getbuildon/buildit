import {
  Building2,
  ClipboardList,
  Layers,
  Loader,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import type { ProjectWorkStage } from "@/lib/projects/createProjectDraft"

export const CREATE_PROJECT_STEP_IDS = [
  "basic",
  "structure",
  "tasks",
  "unit-tasks",
  "work-status",
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
    sectionTitle: "Configuración de Pisos y Unidades Funcionales",
  },
  {
    id: "tasks",
    label: "Rubros y Tareas",
    icon: Wrench,
    sectionTitle: "Rubros y Tareas",
  },
  {
    id: "unit-tasks",
    label: "Asignación por Unidad",
    icon: ClipboardList,
    sectionTitle: "Revisar aplicación por unidad",
  },
  {
    id: "work-status",
    label: "Estado actual\nde Obra",
    icon: Loader,
    sectionTitle: "Estado inicial de Obra",
  },
  {
    id: "team",
    label: "Equipo de Trabajo",
    icon: Users,
    sectionTitle: "Equipo de Trabajo",
  },
]

const STEP_BY_ID = new Map(CREATE_PROJECT_STEPS.map((step) => [step.id, step]))

const HIDDEN_STEPPER_STEP_IDS = new Set<CreateProjectStepId>(["unit-tasks"])

export function getCreateProjectFlowStepIds(
  workStage: ProjectWorkStage,
): CreateProjectStepId[] {
  if (workStage === "not_started") {
    return ["basic", "structure", "tasks", "unit-tasks", "team"]
  }

  return ["basic", "structure", "tasks", "unit-tasks", "work-status", "team"]
}

/** Pasos visibles en el stepper según etapa de obra. */
export function getCreateProjectStepperSteps(
  workStage: ProjectWorkStage,
): CreateProjectStepConfig[] {
  const flow = getCreateProjectFlowStepIds(workStage)
  return flow
    .filter((stepId) => !HIDDEN_STEPPER_STEP_IDS.has(stepId))
    .map((stepId) => getCreateProjectStepConfig(stepId))
}

export function getCreateProjectStepConfig(
  stepId: CreateProjectStepId,
): CreateProjectStepConfig {
  return STEP_BY_ID.get(stepId) ?? CREATE_PROJECT_STEPS[0]
}

export function getCreateProjectStepIndex(
  stepId: CreateProjectStepId,
  workStage: ProjectWorkStage,
): number {
  return getCreateProjectFlowStepIds(workStage).indexOf(stepId)
}

export function getNextCreateProjectStepId(
  stepId: CreateProjectStepId,
  workStage: ProjectWorkStage,
): CreateProjectStepId | null {
  const flow = getCreateProjectFlowStepIds(workStage)
  const index = flow.indexOf(stepId)
  if (index < 0 || index >= flow.length - 1) return null
  return flow[index + 1]
}

export function getPreviousCreateProjectStepId(
  stepId: CreateProjectStepId,
  workStage: ProjectWorkStage,
): CreateProjectStepId | null {
  const flow = getCreateProjectFlowStepIds(workStage)
  const index = flow.indexOf(stepId)
  if (index <= 0) return null
  return flow[index - 1]
}

function getVisibleStepperIndex(
  activeStepId: CreateProjectStepId,
  workStage: ProjectWorkStage,
): number {
  const visibleSteps = getCreateProjectStepperSteps(workStage)
  const directIndex = visibleSteps.findIndex((step) => step.id === activeStepId)
  if (directIndex >= 0) return directIndex

  const flow = getCreateProjectFlowStepIds(workStage)
  const activeFlowIndex = flow.indexOf(activeStepId)
  if (activeFlowIndex < 0) return 0

  let visibleIndex = 0
  for (let i = 0; i < activeFlowIndex; i += 1) {
    if (!HIDDEN_STEPPER_STEP_IDS.has(flow[i])) {
      visibleIndex += 1
    }
  }

  return Math.min(visibleIndex, visibleSteps.length - 1)
}

export function getCreateProjectStepperState(
  activeStepId: CreateProjectStepId,
  workStage: ProjectWorkStage,
): {
  steps: CreateProjectStepConfig[]
  activeStepperIndex: number
  partialConnectorAfterIndex: number | null
} {
  const steps = getCreateProjectStepperSteps(workStage)
  const tasksStepIndex = steps.findIndex((step) => step.id === "tasks")

  if (activeStepId === "unit-tasks") {
    return {
      steps,
      activeStepperIndex: tasksStepIndex >= 0 ? tasksStepIndex : 0,
      partialConnectorAfterIndex: tasksStepIndex >= 0 ? tasksStepIndex : null,
    }
  }

  return {
    steps,
    activeStepperIndex: getVisibleStepperIndex(activeStepId, workStage),
    partialConnectorAfterIndex: null,
  }
}

export function getDraftSaveConfirmMessage(activeStepId: CreateProjectStepId): string {
  switch (activeStepId) {
    case "basic":
      return "Se guardarán los datos básicos del borrador. Podrás retomar la configuración cuando quieras. ¿Deseás continuar?"
    case "structure":
      return "Se guardará la estructura del edificio en el borrador. Podrás retomar la configuración cuando quieras. ¿Deseás continuar?"
    case "tasks":
      return "Se guardarán los rubros y tareas en el borrador. Podrás retomar la configuración cuando quieras. ¿Deseás continuar?"
    case "unit-tasks":
      return "Se guardará la asignación de tareas por unidad en el borrador. Podrás retomar la configuración cuando quieras. ¿Deseás continuar?"
    case "work-status":
      return "Se guardará el estado de obra en el borrador. Podrás retomar la configuración cuando quieras. ¿Deseás continuar?"
    case "team":
      return "Se guardará el equipo de trabajo en el borrador. Podrás retomar la configuración cuando quieras. ¿Deseás continuar?"
    default:
      return "Se guardará el borrador del proyecto con el progreso actual. Podrás retomar la configuración cuando quieras. ¿Deseás continuar?"
  }
}
