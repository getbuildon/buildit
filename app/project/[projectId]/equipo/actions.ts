"use server"

import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { requireAuthenticatedUser } from "@/lib/authHelpers"
import { checkProjectPermission, checkProjectSectionAccess } from "@/lib/project/projectAccess"
import { assertCanAddProjectSeat, loadTeamSeatSummary } from "@/lib/company/projectSubscriptionLimits"
import type { TeamSeatSummary } from "@/lib/company/subscriptionTypes"
import { buildPlanUpgradeRequestEmail } from "@/lib/email/buildPlanUpgradeRequestEmail"
import { getLandingLeadNotificationRecipients } from "@/lib/email/parseCommaSeparatedEmails"
import { renderLandingLeadEmail } from "@/lib/email/renderLandingLeadEmail"
import { getPublicEmailSendError, sendTransactionalEmail } from "@/lib/email/sendTransactionalEmail"
import { loadProjectCatalogIds } from "@/lib/projects/projectCatalogServer"
import { PROJECT_ROLE_SLUG, USER_TYPE_SLUG } from "@/lib/projects/catalogSlugs"
import type { ProjectTeamRole, ProjectUserType } from "@/lib/projects/createProjectDraft"
import { mapTeamMemberUserType, getProjectUserTypeDisplayLabel } from "@/lib/projects/projectUserTypeDisplay"
import {
  assertPendingInvitationInProject,
  buildInvitationInsertExtras,
  dispatchProjectInvitation,
  findActiveTeamMemberUserId,
  findPendingProjectInvitationByEmail,
} from "@/lib/invitations/projectInvitationService"
import { findProfileByEmail } from "@/lib/invitations/findProfileByEmail"
import { loadCompanyProjectAdminIds } from "@/lib/project/companyProjectAdmins"
import { toProjectMemberFicha } from "@/lib/projects/projectMemberFicha"

export type ProjectTeamMember = {
  memberId: string
  userId: string
  firstName: string
  lastName: string
  email: string
  roleLabel: string
  userType: ProjectUserType | null
  userTypeLabel: string | null
  avatarUrl: string | null
  isYou: boolean
}

export type ProjectTeamInvitation = {
  invitationId: string
  firstName: string
  lastName: string
  email: string
  roleLabel: string
  userType: ProjectUserType | null
  userTypeLabel: string | null
}

export type ProjectTeamSelfJoin = {
  firstName: string
  lastName: string
  email: string
}

export type ProjectTeamData = {
  members: ProjectTeamMember[]
  pendingInvitations: ProjectTeamInvitation[]
  seatSummary: TeamSeatSummary | null
  selfJoin: ProjectTeamSelfJoin | null
}

export async function getProjectTeamSeatSummary(
  projectId: string,
): Promise<TeamSeatSummary | null> {
  await requireAuthenticatedUser()
  const section = await checkProjectSectionAccess(projectId, "equipo")
  if (!section.ok) return null
  const supabase = await createClient()
  return loadTeamSeatSummary(supabase, projectId)
}

