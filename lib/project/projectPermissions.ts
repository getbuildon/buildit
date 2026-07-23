import type { ProjectUserType } from "@/lib/projects/createProjectDraft"

export const PROJECT_USER_TYPE_COLUMNS = [
  "Owner",
  "Admin",
  "Supervisor",
  "Operador",
  "Cliente",
] as const satisfies readonly ProjectUserType[]

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
  key?: ProjectPermissionKey
  values: ProjectPermissionValue[]
}

/** Matriz alineada a Equipo → Permisos de usuarios (Figma). */
export const PROJECT_PERMISSION_TABLE: PermissionRow[] = [
  { action: "Facturación/Licencias", values: [true, false, false, false, false] },
  { action: "Crear proyecto", values: [true, true, false, false, false] },
  { action: "Agregar usuarios", key: "addUsers", values: [true, true, false, false, false] },
  { action: "Editar permisos", key: "editPermissions", values: [true, true, false, false, false] },
  {
    action: "Configurar proyecto",
    key: "configureProject",
    values: [true, true, false, false, false],
  },
  { action: "Ver dashboard general", key: "viewDashboard", values: [true, true, true, true, false] },
  {
    action: "Ver avance detallado",
    key: "viewDetailedProgress",
    values: [true, true, true, true, "unitOnly"],
  },
  { action: "Cargar avances", key: "loadProgress", values: [true, true, true, true, false] },
  { action: "Certificar tareas", key: "certifyTasks", values: [true, false, true, false, false] },
  { action: "Editar tareas", key: "editTasks", values: [true, false, true, true, false] },
  { action: "Ver auditoría (log)", key: "viewAuditLog", values: [true, true, true, false, false] },
  { action: "Portal cliente", key: "clientPortal", values: [false, false, false, false, true] },
  { action: "Ver/agregar clientes", key: "manageClients", values: [true, true, false, false, false] },
]

const USER_TYPE_INDEX: Record<ProjectUserType, number> = {
  Owner: 0,
  Admin: 1,
  Supervisor: 2,
  Operador: 3,
  Cliente: 4,
}

const PERMISSION_KEYS = PROJECT_PERMISSION_TABLE.flatMap((row) =>
  row.key ? [row.key] : [],
) as ProjectPermissionKey[]

export function getProjectPermissions(userType: ProjectUserType): ProjectPermissions {
  const columnIndex = USER_TYPE_INDEX[userType]
  const permissions = {} as ProjectPermissions

  for (const key of PERMISSION_KEYS) {
    permissions[key] = false
  }

  for (const row of PROJECT_PERMISSION_TABLE) {
    if (!row.key) continue
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

export function isNavSegmentAllowed(
  permissions: ProjectPermissions,
  segment: string,
): boolean {
  switch (segment) {
    case "":
      return hasProjectPermission(permissions, "viewDashboard") || permissions.clientPortal === true
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
    default:
      return hasProjectPermission(permissions, "viewDashboard")
  }
}
