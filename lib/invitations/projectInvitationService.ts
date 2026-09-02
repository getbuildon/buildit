import type { SupabaseClient } from "@supabase/supabase-js"
import { createHash, randomBytes, timingSafeEqual } from "crypto"
import { PROJECT_ROLE_SLUG } from "@/lib/projects/catalogSlugs"
import { getPublicEmailSendError, sendTransactionalEmail } from "@/lib/email/sendTransactionalEmail"
import type { ProjectInvitationEmailKind } from "@/lib/email/renderProjectInvitationEmail"
import { findProfileByEmail } from "@/lib/invitations/findProfileByEmail"
import { getSiteOrigin } from "@/lib/invitations/siteOrigin"
import { toProjectMemberFicha } from "@/lib/projects/projectMemberFicha"

const INVITE_EXPIRY_DAYS = 7

export type { ExistingProfile } from "@/lib/invitations/findProfileByEmail"
export { findProfileByEmail } from "@/lib/invitations/findProfileByEmail"

export function buildInvitationAcceptPath(invitationId: string, token: string): string {
  const params = new URLSearchParams({
    invitation: invitationId,
    token,
  })
  return `/invite/setup?${params.toString()}`
}

export function buildInvitationAcceptUrl(invitationId: string, token: string): string {
  return `${getSiteOrigin()}${buildInvitationAcceptPath(invitationId, token)}`
}

export function invitationTokensMatch(rawToken: string, storedHash: string | null): boolean {
  if (!storedHash) return false
  const incoming = hashInvitationToken(rawToken)
  const expected = Buffer.from(storedHash)
  const actual = Buffer.from(incoming)
  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual)
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