export async function getProjectTeamData(projectId: string): Promise<ProjectTeamData> {
  const user = await requireAuthenticatedUser()
  const section = await checkProjectSectionAccess(projectId, "equipo")
  if (!section.ok) {
    throw new Error(section.error)
  }
  const admin = createAdminClient()
  const supabase = await createClient()

  const [membersRes, invitationsRes, projectRes] = await Promise.all([
    supabase
      .from("project_members")
      .select("id, user_id, role_id, user_type_id, first_name, last_name")
      .eq("project_id", projectId)
      .eq("is_active", true),
    supabase
      .from("project_invitations")
      .select("id, email, first_name, last_name, role_id, user_type_id")
      .eq("project_id", projectId)
      .eq("status", "pending"),
    admin.from("projects").select("company_id").eq("id", projectId).maybeSingle(),
  ])

  const members = membersRes.data ?? []
  const invitations = invitationsRes.data ?? []

  const userIds = members.map((m) => m.user_id)
  const allRoleIds = [
    ...new Set([
      ...members.map((m) => m.role_id),
      ...invitations.map((i) => i.role_id),
    ]),
  ]
  const userTypeIds = [
    ...new Set([
      ...members.map((m) => m.user_type_id).filter((id): id is string => id != null),
      ...invitations.map((i) => i.user_type_id).filter((id): id is string => id != null),
    ]),
  ]

  const [profilesRes, rolesRes, userTypesRes] = await Promise.all([
    userIds.length > 0
      ? admin.from("profiles").select("id, email, avatar_url").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; email: string; avatar_url: string | null }[] }),
    allRoleIds.length > 0
      ? admin.from("project_roles").select("id, slug, label, badge").in("id", allRoleIds)
      : Promise.resolve({ data: [] as { id: string; slug: string; label: string; badge: string }[] }),
    userTypeIds.length > 0
      ? admin.from("user_types").select("id, slug, label").in("id", userTypeIds)
      : Promise.resolve({ data: [] as { id: string; slug: string; label: string }[] }),
  ])

  const profileById = new Map((profilesRes.data ?? []).map((p) => [p.id, p]))
  const roleById = new Map((rolesRes.data ?? []).map((r) => [r.id, r]))
  const userTypeById = new Map((userTypesRes.data ?? []).map((t) => [t.id, t]))

  const clienteSlug = PROJECT_ROLE_SLUG.Cliente

  const teamMembers: ProjectTeamMember[] = members
    .filter((m) => roleById.get(m.role_id)?.slug !== clienteSlug)
    .map((m) => {
      const profile = profileById.get(m.user_id)
      const role = roleById.get(m.role_id)
      const userType = m.user_type_id != null ? userTypeById.get(m.user_type_id) : null
      const mappedUserType = mapTeamMemberUserType(userType)
      return {
        memberId: m.id,
        userId: m.user_id,
        firstName: m.first_name ?? "",
        lastName: m.last_name ?? "",
        email: profile?.email ?? "",
        roleLabel: role?.label ?? "",
        userType: mappedUserType.userType,
        userTypeLabel: mappedUserType.userTypeLabel,
        avatarUrl: profile?.avatar_url ?? null,
        isYou: m.user_id === user.id,
      }
    })

  const alreadyOnTeam = teamMembers.some((member) => member.userId === user.id)
  const companyAdminIds = projectRes.data?.company_id
    ? await loadCompanyProjectAdminIds(admin, projectRes.data.company_id)
    : new Set<string>()
  const canSelfJoin = companyAdminIds.has(user.id) && !alreadyOnTeam

  let selfJoin: ProjectTeamSelfJoin | null = null
  if (canSelfJoin) {
    const { data: profile } = await admin
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", user.id)
      .maybeSingle()
    selfJoin = {
      firstName: profile?.first_name ?? "",
      lastName: profile?.last_name ?? "",
      email: profile?.email ?? user.email ?? "",
    }
  }

  const pendingInvitations: ProjectTeamInvitation[] = invitations
    .filter((i) => roleById.get(i.role_id)?.slug !== clienteSlug)
    .map((i) => {
      const role = roleById.get(i.role_id)
      const userType = i.user_type_id != null ? userTypeById.get(i.user_type_id) : null
      const mappedUserType = mapTeamMemberUserType(userType)
      return {
        invitationId: i.id,
        firstName: i.first_name,
        lastName: i.last_name,
        email: i.email,
        roleLabel: role?.label ?? "",
        userType: mappedUserType.userType,
        userTypeLabel: mappedUserType.userTypeLabel,
      }
    })

  const seatSummary = await loadTeamSeatSummary(supabase, projectId)

  return { members: teamMembers, pendingInvitations, seatSummary, selfJoin }
}

export async function addTeamMember(
  projectId: string,
  data: {
    firstName: string
    lastName: string
    email: string
    userType: ProjectUserType
    role: ProjectTeamRole
  },
): Promise<
  | { ok: true; kind: "invitation"; invitation: ProjectTeamInvitation }
  | { ok: true; kind: "member"; member: ProjectTeamMember }
  | { ok: false; error: string }
