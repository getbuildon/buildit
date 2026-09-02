"use server"

import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"
import { getPasswordStrengthError, mapPasswordPolicyError } from "@/lib/auth/passwordValidation"
import {
  acceptProjectInvitation,
  buildInvitationAcceptPath,
  findProfileByEmail,
  loadPendingInvitationForAccept,
} from "@/lib/invitations/projectInvitationService"

export type InvitationSetupData = {
  invitationId: string
  token: string
  firstName: string
  lastName: string
  email: string
  projectId: string
  projectName: string
  organizationName: string
  inviterName: string
  roleLabel: string
  userTypeLabel: string
}

export type InvitationAcceptContext =
  | { status: "invalid" }
  | { status: "wrong_account"; email: string }
  | { status: "login_required"; nextPath: string }
  | { status: "ready"; mode: "setup" | "confirm"; data: InvitationSetupData }

function formatPersonName(firstName: string, lastName: string, fallback: string) {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim()
  return name || fallback
}

export async function getInvitationAcceptContext(
  invitationId: string,
  token: string,
): Promise<InvitationAcceptContext> {
  const admin = createAdminClient()
  const invitation = await loadPendingInvitationForAccept(admin, invitationId, token)
  if (!invitation) return { status: "invalid" }

  const { data: inviterProfile } = await admin
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", invitation.invited_by)
    .maybeSingle()

  const data: InvitationSetupData = {
    invitationId: invitation.id,
    token: token.trim(),
    firstName: invitation.first_name,
    lastName: invitation.last_name,
    email: invitation.email,
    projectId: invitation.project_id,
    projectName: invitation.projectName,
    organizationName: invitation.organizationName,
    inviterName: formatPersonName(
      inviterProfile?.first_name ?? "",
      inviterProfile?.last_name ?? "",
      "Un miembro del equipo",
    ),
    roleLabel: invitation.roleLabel,
    userTypeLabel: invitation.userTypeLabel,
  }

  const existingProfile = await findProfileByEmail(admin, invitation.email)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const sessionEmail = user?.email?.trim().toLowerCase() ?? null
  const inviteEmail = invitation.email.trim().toLowerCase()

  if (sessionEmail && sessionEmail !== inviteEmail) {
    return { status: "wrong_account", email: invitation.email }
  }

  if (existingProfile) {
    if (!user) {
      return {
        status: "login_required",
        nextPath: buildInvitationAcceptPath(invitation.id, token.trim()),
      }
    }
    return { status: "ready", mode: "confirm", data }
  }

  if (user && sessionEmail === inviteEmail) {
    return { status: "ready", mode: "confirm", data }
  }

  return { status: "ready", mode: "setup", data }
}

export async function completeInvitationSetup(
  invitationId: string,
  token: string,
  password: string,
): Promise<{ ok: true; projectId: string } | { ok: false; error: string }> {
  const trimmed = password.trim()
  const strengthError = getPasswordStrengthError(trimmed)
  if (strengthError) {
    return { ok: false, error: strengthError }
  }

  const admin = createAdminClient()
  const invitation = await loadPendingInvitationForAccept(admin, invitationId, token)
  if (!invitation) {
    return { ok: false, error: "La invitación no es válida o expiró." }
  }

  const existingProfile = await findProfileByEmail(admin, invitation.email)
  if (existingProfile) {
    return {
      ok: false,
      error: "Este correo ya tiene una cuenta. Iniciá sesión para aceptar la invitación.",
    }
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: invitation.email.trim().toLowerCase(),
    password: trimmed,
    email_confirm: true,
    user_metadata: {
      first_name: invitation.first_name,
      last_name: invitation.last_name,
    },
  })

  if (createError || !created.user) {
    const alreadyExists =
      createError?.message?.toLowerCase().includes("already") ||
      createError?.message?.toLowerCase().includes("registered") ||
      createError?.message?.toLowerCase().includes("exists")
    return {
      ok: false,
      error: alreadyExists
        ? "Este correo ya tiene una cuenta. Iniciá sesión para aceptar la invitación."
        : mapPasswordPolicyError(createError?.message ?? "") ??
          "No pudimos crear tu cuenta. Intentá de nuevo.",
    }
  }

  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invitation.email.trim().toLowerCase(),
    password: trimmed,
  })
  if (signInError) {
    return {
      ok: false,
      error:
        "Tu cuenta se creó, pero no pudimos iniciar sesión. Entrá con tu correo y contraseña para aceptar la invitación.",
    }
  }

  return acceptProjectInvitation(admin, invitation.id, created.user.id, invitation.email)
}

export async function confirmInvitationAcceptance(
  invitationId: string,
  token: string,
): Promise<{ ok: true; projectId: string } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    return { ok: false, error: "Tenés que iniciar sesión para aceptar esta invitación." }
  }

  const admin = createAdminClient()
  const invitation = await loadPendingInvitationForAccept(admin, invitationId, token)
  if (!invitation) {
    return { ok: false, error: "La invitación no es válida o expiró." }
  }

  return acceptProjectInvitation(admin, invitation.id, user.id, user.email)
}
