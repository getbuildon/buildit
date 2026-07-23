"use server"

import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"
import { requireAuthenticatedUser } from "@/lib/authHelpers"
import { acceptProjectInvitation } from "@/lib/invitations/projectInvitationService"

export type InvitationSetupData = {
  invitationId: string
  firstName: string
  lastName: string
  projectId: string
  projectName: string
  organizationName: string
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

  return {
    invitationId: invitation.id,
    firstName: invitation.first_name,
    lastName: invitation.last_name,
    projectId: projectRow.id,
    projectName: projectRow.name,
    organizationName: company?.name ?? "",
  }
}

export async function completeInvitationSetup(
  invitationId: string,
  password: string,
): Promise<{ ok: true; projectId: string } | { ok: false; error: string }> {
  const trimmed = password.trim()
  if (trimmed.length < 8) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." }
  }

  const user = await requireAuthenticatedUser()
  const supabase = await createClient()
  const admin = createAdminClient()

  const { error: passwordError } = await supabase.auth.updateUser({ password: trimmed })
  if (passwordError) {
    return { ok: false, error: passwordError.message }
  }

  const acceptResult = await acceptProjectInvitation(
    admin,
    invitationId,
    user.id,
    user.email ?? "",
  )

  return acceptResult
}
