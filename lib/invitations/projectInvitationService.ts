import type { SupabaseClient } from "@supabase/supabase-js"
import { createHash, randomBytes } from "crypto"
import { PROJECT_ROLE_SLUG } from "@/lib/projects/catalogSlugs"
import { getSiteOrigin } from "@/lib/invitations/siteOrigin"

const INVITE_EXPIRY_DAYS = 7

export type ExistingProfile = {
  id: string
  email: string
  first_name: string
  last_name: string
}

export function buildInviteSetupPath(invitationId: string): string {
  return `/invite/setup?invitation=${encodeURIComponent(invitationId)}`
}

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function createInvitationToken(): string {
  return randomBytes(32).toString("hex")
}

export function getInvitationExpiresAt(): string {
  return new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

export async function findProfileByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<ExistingProfile | null> {
  const normalized = email.trim().toLowerCase()
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, first_name, last_name")
    .eq("email", normalized)
    .maybeSingle()

  if (error || !data) return null
  return data
}

async function syncClientUnitsForUser(
  admin: SupabaseClient,
  invitationId: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: unitRows, error: unitsError } = await admin
    .from("client_invitation_units")
    .select("unit_id")
    .eq("invitation_id", invitationId)

  if (unitsError) {
    if (unitsError.code === "42P01") return { ok: true }
    return { ok: false, error: unitsError.message }
  }

  for (const row of unitRows ?? []) {
    const { data: existing } = await admin
      .from("unit_clients")
      .select("id, status")
      .eq("unit_id", row.unit_id)
      .eq("user_id", userId)
      .maybeSingle()

    if (existing?.status === "disabled") {
      const { error } = await admin
        .from("unit_clients")
        .update({ status: "active", revoked_at: null })
        .eq("id", existing.id)
      if (error) return { ok: false, error: error.message }
    } else if (!existing) {
      const { error } = await admin.from("unit_clients").insert({
        unit_id: row.unit_id,
        user_id: userId,
        status: "active",
      })
      if (error) return { ok: false, error: error.message }
    }
  }

  return { ok: true }
}

export async function acceptProjectInvitation(
  admin: SupabaseClient,
  invitationId: string,
  userId: string,
  userEmail: string,
): Promise<{ ok: true; projectId: string } | { ok: false; error: string }> {
  const { data: invitation, error: invitationError } = await admin
    .from("project_invitations")
    .select(
      "id, project_id, email, first_name, last_name, phone, user_type_id, role_id, status, expires_at, project_roles(slug), user_types(slug)",
    )
    .eq("id", invitationId)
    .maybeSingle()

  if (invitationError || !invitation) {
    return { ok: false, error: "La invitación no existe o ya no es válida." }
  }

  if (invitation.status !== "pending") {
    return { ok: false, error: "Esta invitación ya fue utilizada o revocada." }
  }

  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    await admin
      .from("project_invitations")
      .update({ status: "expired" })
      .eq("id", invitationId)
    return { ok: false, error: "La invitación expiró. Pedí una nueva invitación." }
  }

  const normalizedInviteEmail = invitation.email.trim().toLowerCase()
  if (normalizedInviteEmail !== userEmail.trim().toLowerCase()) {
    return { ok: false, error: "Esta invitación pertenece a otro correo electrónico." }
  }

  const roleRelation = invitation.project_roles as { slug: string } | { slug: string }[] | null
  const roleSlug = Array.isArray(roleRelation) ? roleRelation[0]?.slug : roleRelation?.slug
  const isClient = roleSlug === PROJECT_ROLE_SLUG.Cliente

  const { data: existingMember } = await admin
    .from("project_members")
    .select("id, is_active")
    .eq("project_id", invitation.project_id)
    .eq("user_id", userId)
    .maybeSingle()

  if (existingMember?.is_active) {
    // Ya es miembro activo: marcar invitación aceptada y sincronizar unidades de cliente si aplica.
    if (isClient) {
      const unitsResult = await syncClientUnitsForUser(admin, invitationId, userId)
      if (!unitsResult.ok) return unitsResult
    }
  } else {
    if (existingMember) {
      const { error: reactivateError } = await admin
        .from("project_members")
        .update({
          is_active: true,
          user_type_id: invitation.user_type_id,
          role_id: invitation.role_id,
        })
        .eq("id", existingMember.id)
      if (reactivateError) return { ok: false, error: reactivateError.message }
    } else {
      const { error: memberError } = await admin.from("project_members").insert({
        project_id: invitation.project_id,
        user_id: userId,
        user_type_id: invitation.user_type_id,
        role_id: invitation.role_id,
        is_active: true,
      })
      if (memberError) return { ok: false, error: memberError.message }
    }

    if (isClient) {
      const unitsResult = await syncClientUnitsForUser(admin, invitationId, userId)
      if (!unitsResult.ok) return unitsResult
    }
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      first_name: invitation.first_name.trim(),
      last_name: invitation.last_name.trim(),
      phone: invitation.phone?.trim() || null,
    })
    .eq("id", userId)

  if (profileError) return { ok: false, error: profileError.message }

  const { error: acceptError } = await admin
    .from("project_invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invitationId)

  if (acceptError) return { ok: false, error: acceptError.message }

  return { ok: true, projectId: invitation.project_id }
}

