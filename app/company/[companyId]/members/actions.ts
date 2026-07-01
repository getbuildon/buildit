"use server"

import { createClient } from "@/utils/supabase/server"
import { requireAuthenticatedUser } from "@/lib/authHelpers"

export type CompanyMember = {
  id: string
  user_id: string | null
  email: string
  role: "owner" | "admin" | "billing" | "member"
  status: "active" | "invited" | "disabled"
  joined_at: string | null
}

export type MembersResult = { ok: true; members: CompanyMember[] } | { ok: false; error: string }
export type UpdateMemberResult = { ok: true } | { ok: false; error: string }
export type RemoveMemberResult = { ok: true } | { ok: false; error: string }

export async function getCompanyMembers(companyId: string): Promise<MembersResult> {
  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

  // Verificar que el usuario es miembro de esta company
  const { data: membership } = await supabase
    .from("company_members")
    .select("id")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (!membership) {
    return { ok: false, error: "No tienes acceso a esta empresa." }
  }

  // Obtener miembros activos de la empresa
  const { data: members, error: membersError } = await supabase
    .from("company_members")
    .select("id, user_id, role, status, created_at")
    .eq("company_id", companyId)
    .eq("status", "active")
    .order("created_at", { ascending: true })

  if (membersError) {
    return { ok: false, error: membersError.message }
  }

  // Obtener invitaciones pendientes
  const { data: invitations, error: invitationsError } = await supabase
    .from("company_invitations")
    .select("id, email, role, created_at")
    .eq("company_id", companyId)
    .eq("status", "pending")
    .order("created_at", { ascending: true })

  if (invitationsError) {
    return { ok: false, error: invitationsError.message }
  }

  // Obtener emails de los usuarios activos
  let emailMap = new Map<string, string>()
  if (members && members.length > 0) {
    const userIds = members.map((m) => m.user_id)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds)

    if (profilesError) {
      return { ok: false, error: profilesError.message }
    }

    emailMap = new Map(profiles?.map((p) => [p.id, p.email]) || [])
  }

  // Formatear miembros activos
  const formattedMembers = (members || []).map((m) => ({
    id: m.id,
    user_id: m.user_id,
    email: emailMap.get(m.user_id) || "",
    role: m.role,
    status: m.status as "active" | "invited" | "disabled",
    joined_at: m.created_at,
  }))

  // Agregar invitaciones pendientes
  const formattedInvitations = (invitations || []).map((inv) => ({
    id: inv.id,
    user_id: null,
    email: inv.email,
    role: inv.role,
    status: "invited" as const,
    joined_at: inv.created_at,
  }))

  const allMembers = [...formattedMembers, ...formattedInvitations]

  return { ok: true, members: allMembers as CompanyMember[] }
}

export async function updateMemberRole(
  companyId: string,
  memberId: string,
  newRole: "owner" | "admin" | "billing" | "member"
): Promise<UpdateMemberResult> {
  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

  // Verificar que el usuario es admin/owner
  const { data: userMembership } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (!userMembership || !["owner", "admin"].includes(userMembership.role)) {
    return { ok: false, error: "No tienes permisos para modificar miembros." }
  }

  // Obtener información del miembro a actualizar
  const { data: targetMember } = await supabase
    .from("company_members")
    .select("id, user_id")
    .eq("id", memberId)
    .eq("company_id", companyId)
    .maybeSingle()

  if (!targetMember) {
    return { ok: false, error: "Miembro no encontrado." }
  }

  // No permitir cambiar el rol del único owner
  if (newRole !== "owner") {
    const { data: owners } = await supabase
      .from("company_members")
      .select("id")
      .eq("company_id", companyId)
      .eq("role", "owner")
      .eq("status", "active")

    if (owners && owners.length === 1 && owners[0].id === memberId) {
      return { ok: false, error: "La empresa debe tener al menos un propietario." }
    }
  }

  const { error } = await supabase
    .from("company_members")
    .update({ role: newRole })
    .eq("id", memberId)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

export type InviteMemberResult = { ok: true } | { ok: false; error: string }

export async function inviteMember(
  companyId: string,
  email: string,
  role: "owner" | "admin" | "billing" | "member"
): Promise<InviteMemberResult> {
  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

  // Verificar que el usuario es owner/admin
  const { data: userMembership } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (!userMembership || !["owner", "admin"].includes(userMembership.role)) {
    return { ok: false, error: "No tienes permisos para agregar miembros." }
  }

  const trimmedEmail = email.trim().toLowerCase()

  // Validar formato básico de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
    return { ok: false, error: "Por favor ingresá un email válido." }
  }

  // Buscar si el usuario ya existe (registrado)
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", trimmedEmail)
    .maybeSingle()

  if (profile) {
    // Usuario existe - agregarlo como miembro activo
    const { data: existing } = await supabase
      .from("company_members")
      .select("id")
      .eq("company_id", companyId)
      .eq("user_id", profile.id)
      .maybeSingle()

    if (existing) {
      return { ok: false, error: "Este usuario ya es miembro de la empresa." }
    }

    // Crear miembro activo
    const { error } = await supabase
      .from("company_members")
      .insert({
        company_id: companyId,
        user_id: profile.id,
        role,
        status: "active",
      })

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true }
  }

  // Usuario no existe - crear invitación pendiente
  const { data: existingInvite } = await supabase
    .from("company_invitations")
    .select("id, status")
    .eq("company_id", companyId)
    .eq("email", trimmedEmail)
    .maybeSingle()

  if (existingInvite) {
    if (existingInvite.status === "pending") {
      return { ok: false, error: "Ya existe una invitación pendiente para este email." }
    }
  }

  // Crear nueva invitación
  const { error: inviteError } = await supabase
    .from("company_invitations")
    .insert({
      company_id: companyId,
      email: trimmedEmail,
      role,
      invited_by: user.id,
    })

  if (inviteError) {
    return { ok: false, error: inviteError.message }
  }

  return { ok: true }
}

export async function removeMember(companyId: string, memberId: string): Promise<RemoveMemberResult> {
  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

  // Verificar que el usuario es admin/owner
  const { data: userMembership } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (!userMembership || !["owner", "admin"].includes(userMembership.role)) {
    return { ok: false, error: "No tienes permisos para eliminar miembros." }
  }

  // Obtener información del miembro a eliminar
  const { data: targetMember } = await supabase
    .from("company_members")
    .select("id, role")
    .eq("id", memberId)
    .eq("company_id", companyId)
    .maybeSingle()

  if (!targetMember) {
    return { ok: false, error: "Miembro no encontrado." }
  }

  // No permitir eliminar el único owner
  if (targetMember.role === "owner") {
    const { data: owners } = await supabase
      .from("company_members")
      .select("id")
      .eq("company_id", companyId)
      .eq("role", "owner")
      .eq("status", "active")

    if (owners && owners.length === 1) {
      return { ok: false, error: "La empresa debe tener al menos un propietario." }
    }
  }

  const { error } = await supabase
    .from("company_members")
    .update({ status: "disabled" })
    .eq("id", memberId)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

export async function revokeInvitation(companyId: string, invitationId: string): Promise<RemoveMemberResult> {
  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

  // Verificar que el usuario es admin/owner
  const { data: userMembership } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (!userMembership || !["owner", "admin"].includes(userMembership.role)) {
    return { ok: false, error: "No tienes permisos para revocar invitaciones." }
  }

  const { error } = await supabase
    .from("company_invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("company_id", companyId)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