> {
  const permission = await checkProjectPermission(projectId, "addUsers")
  if (!permission.ok) return permission

  const user = await requireAuthenticatedUser()
  const supabase = await createClient()
  const admin = createAdminClient()

  const normalizedEmail = data.email.trim().toLowerCase()

  let catalog
  try {
    catalog = await loadProjectCatalogIds(supabase)
  } catch {
    return { ok: false, error: "No se pudo cargar la configuración del proyecto." }
  }

  const { data: projectRow } = await admin
    .from("projects")
    .select("company_id")
    .eq("id", projectId)
    .maybeSingle()

  try {
    const seatCheck = await assertCanAddProjectSeat(supabase, projectId, data.userType)
    if (!seatCheck.ok) return seatCheck
  } catch {
    return { ok: false, error: "No se pudo validar los límites del plan." }
  }

  const activeMemberUserId = await findActiveTeamMemberUserId(
    admin,
    projectId,
    normalizedEmail,
  )
  if (activeMemberUserId) {
    return { ok: false, error: "Ese usuario ya es miembro del equipo." }
  }

  const roleId = catalog.roleIds[data.role]
  const userTypeId = catalog.userTypeIds[data.userType]

  const { data: roleRes } = await admin
    .from("project_roles")
    .select("label")
    .eq("id", roleId)
    .single()

  const invitationPayload = {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email: normalizedEmail,
    roleLabel: roleRes?.label ?? "",
    userType: data.userType,
    userTypeLabel: getProjectUserTypeDisplayLabel(data.userType),
  }

  const existingProfile = await findProfileByEmail(admin, normalizedEmail)
  if (existingProfile && projectRow?.company_id) {
    const companyAdminIds = await loadCompanyProjectAdminIds(admin, projectRow.company_id)
    if (companyAdminIds.has(existingProfile.id)) {
      const ficha = toProjectMemberFicha({
        firstName: invitationPayload.firstName,
        lastName: invitationPayload.lastName,
      })
      const { data: inserted, error: insertError } = await admin
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: existingProfile.id,
          role_id: roleId,
          user_type_id: userTypeId,
          is_active: true,
          ...ficha,
        })
        .select("id")
        .single()

      if (insertError) return { ok: false, error: insertError.message }

      const pendingInvitation = await findPendingProjectInvitationByEmail(
        admin,
        projectId,
        normalizedEmail,
      )
      if (pendingInvitation) {
        await admin
          .from("project_invitations")
          .update({ status: "accepted", accepted_at: new Date().toISOString() })
          .eq("id", pendingInvitation.id)
      }

      const { data: profile } = await admin
        .from("profiles")
        .select("email, avatar_url")
        .eq("id", existingProfile.id)
        .maybeSingle()

      return {
        ok: true,
        kind: "member",
        member: {
          memberId: inserted.id,
          userId: existingProfile.id,
          firstName: invitationPayload.firstName,
          lastName: invitationPayload.lastName,
          email: profile?.email ?? normalizedEmail,
          roleLabel: invitationPayload.roleLabel,
          userType: invitationPayload.userType,
          userTypeLabel: invitationPayload.userTypeLabel,
          avatarUrl: profile?.avatar_url ?? null,
          isYou: existingProfile.id === user.id,
        },
      }
    }
  }

  const pendingInvitation = await findPendingProjectInvitationByEmail(
    admin,
    projectId,
    normalizedEmail,
  )
  if (pendingInvitation) {
    const { error: updateError } = await admin
      .from("project_invitations")
      .update({
        first_name: invitationPayload.firstName,
        last_name: invitationPayload.lastName,
        user_type_id: userTypeId,
        role_id: roleId,
        invited_by: user.id,
      })
      .eq("id", pendingInvitation.id)
      .eq("project_id", projectId)
      .eq("status", "pending")

    if (updateError) return { ok: false, error: updateError.message }

    if (pendingInvitation.isClient) {
      await admin.from("client_invitation_units").delete().eq("invitation_id", pendingInvitation.id)
    }

    const emailResult = await dispatchProjectInvitation(admin, {
      invitationId: pendingInvitation.id,
    })
    if (!emailResult.ok) return emailResult

    return {
      ok: true,
      kind: "invitation",
      invitation: {
        invitationId: pendingInvitation.id,
        ...invitationPayload,
      },
    }
  }

  const invitationExtras = buildInvitationInsertExtras()

  const { data: invitation, error } = await supabase
    .from("project_invitations")
    .insert({
      project_id: projectId,
      company_id: projectRow?.company_id ?? null,
      email: normalizedEmail,
      first_name: invitationPayload.firstName,
      last_name: invitationPayload.lastName,
      user_type_id: userTypeId,
      role_id: roleId,
      status: "pending",
      invited_by: user.id,
      expires_at: invitationExtras.expires_at,
      token_hash: invitationExtras.token_hash,
    })
    .select("id, email, first_name, last_name, role_id, user_type_id")
    .single()

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Ya existe una invitación pendiente para ese correo." }
    }
    return { ok: false, error: error.message }
  }

  const emailResult = await dispatchProjectInvitation(admin, {
    invitationId: invitation.id,
  })

  if (!emailResult.ok) {
    await admin.from("project_invitations").update({ status: "revoked" }).eq("id", invitation.id)
    return emailResult
  }

  return {
    ok: true,
    kind: "invitation",
    invitation: {
      invitationId: invitation.id,
      ...invitationPayload,
    },
  }
}

