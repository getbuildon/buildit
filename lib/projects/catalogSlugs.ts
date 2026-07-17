import type { ProjectTeamRole, ProjectUserType } from "@/lib/projects/createProjectDraft"
import type { StructureUnitType, TaskTrackingType } from "@/lib/projects/createProjectDraft"

export const UNIT_TYPE_SLUG: Record<StructureUnitType, string> = {
  Departamento: "departamento",
  Oficina: "oficina",
  SUM: "sum",
  Patio: "patio",
  Piscina: "piscina",
  Terraza: "terraza",
  Estacionamiento: "estacionamiento",
  Otro: "otro",
}

export const TASK_TRACKING_SLUG: Record<TaskTrackingType, string> = {
  Porcentaje: "porcentaje",
  "Lista de verificación": "checklist",
  "Por unidad": "por_unidad",
}

export const USER_TYPE_SLUG: Record<ProjectUserType, string> = {
  Owner: "owner",
  Admin: "admin",
  Supervisor: "supervisor",
  Operador: "operador",
  Cliente: "cliente",
}

export const PROJECT_ROLE_SLUG: Record<ProjectTeamRole, string> = {
  Founder: "founder",
  "Director General": "director_general",
  Desarrollador: "desarrollador",
  Administrador: "administrador",
  Gerente: "gerente",
  "Project Manager": "project_manager",
  Coordinador: "coordinador",
  "Director de Obra": "director_obra",
  Residente: "residente",
  "Jefe de Obra": "jefe_obra",
  Supervisor: "supervisor",
  "Lider de Proyecto": "lider_proyecto",
  Capataz: "capataz",
  Contratista: "contratista",
  Subcontratista: "subcontratista",
  Cliente: "cliente",
}