async function disableClientUnitsInProject(
  admin: SupabaseClient,
  projectId: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: units, error: unitsError } = await admin
    .from("project_units")
    .select("id")
    .eq("project_id", projectId)

  if (unitsError) return { ok: false, error: unitsError.message }
  const unitIds = (units ?? []).map((unit) => unit.id)
  if (unitIds.length === 0) return { ok: true }

  const { error } = await admin
    .from("unit_clients")
    .update({ status: "disabled", revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "active")
    .in("unit_id", unitIds)

  if (error) return { ok: false, error: error.message }
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
      "id, project_id, email, first_name, last_name, phone, user_type_id, role_id, status, expires_at, project_roles(slug)",
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

  const ficha = toProjectMemberFicha({
    firstName: invitation.first_name,
    lastName: invitation.last_name,
    phone: invitation.phone,
  })

  const { data: existingMember } = await admin
    .from("project_members")
    .select("id, is_active")
    .eq("project_id", invitation.project_id)
    .eq("user_id", userId)
    .maybeSingle()

  if (existingMember?.is_active) {
    const { error: fichaError } = await admin
      .from("project_members")
      .update({
        user_type_id: invitation.user_type_id,
        role_id: invitation.role_id,
        ...ficha,
      })
      .eq("id", existingMember.id)
    if (fichaError) return { ok: false, error: fichaError.message }
  } else if (existingMember) {
    const { error: reactivateError } = await admin
      .from("project_members")
      .update({
        is_active: true,
        user_type_id: invitation.user_type_id,
        role_id: invitation.role_id,
        ...ficha,
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
      ...ficha,
    })
    if (memberError) return { ok: false, error: memberError.message }
  }

  if (isClient) {
    const unitsResult = await syncClientUnitsForUser(admin, invitationId, userId)
    if (!unitsResult.ok) return unitsResult
  } else {
    const disableResult = await disableClientUnitsInProject(
      admin,
      invitation.project_id,
      userId,
    )
    if (!disableResult.ok) return disableResult
  }

  const { error: acceptError } = await admin
    .from("project_invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invitationId)

  if (acceptError) return { ok: false, error: acceptError.message }

  return { ok: true, projectId: invitation.project_id }
}

function slugFromRelation(
  value: { slug?: string } | { slug?: string }[] | null | undefined,
): string | null {
  if (!value) return null
  const row = Array.isArray(value) ? value[0] : value
  return row?.slug ?? null
}

function labelFromRelation(
  value: { label?: string } | { label?: string }[] | null | undefined,
): string {
  if (!value) return ""
  const row = Array.isArray(value) ? value[0] : value
  return row?.label?.trim() || ""
}

function invitationKindFromRoleSlug(roleSlug: string | null): ProjectInvitationEmailKind {
  return roleSlug === PROJECT_ROLE_SLUG.Cliente ? "client" : "team"
}

async function loadInvitationUnitLabels(
  admin: SupabaseClient,
  invitationId: string,
): Promise<string[]> {
  const { data } = await admin
    .from("client_invitation_units")
    .select("unit:project_units ( code, name )")
    .eq("invitation_id", invitationId)

  return (data ?? [])
    .map((row) => {
      const unit = row.unit as
        | { code?: string | null; name?: string | null }
        | { code?: string | null; name?: string | null }[]
        | null
      const unitRow = Array.isArray(unit) ? unit[0] : unit
      return unitRow?.code?.trim() || unitRow?.name?.trim() || ""
    })
    .filter(Boolean)
}

export async function dispatchProjectInvitation(
  admin: SupabaseClient,
  params: {
    invitationId: string
    sendEmail?: boolean
  },
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const sendEmail = params.sendEmail !== false
  const { data: invitation, error } = await admin
    .from("project_invitations")
    .select(
      `
      id,
      email,
      first_name,
      last_name,
      status,
      invited_by,
      project_roles ( slug, label ),
      user_types ( label ),
      project:projects (
        name,
        company:companies ( name )
      )
    `,
    )
    .eq("id", params.invitationId)
    .maybeSingle()

  if (error || !invitation) {
    return { ok: false, error: "No se encontró la invitación." }
  }
  if (invitation.status !== "pending") {
    return { ok: false, error: "Esta invitación ya no está pendiente." }
  }

  const extras = buildInvitationInsertExtras()
  const acceptUrl = buildInvitationAcceptUrl(invitation.id, extras.token)
  const kind = invitationKindFromRoleSlug(slugFromRelation(invitation.project_roles as never))
  const project = invitation.project as
    | { name?: string; company?: { name?: string } | { name?: string }[] | null }
    | { name?: string; company?: { name?: string } | { name?: string }[] | null }[]
    | null
  const projectRow = Array.isArray(project) ? project[0] : project
  const company = projectRow?.company
  const companyRow = Array.isArray(company) ? company[0] : company

  const { data: inviter } = await admin
    .from("profiles")
    .select("first_name, last_name, email")
    .eq("id", invitation.invited_by as string)
    .maybeSingle()

  const inviterName =
    [inviter?.first_name, inviter?.last_name].filter(Boolean).join(" ").trim() ||
    inviter?.email ||
    "Un miembro del equipo"

  const unitLabels = kind === "client" ? await loadInvitationUnitLabels(admin, invitation.id) : []
  const emailInput = {
    kind,
    email: invitation.email,
    firstName: invitation.first_name,
    inviterName,
    projectName: projectRow?.name?.trim() || "la obra",
    organizationName: companyRow?.name?.trim() || "",
    roleLabel: labelFromRelation(invitation.project_roles as never) || "miembro del equipo",
    userTypeLabel: labelFromRelation(invitation.user_types as never) || "colaborador",
    unitLabels,
    acceptUrl,
    expiresAt: new Date(extras.expires_at),
  }

  if (sendEmail) {
    const { buildProjectInvitationEmailCopy, renderProjectInvitationEmail } = await import(
      "@/lib/email/renderProjectInvitationEmail"
    )
    const copy = buildProjectInvitationEmailCopy(emailInput)
    const sendResult = await sendTransactionalEmail({
      to: [invitation.email.trim().toLowerCase()],
      subject: copy.subject,
      html: renderProjectInvitationEmail(emailInput),
    })
    if (!sendResult.ok) {
      return {
        ok: false,
        error: getPublicEmailSendError(sendResult.error, sendResult.code),
      }
    }
  }

  const { error: updateError } = await admin
    .from("project_invitations")
    .update({
      token_hash: extras.token_hash,
      expires_at: extras.expires_at,
    })
    .eq("id", invitation.id)

  if (updateError) return { ok: false, error: updateError.message }

  return { ok: true, url: acceptUrl }
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

/** Miembro activo del equipo (no cuenta usuarios cuyo rol en el proyecto es Cliente). */
export async function findActiveTeamMemberUserId(
  admin: SupabaseClient,
  projectId: string,
  email: string,
): Promise<string | null> {
  const profile = await findProfileByEmail(admin, email)
  if (!profile) return null

  const { data: member } = await admin
    .from("project_members")
    .select("user_id, is_active, project_roles ( slug )")
    .eq("project_id", projectId)
    .eq("user_id", profile.id)
    .maybeSingle()

  if (!member?.is_active) return null

  const roleRelation = member.project_roles as
    | { slug: string }
    | { slug: string }[]
    | null
  const roleSlug = Array.isArray(roleRelation)
    ? roleRelation[0]?.slug
    : roleRelation?.slug
  if (roleSlug === PROJECT_ROLE_SLUG.Cliente) return null

  return profile.id
}

export async function findActiveClientUserIdInProject(
  admin: SupabaseClient,
  projectId: string,
  email: string,
): Promise<string | null> {
  const profile = await findProfileByEmail(admin, email)
  if (!profile) return null

  const { data: member } = await admin
    .from("project_members")
    .select("user_id, is_active, project_roles ( slug )")
    .eq("project_id", projectId)
    .eq("user_id", profile.id)
    .maybeSingle()

  if (member?.is_active) {
    const roleRelation = member.project_roles as
      | { slug: string }
      | { slug: string }[]
      | null
    const roleSlug = Array.isArray(roleRelation)
      ? roleRelation[0]?.slug
      : roleRelation?.slug
    if (roleSlug === PROJECT_ROLE_SLUG.Cliente) return profile.id
  }

  const { data: units } = await admin
    .from("project_units")
    .select("id")
    .eq("project_id", projectId)

  const unitIds = (units ?? []).map((unit) => unit.id)
  if (unitIds.length === 0) return null

  const { data: assignment } = await admin
    .from("unit_clients")
    .select("user_id")
    .eq("user_id", profile.id)
    .eq("status", "active")
    .in("unit_id", unitIds)
    .limit(1)
    .maybeSingle()

  return assignment ? profile.id : null
}

export async function assertPendingInvitationInProject(
  admin: SupabaseClient,
  invitationId: string,
  projectId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: invitation } = await admin
    .from("project_invitations")
    .select("id, status")
    .eq("id", invitationId)
    .eq("project_id", projectId)
    .maybeSingle()

  if (!invitation) {
    return { ok: false, error: "No se encontró la invitación." }
  }
  if (invitation.status !== "pending") {
    return { ok: false, error: "Esta invitación ya no está pendiente." }
  }
  return { ok: true }
}

export type PendingInvitationForAccept = {
  id: string
  email: string
  first_name: string
  last_name: string
  project_id: string
  invited_by: string
  expires_at: string | null
  roleLabel: string
  userTypeLabel: string
  projectName: string
  organizationName: string
}

export async function loadPendingInvitationForAccept(
  admin: SupabaseClient,
  invitationId: string,
  token: string,
): Promise<PendingInvitationForAccept | null> {
  const id = invitationId.trim()
  const rawToken = token.trim()
  if (!id || !rawToken) return null

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
      token_hash,
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
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    await admin
      .from("project_invitations")
      .update({ status: "expired" })
      .eq("id", invitation.id)
    return null
  }
  if (!invitationTokensMatch(rawToken, invitation.token_hash as string | null)) {
    return null
  }

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

  return {
    id: invitation.id,
    email: invitation.email,
    first_name: invitation.first_name,
    last_name: invitation.last_name,
    project_id: projectRow.id,
    invited_by: invitation.invited_by as string,
    expires_at: invitation.expires_at,
    roleLabel: roleRow?.label ?? "miembro del equipo",
    userTypeLabel: userTypeRow?.label ?? "colaborador",
    projectName: projectRow.name,
    organizationName: company?.name ?? "",
  }
}

