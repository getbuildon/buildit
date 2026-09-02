import type { LoginAudience } from "@/lib/auth/loginAudience"
import type { ProjectUserType } from "@/lib/projects/createProjectDraft"
import {
  canViewDetailedProgressForUnit,
  type ProjectPermissions,
} from "@/lib/project/projectPermissions"
import type {
  CompanyProjectAccessRole,
  ProjectAccessSource,
} from "@/lib/project/resolveProjectAccess"

export type ProjectAccessContext = {
  userType: ProjectUserType
  projectUserType: ProjectUserType | null
  companyRole: CompanyProjectAccessRole | null
  sources: ProjectAccessSource[]
  permissions: ProjectPermissions
  /** null = todas las unidades; array = unidades permitidas (cliente). */
  assignedUnitIds: string[] | null
  loginAudience: LoginAudience
}

export function canAccessUnitProgress(
  context: ProjectAccessContext,
  unitId: string,
): boolean {
  if (context.loginAudience === "cliente") {
    return context.assignedUnitIds?.includes(unitId) ?? false
  }

  return canViewDetailedProgressForUnit(
    context.permissions,
    unitId,
    context.assignedUnitIds,
  )
}
