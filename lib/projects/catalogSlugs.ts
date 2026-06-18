import type { ProjectTeamRole, ProjectUserType } from "@/lib/projects/createProjectDraft"
import type { StructureUnitType, TaskTrackingType } from "@/lib/projects/createProjectDraft"

export const UNIT_TYPE_SLUG: Record<StructureUnitType, string> = {
  Departamento: "departamento",
  Cochera: "cochera",
  Local: "local",
  Bodega: "bodega",
}

export const TASK_TRACKING_SLUG: Record<TaskTrackingType, string> = {
  Porcentaje: "porcentaje",
  "Lista de verificación": "checklist",
  "Por unidad": "por_unidad",
}

export const USER_TYPE_SLUG: Record<ProjectUserType, string> = {
  Interno: "interno",
  Externo: "externo",
  Cliente: "cliente",
  Contratista: "contratista",
}

export const PROJECT_ROLE_SLUG: Record<ProjectTeamRole, string> = {
  Administrador: "administrador",
  "Director de Obra": "director_obra",
  "Residente de Obra": "residente_obra",
  Arquitecto: "arquitecto",
  Cliente: "cliente",
}
