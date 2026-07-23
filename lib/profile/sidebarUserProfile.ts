import type { ProfileData } from "@/app/[projectId]/perfil/actions"
import { displayNameFromEmail } from "@/lib/projects/mockProjects"
import { getUserInitials } from "@/lib/profile/userInitials"

export type SidebarUserProfile = {
  firstName: string
  lastName: string
  fullName: string
  initials: string
  roleLabel: string
  email: string
  avatarUrl: string | null
}

export function toSidebarUserProfile(
  data: ProfileData | null,
  email?: string | null,
): SidebarUserProfile {
  const resolvedEmail = data?.email ?? email ?? ""
  const firstName = data?.first_name?.trim() ?? ""
  const lastName = data?.last_name?.trim() ?? ""
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    displayNameFromEmail(resolvedEmail)

  const initials = getUserInitials(firstName, lastName, resolvedEmail)

  return {
    firstName,
    lastName,
    fullName,
    initials: initials || "U",
    roleLabel: data?.role_label ?? "Usuario",
    email: resolvedEmail,
    avatarUrl: data?.avatar_url ?? null,
  }
}