export async function copyTeamInvitationLink(
  invitationId: string,
  projectId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const permission = await checkProjectPermission(projectId, "addUsers")
  if (!permission.ok) return permission

  await requireAuthenticatedUser()
  const admin = createAdminClient()
  const pending = await assertPendingInvitationInProject(admin, invitationId, projectId)
  if (!pending.ok) return pending

  return dispatchProjectInvitation(admin, {
    invitationId,
    sendEmail: false,
  })
}

export async function resendTeamInvitation(
  invitationId: string,
  projectId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const permission = await checkProjectPermission(projectId, "addUsers")
  if (!permission.ok) return permission

  await requireAuthenticatedUser()
  const admin = createAdminClient()
  const pending = await assertPendingInvitationInProject(admin, invitationId, projectId)
  if (!pending.ok) return pending

  const result = await dispatchProjectInvitation(admin, { invitationId })
  if (!result.ok) return result
  return { ok: true }
}

export async function removeTeamMember(
  memberId: string,
  projectId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const permission = await checkProjectPermission(projectId, "editPermissions")
  if (!permission.ok) return permission

  await requireAuthenticatedUser()
  const supabase = await createClient()

  const { data: memberRow } = await supabase
    .from("project_members")
    .select("user_id, user_type_id")
    .eq("id", memberId)
    .eq("project_id", projectId)
    .single()

  if (!memberRow) {
    return { ok: false, error: "Miembro no encontrado." }
  }

  if (memberRow.user_type_id) {
    const admin = createAdminClient()
    const { data: userTypeRow } = await admin
      .from("user_types")
      .select("slug")
      .eq("id", memberRow.user_type_id)
      .maybeSingle()

    if (userTypeRow?.slug === USER_TYPE_SLUG.Owner) {
      return {
        ok: false,
        error: "No se puede eliminar al propietario del proyecto.",
      }
    }
  }

  const { error } = await supabase
    .from("project_members")
    .update({ is_active: false })
    .eq("id", memberId)
    .eq("project_id", projectId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function updateTeamMember(
  memberId: string,
  projectId: string,
  data: { userType: ProjectUserType; role: ProjectTeamRole },
): Promise<
  | { ok: true; userType: ProjectUserType; userTypeLabel: string | null; roleLabel: string }
  | { ok: false; error: string }
> {
  const permission = await checkProjectPermission(projectId, "editPermissions")
  if (!permission.ok) return permission

  await requireAuthenticatedUser()
  const supabase = await createClient()
  const admin = createAdminClient()

  let catalog
  try {
    catalog = await loadProjectCatalogIds(supabase)
  } catch {
    return { ok: false, error: "No se pudo cargar la configuración del proyecto." }
  }

  const { data: memberRow } = await supabase
    .from("project_members")
    .select("user_type_id")
    .eq("id", memberId)
    .eq("project_id", projectId)
    .maybeSingle()

  if (memberRow?.user_type_id) {
    const { data: currentType } = await admin
      .from("user_types")
      .select("slug")
      .eq("id", memberRow.user_type_id)
      .maybeSingle()
    if (currentType?.slug === USER_TYPE_SLUG.Owner) {
      return { ok: false, error: "No se puede editar al propietario de la obra." }
    }
  }

  try {
    const seatCheck = await assertCanAddProjectSeat(supabase, projectId, data.userType, {
      excludeMemberId: memberId,
    })
    if (!seatCheck.ok) return seatCheck
  } catch {
    return { ok: false, error: "No se pudo validar los límites del plan." }
  }

  const { error } = await supabase
    .from("project_members")
    .update({
      role_id: catalog.roleIds[data.role],
      user_type_id: catalog.userTypeIds[data.userType],
    })
    .eq("id", memberId)
    .eq("project_id", projectId)

  if (error) return { ok: false, error: error.message }

  const [roleRes] = await Promise.all([
    admin.from("project_roles").select("label").eq("id", catalog.roleIds[data.role]).single(),
  ])

  return {
    ok: true,
    userType: data.userType,
    roleLabel: roleRes.data?.label ?? data.role,
    userTypeLabel: getProjectUserTypeDisplayLabel(data.userType),
  }
}

export async function revokeTeamInvitation(
  invitationId: string,
  projectId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const permission = await checkProjectPermission(projectId, "addUsers")
  if (!permission.ok) return permission

  await requireAuthenticatedUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from("project_invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("project_id", projectId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function submitPlanUpgradeRequest(
  projectId: string,
  data:
    | { kind: "userType"; userType: ProjectUserType; comments?: string }
    | {
        kind: "surface"
        planSurfaceMaxM2: number
        unitsSurfaceM2: number
        comments?: string
      },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const permission = await checkProjectPermission(projectId, "addUsers")
  if (!permission.ok) return permission

  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

  const [projectRes, seatSummary, profileRes, subscriptionRes] = await Promise.all([
    supabase
      .from("projects")
      .select("name, company:companies ( name )")
      .eq("id", projectId)
      .maybeSingle(),
    data.kind === "userType" ? loadTeamSeatSummary(supabase, projectId) : Promise.resolve(null),
    supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("project_subscriptions")
      .select("plan:subscription_plans ( name )")
      .eq("project_id", projectId)
      .eq("status", "active")
      .maybeSingle(),
  ])

  if (!projectRes.data) {
    return { ok: false, error: "No se encontró el proyecto." }
  }

  if (data.kind === "userType" && !seatSummary) {
    return { ok: false, error: "Este proyecto no tiene un plan activo con límites." }
  }

  const company = Array.isArray(projectRes.data.company)
    ? projectRes.data.company[0]
    : projectRes.data.company
  const plan = Array.isArray(subscriptionRes.data?.plan)
    ? subscriptionRes.data?.plan[0]
    : subscriptionRes.data?.plan

  const requesterName = [
    profileRes.data?.first_name?.trim(),
    profileRes.data?.last_name?.trim(),
  ]
    .filter(Boolean)
    .join(" ")
    .trim() || user.email || "Usuario sin nombre"

  const emailContent =
    data.kind === "surface"
      ? buildPlanUpgradeRequestEmail({
          kind: "surface",
          requesterName,
          requesterEmail: profileRes.data?.email ?? user.email ?? "—",
          companyName: company?.name?.trim() || "—",
          projectName: projectRes.data.name,
          planName: plan?.name?.trim() || "—",
          planSurfaceMaxM2: data.planSurfaceMaxM2,
          unitsSurfaceM2: data.unitsSurfaceM2,
          comments: data.comments,
        })
      : buildPlanUpgradeRequestEmail({
          kind: "userType",
          requesterName,
          requesterEmail: profileRes.data?.email ?? user.email ?? "—",
          companyName: company?.name?.trim() || "—",
          projectName: projectRes.data.name,
          planName: plan?.name?.trim() || "—",
          userType: data.userType,
          seatSummary: seatSummary as TeamSeatSummary,
          comments: data.comments,
        })

  const recipients = getLandingLeadNotificationRecipients()
  if (recipients.length === 0) {
    return {
      ok: false,
      error: "No hay destinatarios configurados (LANDING_LEAD_NOTIFICATION_EMAILS).",
    }
  }

  const html = renderLandingLeadEmail({
    emailTitle: emailContent.emailTitle,
    heading: emailContent.heading,
    intro: emailContent.intro,
    rows: emailContent.rows,
  })

  const sendResult = await sendTransactionalEmail({
    to: recipients,
    subject: emailContent.subject,
    html,
  })

  if (!sendResult.ok) {
    console.error("[equipo/plan-upgrade] Error al enviar email:", sendResult.error)
    return {
      ok: false,
      error: getPublicEmailSendError(sendResult.error, sendResult.code),
    }
  }

  return { ok: true }
}
