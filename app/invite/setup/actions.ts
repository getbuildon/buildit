"use server"

import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"
import { requireAuthenticatedUser } from "@/lib/authHelpers"
import { getPasswordStrengthError, mapPasswordPolicyError } from "@/lib/auth/passwordValidation"
import { acceptProjectInvitation } from "@/lib/invitations/projectInvitationService"

export type InvitationSetupData = {
  invitationId: string
  firstName: string
  lastName: string
  projectId: string
  projectName: string
  organizationName: string
  inviterName: string
  roleLabel: string
  userTypeLabel: string
}

function formatPersonName(firstName: string, lastName: string, fallback: string) {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim()
  return name || fallback
}

export async function getInvitationSetupData(
  invitationId: string,
): Promise<InvitationSetupData | null> {
  const user = await requireAuthenticatedUser()
  const admin = createAdminClient()
  const id = invitationId.trim()
  if (!id) return null

  const { data: invitation, error } = await admin
    .from("project_invitations")
    .select(
      `
      id,
      email,
      first_name,
      last_name,
      status,
      expires_at,
      project_id,
      invited_by,
      role:project_roles ( label ),
      user_type:user_types ( label ),
      project:projects (
        id,
        name,
        company:companies ( name )
      )
    `,
    )
    .eq("id", id)
    .maybeSingle()

  if (error || !invitation) return null
  if (invitation.status !== "pending") return null
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) return null
  if (invitation.email.trim().toLowerCase() !== user.email?.trim().toLowerCase()) return null

  const project = invitation.project as
    | {
        id: string
        name: string
        company: { name: string } | { name: string }[] | null
      }
    | {
        id: string
        name: string
        company: { name: string } | { name: string }[] | null
      }[]
    | null

  const projectRow = Array.isArray(project) ? project[0] : project
  if (!projectRow) return null

  const company = Array.isArray(projectRow.company)
    ? projectRow.company[0]
    : projectRow.company

  const role = invitation.role as { label: string } | { label: string }[] | null
  const userType = invitation.user_type as { label: string } | { label: string }[] | null
  const roleRow = Array.isArray(role) ? role[0] : role
  const userTypeRow = Array.isArray(userType) ? userType[0] : userType

  const { data: inviterProfile } = await admin
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", invitation.invited_by as string)
    .maybeSingle()

  return {
    invitationId: invitation.id,
    firstName: invitation.first_name,
    lastName: invitation.last_name,
    projectId: projectRow.id,
    projectName: projectRow.name,
    organizationName: company?.name ?? "",
    inviterName: formatPersonName(
      inviterProfile?.first_name ?? "",
      inviterProfile?.last_name ?? "",
      "Un miembro del equipo",
    ),
    roleLabel: roleRow?.label ?? "miembro del equipo",
    userTypeLabel: userTypeRow?.label ?? "colaborador",
  }
}

export async function completeInvitationSetup(
  invitationId: string,
  password: string,
): Promise<{ ok: true; projectId: string } | { ok: false; error: string }> {
  const trimmed = password.trim()
  const strengthError = getPasswordStrengthError(trimmed)
  if (strengthError) {
    return { ok: false, error: strengthError }
  }

  const user = await requireAuthenticatedUser()
  const supabase = await createClient()
  const admin = createAdminClient()

  const { error: passwordError } = await supabase.auth.updateUser({
    password: trimmed,
    data: { invitation_id: null },
  })
  if (passwordError) {
    return {
      ok: false,
      error:
        mapPasswordPolicyError(passwordError.message) ??
        "No pudimos guardar la contraseña. Intentá de nuevo.",
    }
  }

  const acceptResult = await acceptProjectInvitation(
    admin,
    invitationId,
    user.id,
    user.email ?? "",
  )

  return acceptResult
}