export async function findPendingProjectInvitationByEmail(
  admin: SupabaseClient,
  projectId: string,
  email: string,
): Promise<{ id: string; isClient: boolean } | null> {
  const normalizedEmail = email.trim().toLowerCase()
  const { data: invitation } = await admin
    .from("project_invitations")
    .select("id, project_roles ( slug )")
    .eq("project_id", projectId)
    .eq("status", "pending")
    .eq("email", normalizedEmail)
    .maybeSingle()

  if (!invitation) return null

  const roleRelation = invitation.project_roles as
    | { slug: string }
    | { slug: string }[]
    | null
  const roleSlug = Array.isArray(roleRelation)
    ? roleRelation[0]?.slug
    : roleRelation?.slug

  return {
    id: invitation.id,
    isClient: roleSlug === PROJECT_ROLE_SLUG.Cliente,
  }
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

  const ficha = toProjectMemberFicha({
    firstName: params.firstName,
    lastName: params.lastName,
    phone: params.phone,
  })

  if (existingMember?.is_active) {
    const { error: fichaError } = await admin
      .from("project_members")
      .update(ficha)
      .eq("id", existingMember.id)
    if (fichaError) return { ok: false, error: fichaError.message }
  } else if (existingMember) {
    const { error: reactivateError } = await admin
      .from("project_members")
      .update({
        is_active: true,
        user_type_id: params.userTypeId,
        role_id: params.roleId,
        ...ficha,
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
      ...ficha,
    })
    if (memberError) return { ok: false, error: memberError.message }
  }

  if (params.isClient && params.unitIds) {
    const unitsResult = await syncClientUnitsDirect(admin, params.userId, params.unitIds)
    if (!unitsResult.ok) return unitsResult
  }

  return { ok: true }
}

export function buildInvitationInsertExtras(): {
  token: string
  expires_at: string
  token_hash: string
} {
  const token = createInvitationToken()
  return {
    token,
    expires_at: getInvitationExpiresAt(),
    token_hash: hashInvitationToken(token),
  }
}
