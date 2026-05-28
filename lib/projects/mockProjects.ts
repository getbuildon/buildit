import type { UserProjectListItem } from "@/lib/projects/types"
import { MOCK_AUTH_EMAIL } from "@/lib/auth/config"

export const MOCK_USER_PROJECTS: UserProjectListItem[] = [
  {
    projectId: "emerald",
    organizationName: "Grupo Alamo",
    name: "Torre Emerald",
    address: "Padre Patiño 651, Formosa",
    floors: 10,
    units: 38,
    progressPercent: 67,
    generalProgressPercent: 52,
  },
  {
    projectId: "life-recoleta",
    organizationName: "Grupo Alamo",
    name: "Life Recoleta",
    address: "San Roque Gonzalez 390, Asunción",
    floors: 12,
    units: 42,
    progressPercent: 42,
  },
]

export function getUserProjectsMock(): UserProjectListItem[] {
  return MOCK_USER_PROJECTS
}

export function getProjectByIdMock(projectId: string): UserProjectListItem | null {
  const id = projectId.trim().toLowerCase()
  return MOCK_USER_PROJECTS.find((p) => p.projectId === id) ?? null
}

export function displayNameFromEmail(email?: string | null): string {
  if (!email) return "Usuario"
  if (email.toLowerCase() === MOCK_AUTH_EMAIL.toLowerCase()) return "Carlos"
  const local = email.split("@")[0]?.trim()
  if (!local) return "Usuario"
  return local.charAt(0).toUpperCase() + local.slice(1)
}

export function userProfileFromEmail(email?: string | null): {
  displayName: string
  fullName: string
  initials: string
  role: string
} {
  if (email?.toLowerCase() === MOCK_AUTH_EMAIL.toLowerCase()) {
    return {
      displayName: "Carlos",
      fullName: "Carlos Mendoza",
      initials: "CM",
      role: "Administrador",
    }
  }

  const displayName = displayNameFromEmail(email)
  const initials = displayName.slice(0, 2).toUpperCase()
  return {
    displayName,
    fullName: displayName,
    initials,
    role: "Usuario",
  }
}
