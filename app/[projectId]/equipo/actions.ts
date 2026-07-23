"use server"

import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { requireAuthenticatedUser } from "@/lib/authHelpers"
import { checkProjectPermission } from "@/lib/project/projectAccess"
import { assertCanAddProjectSeat, loadTeamSeatSummary } from "@/lib/company/projectSubscriptionLimits"
import type { TeamSeatSummary } from "@/lib/company/subscriptionTypes"
import { loadProjectCatalogIds } from "@/lib/projects/projectCatalogServer"
import { PROJECT_ROLE_SLUG } from "@/lib/projects/catalogSlugs"
import type { ProjectTeamRole, ProjectUserType } from "@/lib/projects/createProjectDraft"
import {
  addExistingUserToProject,
  buildInvitationInsertExtras,
  dispatchProjectInvitation,
  findActiveProjectMemberUserId,
  findProfileByEmail,
} from "@/lib/invitations/projectInvitationService"

export type ProjectTeamMember = {
  memberId: string
  userId: string
  firstName: string
  lastName: string
  email: string
  roleLabel: string
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
  userTypeLabel: string | null
}

export type ProjectTeamData = {
  members: ProjectTeamMember[]
  pendingInvitations: ProjectTeamInvitation[]
  seatSummary: TeamSeatSummary | null
}

export async function getProjectTeamSeatSummary(
  projectId: string,
): Promise<TeamSeatSummary | null> {
  await requireAuthenticatedUser()
  const supabase = await createClient()
  return loadTeamSeatSummary(supabase, projectId)
}

export async function getProjectTeamData(projectId: string): Promise<ProjectTeamData> {
  const user = await requireAuthenticatedUser()
  const admin = createAdminClient()
  const supabase = await createClient()

  const [membersRes, invitationsRes] = await Promise.all([
    supabase
      .from("project_members")
      .select("id, user_id, role_id, user_type_id")
      .eq("project_id", projectId)
      .eq("is_active", true),
    supabase
      .from("project_invitations")
      .select("id, email, first_name, last_name, role_id, user_type_id")
      .eq("project_id", projectId)
      .eq("status", "pending"),
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
      ? admin.from("profiles").select("id, first_name, last_name, email, avatar_url").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; first_name: string; last_name: string; email: string; avatar_url: string | null }[] }),
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
      return {
        memberId: m.id,
        userId: m.user_id,
        firstName: profile?.first_name ?? "",
        lastName: profile?.last_name ?? "",
        email: profile?.email ?? "",
        roleLabel: role?.label ?? "",
        userTypeLabel: userType?.label ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        isYou: m.user_id === user.id,
      }
    })

  const pendingInvitations: ProjectTeamInvitation[] = invitations
    .filter((i) => roleById.get(i.role_id)?.slug !== clienteSlug)
    .map((i) => {
      const role = roleById.get(i.role_id)
      const userType = i.user_type_id != null ? userTypeById.get(i.user_type_id) : null
      return {
        invitationId: i.id,
        firstName: i.first_name,
        lastName: i.last_name,
        email: i.email,
        roleLabel: role?.label ?? "",
        userTypeLabel: userType?.label ?? null,
      }
    })

  const seatSummary = await loadTeamSeatSummary(supabase, projectId)

  return { members: teamMembers, pendingInvitations, seatSummary }
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
  | { ok: true; kind: "member_added"; member: ProjectTeamMember }
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

  try {
    const seatCheck = await assertCanAddProjectSeat(supabase, projectId, data.userType)
    if (!seatCheck.ok) return seatCheck
  } catch {
    return { ok: false, error: "No se pudo validar los límites del plan." }
  }

  const activeMemberUserId = await findActiveProjectMemberUserId(
    admin,
    projectId,
    normalizedEmail,
  )
  if (activeMemberUserId) {
    return { ok: false, error: "Ese usuario ya es miembro del proyecto." }
  }

  const roleId = catalog.roleIds[data.role]
  const userTypeId = catalog.userTypeIds[data.userType]

  const [roleRes, userTypeRes] = await Promise.all([
    admin.from("project_roles").select("label").eq("id", roleId).single(),
    admin.from("user_types").select("label").eq("id", userTypeId).single(),
  ])

  const existingProfile = await findProfileByEmail(admin, normalizedEmail)
  if (existingProfile) {
    const addResult = await addExistingUserToProject(admin, {
      projectId,
      userId: existingProfile.id,
      firstName: data.firstName,
      lastName: data.lastName,
      userTypeId,
      roleId,
      isClient: false,
    })
    if (!addResult.ok) return addResult

    const { data: memberRow } = await admin
      .from("project_members")
      .select("id, user_id")
      .eq("project_id", projectId)
      .eq("user_id", existingProfile.id)
      .eq("is_active", true)
      .single()

    const { data: profileRow } = await admin
      .from("profiles")
      .select("first_name, last_name, email, avatar_url")
      .eq("id", existingProfile.id)
      .single()

    return {
      ok: true,
      kind: "member_added",
      member: {
        memberId: memberRow?.id ?? existingProfile.id,
        userId: existingProfile.id,
        firstName: profileRow?.first_name ?? data.firstName.trim(),
        lastName: profileRow?.last_name ?? data.lastName.trim(),
        email: profileRow?.email ?? normalizedEmail,
        roleLabel: roleRes.data?.label ?? data.role,
        userTypeLabel: userTypeRes.data?.label ?? data.userType,
        avatarUrl: profileRow?.avatar_url ?? null,
        isYou: existingProfile.id === user.id,
      },
    }
  }

  const { data: projectRow } = await admin
    .from("projects")
    .select("company_id")
    .eq("id", projectId)
    .single()

  const invitationExtras = buildInvitationInsertExtras()

  const { data: invitation, error } = await supabase
    .from("project_invitations")
    .insert({
      project_id: projectId,
      company_id: projectRow?.company_id ?? null,
      email: normalizedEmail,
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
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
    email: invitation.email,
    firstName: invitation.first_name,
    lastName: invitation.last_name,
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
      firstName: invitation.first_name,
      lastName: invitation.last_name,
      email: invitation.email,
      roleLabel: roleRes.data?.label ?? "",
      userTypeLabel: userTypeRes.data?.label ?? null,
    },
  }
}

export async function removeTeamMember(
  memberId: string,
  projectId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const permission = await checkProjectPermission(projectId, "editPermissions")
  if (!permission.ok) return permission

  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

  const { data: memberRow } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("id", memberId)
    .eq("project_id", projectId)
    .single()

  if (memberRow?.user_id === user.id) {
    return { ok: false, error: "No podés eliminar tu propio acceso." }
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
  | { ok: true; userTypeLabel: string | null; roleLabel: string }
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

  const [roleRes, userTypeRes] = await Promise.all([
    admin.from("project_roles").select("label").eq("id", catalog.roleIds[data.role]).single(),
    admin.from("user_types").select("label").eq("id", catalog.userTypeIds[data.userType]).single(),
  ])

  return {
    ok: true,
    roleLabel: roleRes.data?.label ?? data.role,
    userTypeLabel: userTypeRes.data?.label ?? data.userType,
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
