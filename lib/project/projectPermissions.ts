import {
  USER_TYPE_ROLES,
  type ProjectUserType,
} from "@/lib/projects/createProjectDraft"

export const PROJECT_USER_TYPE_COLUMNS = [
  "Owner",
  "Admin",
  "Supervisor",
  "Operador",
  "Cliente",
] as const satisfies readonly ProjectUserType[]

/** Columnas visibles en la tabla de permisos (Figma 1226:9375). */
export const PROJECT_PERMISSION_DISPLAY_COLUMNS = [
  "Admin",
  "Supervisor",
  "Operador",
  "Cliente",
] as const satisfies readonly ProjectUserType[]

export type ProjectPermissionDisplayColumn =
  (typeof PROJECT_PERMISSION_DISPLAY_COLUMNS)[number]

function formatRoleExamples(userType: ProjectPermissionDisplayColumn): string {
  return `${USER_TYPE_ROLES[userType].join(", ")}.`
}

export const PROJECT_ROLE_PERMISSION_TOOLTIPS: Record<
  ProjectPermissionDisplayColumn,
  {
    description: string
    roles: string
  }
> = {
  Admin: {
    description:
      "Administrador operativo de los proyectos. Configura estructuras, equipos, permisos y mantiene el funcionamiento general de la operación.",
    roles: formatRoleExamples("Admin"),
  },
  Supervisor: {
    description:
      "Supervisor técnico de la obra. Supervisa avances, certifica tareas, edita estados y consulta el registro de cambios del proyecto.",
    roles: formatRoleExamples("Supervisor"),
  },
  Operador: {
    description:
      "Usuario operativo en campo. Registra avances, edita tareas y consulta el estado del proyecto sin permisos de configuración ni certificación.",
    roles: formatRoleExamples("Operador"),
  },
  Cliente: {
    description:
      "Usuario externo del proyecto. Accede al portal del cliente y consulta el avance detallado de su unidad asignada.",
    roles: formatRoleExamples("Cliente"),
  },
}

export type ProjectPermissionKey =
  | "addUsers"
  | "editPermissions"
  | "configureProject"
  | "viewDashboard"
  | "viewDetailedProgress"
  | "loadProgress"
  | "certifyTasks"
  | "editTasks"
  | "viewAuditLog"
  | "clientPortal"
  | "manageClients"

export type ProjectPermissionValue = boolean | "unitOnly"

export type ProjectPermissions = Record<ProjectPermissionKey, ProjectPermissionValue>

type PermissionRow = {
  action: string
  key: ProjectPermissionKey
  values: ProjectPermissionValue[]
}

/** Matriz alineada a Equipo → Permisos de usuarios (Figma 1226:9375). */
export const PROJECT_PERMISSION_TABLE: PermissionRow[] = [
  { action: "Agregar usuarios", key: "addUsers", values: [true, true, false, false, false] },
  {
    action: "Editar permisos",
    key: "editPermissions",
    values: [true, true, false, false, false],
  },
  {
    action: "Configurar proyecto",
    key: "configureProject",
    values: [true, true, false, false, false],
  },
  {
    action: "Ver dashboard general",
    key: "viewDashboard",
    values: [true, true, true, true, false],
  },
  {
    action: "Ver avances detallados",
    key: "viewDetailedProgress",
    values: [true, true, true, true, "unitOnly"],
  },
  { action: "Cargar avances", key: "loadProgress", values: [true, true, true, true, false] },
  { action: "Certificar tareas", key: "certifyTasks", values: [true, false, true, false, false] },
  { action: "Editar tareas", key: "editTasks", values: [true, false, true, true, false] },
  {
    action: "Ver registro de cambios",
    key: "viewAuditLog",
    values: [true, true, true, true, false],
  },
  { action: "Portal cliente", key: "clientPortal", values: [false, false, false, false, true] },
  {
    action: "Ver/agregar clientes",
    key: "manageClients",
    values: [true, true, false, false, false],
  },
]

const USER_TYPE_INDEX: Record<ProjectUserType, number> = {
  Owner: 0,
  Admin: 1,
  Supervisor: 2,
  Operador: 3,
  Cliente: 4,
}

const PERMISSION_KEYS = PROJECT_PERMISSION_TABLE.map((row) => row.key)

export function getProjectPermissionColumnIndex(
  userType: ProjectPermissionDisplayColumn,
): number {
  return USER_TYPE_INDEX[userType]
}

export function getProjectPermissions(userType: ProjectUserType): ProjectPermissions {
  const columnIndex = USER_TYPE_INDEX[userType]
  const permissions = {} as ProjectPermissions

  for (const key of PERMISSION_KEYS) {
    permissions[key] = false
  }

  for (const row of PROJECT_PERMISSION_TABLE) {
    permissions[row.key] = row.values[columnIndex] ?? false
  }

  return permissions
}

export function hasProjectPermission(
  permissions: ProjectPermissions,
  key: ProjectPermissionKey,
): boolean {
  const value = permissions[key]
  return value === true || value === "unitOnly"
}

/** Permiso booleano estricto (ignora `unitOnly`). */
export function hasStrictProjectPermission(
  permissions: ProjectPermissions,
  key: ProjectPermissionKey,
): boolean {
  return permissions[key] === true
}

/**
 * `null` = acceso a todas las unidades.
 * `string[]` = solo esas unidades (portal cliente / unitOnly).
 */
export function canViewDetailedProgressForUnit(
  permissions: ProjectPermissions,
  unitId: string,
  assignedUnitIds: string[] | null,
): boolean {
  const access = permissions.viewDetailedProgress
  if (access === true) return true
  if (access === "unitOnly") {
    return assignedUnitIds?.includes(unitId) ?? false
  }
  return false
}

export function resolveAssignedUnitIds(
  permissions: ProjectPermissions,
  clientUnitIds: string[],
): string[] | null {
  if (permissions.viewDetailedProgress === true) return null
  if (permissions.viewDetailedProgress === "unitOnly") return clientUnitIds
  return []
}

export function isNavSegmentAllowed(
  permissions: ProjectPermissions,
  segment: string,
): boolean {
  switch (segment) {
    case "":
      return hasStrictProjectPermission(permissions, "viewDashboard")
    case "mi-unidad":
      return permissions.clientPortal === true
    case "trabajo-diario":
      return hasProjectPermission(permissions, "loadProgress")
    case "certificaciones":
      return hasProjectPermission(permissions, "viewDashboard")
    case "equipo":
      return hasProjectPermission(permissions, "viewDashboard")
    case "clientes":
      return hasProjectPermission(permissions, "manageClients")
    case "configuracion":
      return hasProjectPermission(permissions, "configureProject")
    case "portal-clientes":
      return hasProjectPermission(permissions, "configureProject")
    default:
      return hasProjectPermission(permissions, "viewDashboard")
  }
}