export async function sendProjectInvitationEmail(
  admin: SupabaseClient,
  params: {
    invitationId: string
    email: string
    firstName: string
    lastName: string
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const siteOrigin = getSiteOrigin()
  const redirectTo = `${siteOrigin}/auth/callback?next=${encodeURIComponent(buildInviteSetupPath(params.invitationId))}`

  const { error } = await admin.auth.admin.inviteUserByEmail(params.email.trim().toLowerCase(), {
    redirectTo,
    data: {
      first_name: params.firstName.trim(),
      last_name: params.lastName.trim(),
      invitation_id: params.invitationId,
    },
  })

  if (error) {
    return {
      ok: false,
      error:
        error.message.includes("already been registered") ||
        error.message.includes("already registered")
          ? "Ese correo ya tiene una cuenta. Pedile que inicie sesión para acceder al proyecto."
          : error.message,
    }
  }

  return { ok: true }
}

export async function addExistingUserToProjectFromInvitation(
  admin: SupabaseClient,
  invitationId: string,
  userId: string,
  email: string,
): Promise<{ ok: true; projectId: string } | { ok: false; error: string }> {
  return acceptProjectInvitation(admin, invitationId, userId, email)
}

async function syncClientUnitsDirect(
  admin: SupabaseClient,
  userId: string,
  unitIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: currentRows, error: currentError } = await admin
    .from("unit_clients")
    .select("unit_id, status")
    .eq("user_id", userId)
    .eq("status", "active")

  if (currentError) return { ok: false, error: currentError.message }

  const currentIds = new Set((currentRows ?? []).map((row) => row.unit_id))
  const nextIds = new Set(unitIds)

  const toDisable = [...currentIds].filter((unitId) => !nextIds.has(unitId))
  const toEnable = [...nextIds].filter((unitId) => !currentIds.has(unitId))

  if (toDisable.length > 0) {
    const { error } = await admin
      .from("unit_clients")
      .update({ status: "disabled", revoked_at: new Date().toISOString() })
      .eq("user_id", userId)
      .in("unit_id", toDisable)
      .eq("status", "active")

    if (error) return { ok: false, error: error.message }
  }

  for (const unitId of toEnable) {
    const { data: existing } = await admin
      .from("unit_clients")
      .select("id, status")
      .eq("user_id", userId)
      .eq("unit_id", unitId)
      .maybeSingle()

    if (existing?.status === "disabled") {
      const { error } = await admin
        .from("unit_clients")
        .update({ status: "active", revoked_at: null })
        .eq("id", existing.id)
      if (error) return { ok: false, error: error.message }
    } else if (!existing) {
      const { error } = await admin.from("unit_clients").insert({
        unit_id: unitId,
        user_id: userId,
        status: "active",
      })
      if (error) return { ok: false, error: error.message }
    }
  }

  return { ok: true }
}

export async function findActiveProjectMemberUserId(
  admin: SupabaseClient,
  projectId: string,
  email: string,
): Promise<string | null> {
  const profile = await findProfileByEmail(admin, email)
  if (!profile) return null

  const { data: member } = await admin
    .from("project_members")
    .select("user_id, is_active")
    .eq("project_id", projectId)
    .eq("user_id", profile.id)
    .maybeSingle()

  if (!member?.is_active) return null
  return profile.id
}

export async function addExistingUserToProject(
  admin: SupabaseClient,
  params: {
    projectId: string
    userId: string
    firstName: string
    lastName: string
    phone?: string | null
    userTypeId: string | null
    roleId: string
    isClient: boolean
    unitIds?: string[]
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: existingMember } = await admin
    .from("project_members")
    .select("id, is_active")
    .eq("project_id", params.projectId)
    .eq("user_id", params.userId)
    .maybeSingle()

  if (existingMember?.is_active) {
    // Ya es miembro activo.
  } else if (existingMember) {
    const { error: reactivateError } = await admin
      .from("project_members")
      .update({
        is_active: true,
        user_type_id: params.userTypeId,
        role_id: params.roleId,
      })
      .eq("id", existingMember.id)
    if (reactivateError) return { ok: false, error: reactivateError.message }
  } else {
    const { error: memberError } = await admin.from("project_members").insert({
      project_id: params.projectId,
      user_id: params.userId,
      user_type_id: params.userTypeId,
      role_id: params.roleId,
      is_active: true,
    })
    if (memberError) return { ok: false, error: memberError.message }
  }

  if (params.isClient && params.unitIds) {
    const unitsResult = await syncClientUnitsDirect(admin, params.userId, params.unitIds)
    if (!unitsResult.ok) return unitsResult
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      first_name: params.firstName.trim(),
      last_name: params.lastName.trim(),
      phone: params.phone?.trim() || null,
    })
    .eq("id", params.userId)

  if (profileError) return { ok: false, error: profileError.message }

  return { ok: true }
}

export function buildInvitationInsertExtras(): {
  expires_at: string
  token_hash: string
} {
  const token = createInvitationToken()
  return {
    expires_at: getInvitationExpiresAt(),
    token_hash: hashInvitationToken(token),
  }
}

export async function dispatchProjectInvitation(
  admin: SupabaseClient,
  params: {
    invitationId: string
    email: string
    firstName: string
    lastName: string
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  return sendProjectInvitationEmail(admin, params)
}
