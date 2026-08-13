import { USER_TYPE_SLUG } from "@/lib/projects/catalogSlugs"
import {
  PROJECT_USER_TYPES,
  USER_TYPE_ROLES,
  type ProjectTeamRole,
  type ProjectUserType,
} from "@/lib/projects/createProjectDraft"

const TEAM_ROLE_SELECTION_SEPARATOR = "::"

const USER_TYPE_BY_SLUG = new Map<string, ProjectUserType>(
  Object.entries(USER_TYPE_SLUG).map(([userType, slug]) => [slug, userType as ProjectUserType]),
)

/** Tipos seleccionables al invitar o editar miembros del equipo. */
export const PROJECT_TEAM_SELECTABLE_USER_TYPES = PROJECT_USER_TYPES.filter(
  (userType) => userType !== "Owner",
)

export function projectUserTypeFromSlug(
  slug: string | null | undefined,
): ProjectUserType | null {
  if (!slug) return null
  return USER_TYPE_BY_SLUG.get(slug) ?? null
}

/** Etiqueta visible en equipo: los propietarios (Owner) se muestran como Admin. */
export function getProjectUserTypeDisplayLabel(
  userType: ProjectUserType | null | undefined,
): string | null {
  if (!userType) return null
  if (userType === "Owner") return "Admin"
  return userType
}

/** Normaliza el tipo para selects de equipo (Owner → Admin). */
export function getProjectUserTypeForTeamSelect(
  userType: ProjectUserType,
): ProjectUserType {
  if (userType === "Owner") return "Admin"
  return userType
}

export function mapTeamMemberUserType(userTypeRow: {
  slug: string
  label: string
} | null | undefined): {
  userType: ProjectUserType | null
  userTypeLabel: string | null
} {
  const userType = projectUserTypeFromSlug(userTypeRow?.slug)
  return {
    userType,
    userTypeLabel:
      getProjectUserTypeDisplayLabel(userType) ?? userTypeRow?.label ?? null,
  }
}

export function encodeTeamRoleSelection(
  userType: ProjectUserType,
  role: ProjectTeamRole,
): string {
  return `${userType}${TEAM_ROLE_SELECTION_SEPARATOR}${role}`
}

/** Miembros con tipo Owner (propietario del proyecto) no pueden eliminarse del equipo. */
export function isProtectedProjectOwnerMember(
  userType: ProjectUserType | null | undefined,
): boolean {
  return userType === "Owner"
}

export function decodeTeamRoleSelection(
  value: string,
): { userType: ProjectUserType; role: ProjectTeamRole } | null {
  const separatorIndex = value.indexOf(TEAM_ROLE_SELECTION_SEPARATOR)
  if (separatorIndex === -1) return null

  const userType = value.slice(0, separatorIndex) as ProjectUserType
  const role = value.slice(
    separatorIndex + TEAM_ROLE_SELECTION_SEPARATOR.length,
  ) as ProjectTeamRole

  if (!PROJECT_TEAM_SELECTABLE_USER_TYPES.includes(userType)) return null
  if (!USER_TYPE_ROLES[userType].includes(role)) return null

  return { userType, role }
}
