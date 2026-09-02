import type { LoginAudience } from "@/lib/auth/loginAudience"
import type { CompanyRole } from "@/lib/company/formatCompanyRole"
import type { ProjectUserType } from "@/lib/projects/createProjectDraft"
import {
  getProjectPermissions,
  resolveAssignedUnitIds,
  type ProjectPermissionKey,
  type ProjectPermissionValue,
  type ProjectPermissions,
} from "@/lib/project/projectPermissions"

export type CompanyProjectAccessRole = Extract<CompanyRole, "owner" | "admin">

export type ProjectAccessSource = "company" | "project" | "client"

export type ResolveProjectAccessInput = {
  projectUserType: ProjectUserType | null
  companyRole: CompanyRole | null
  clientUnitIds: string[]
  loginAudience: LoginAudience
}

export type ResolvedProjectAccess = {
  userType: ProjectUserType
  projectUserType: ProjectUserType | null
  companyRole: CompanyProjectAccessRole | null
  sources: ProjectAccessSource[]
  permissions: ProjectPermissions
  assignedUnitIds: string[] | null
}

/** Owner/admin de empresa: config y lectura. Sin acciones de campo. */
export const COMPANY_LAYER_PERMISSIONS: ProjectPermissions = {
  addUsers: true,
  editPermissions: true,
  configureProject: true,
  viewDashboard: true,
  viewDetailedProgress: true,
  loadProgress: false,
  certifyTasks: false,
  editTasks: false,
  viewAuditLog: true,
  clientPortal: false,
  manageClients: true,
}

const EMPTY_PERMISSIONS: ProjectPermissions = {
  addUsers: false,
  editPermissions: false,
  configureProject: false,
  viewDashboard: false,
  viewDetailedProgress: false,
  loadProgress: false,
  certifyTasks: false,
  editTasks: false,
  viewAuditLog: false,
  clientPortal: false,
  manageClients: false,
}

export function companyRoleGrantsProjectAccess(
  role: CompanyRole | null | undefined,
): role is CompanyProjectAccessRole {
  return role === "owner" || role === "admin"
}

export function unionPermissionValue(
  left: ProjectPermissionValue,
  right: ProjectPermissionValue,
): ProjectPermissionValue {
  if (left === true || right === true) return true
  if (left === "unitOnly" || right === "unitOnly") return "unitOnly"
  return false
}

export function unionProjectPermissions(
  ...layers: ProjectPermissions[]
): ProjectPermissions {
  const merged = { ...EMPTY_PERMISSIONS }

  for (const layer of layers) {
    for (const key of Object.keys(merged) as ProjectPermissionKey[]) {
      merged[key] = unionPermissionValue(merged[key], layer[key])
    }
  }

  return merged
}

export function resolveProjectAccess(
  input: ResolveProjectAccessInput,
): ResolvedProjectAccess | null {
  const companyRole = companyRoleGrantsProjectAccess(input.companyRole)
    ? input.companyRole
    : null
  const projectUserType = input.projectUserType
  const hasClientUnits = input.clientUnitIds.length > 0

  const sources: ProjectAccessSource[] = []
  if (companyRole) sources.push("company")
  if (projectUserType) sources.push("project")
  if (hasClientUnits) sources.push("client")

  if (sources.length === 0) return null

  const layers: ProjectPermissions[] = []
  if (projectUserType) layers.push(getProjectPermissions(projectUserType))
  if (companyRole) layers.push(COMPANY_LAYER_PERMISSIONS)

  let permissions =
    layers.length > 0 ? unionProjectPermissions(...layers) : { ...EMPTY_PERMISSIONS }

  if (hasClientUnits && !permissions.clientPortal) {
    permissions = { ...permissions, clientPortal: true }
  }

  const userType =
    projectUserType ?? (companyRole ? "Admin" : "Cliente")

  const assignedUnitIds =
    input.loginAudience === "cliente"
      ? input.clientUnitIds
      : resolveAssignedUnitIds(permissions, input.clientUnitIds)

  return {
    userType,
    projectUserType,
    companyRole,
    sources,
    permissions,
    assignedUnitIds,
  }
}
