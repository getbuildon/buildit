import type { ProjectUserType } from "@/lib/projects/createProjectDraft"
import {
  canViewDetailedProgressForUnit,
  type ProjectPermissions,
} from "@/lib/project/projectPermissions"

export type ProjectAccessContext = {
  userType: ProjectUserType
  permissions: ProjectPermissions
  /** null = todas las unidades; array = unidades permitidas (cliente). */
  assignedUnitIds: string[] | null
}

export function canAccessUnitProgress(
  context: ProjectAccessContext,
  unitId: string,
): boolean {
  return canViewDetailedProgressForUnit(
    context.permissions,
    unitId,
    context.assignedUnitIds,
  )
}
