"use server"

import { createClient } from "@/utils/supabase/server"
import { requireAuthenticatedUser } from "@/lib/authHelpers"

export type CompanyMember = {
  id: string
  user_id: string
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

  // Obtener miembros de la empresa
  const { data: members, error: membersError } = await supabase
    .from("company_members")
    .select("id, user_id, role, status, created_at")
    .eq("company_id", companyId)
    .eq("status", "active")
    .order("created_at", { ascending: true })

  if (membersError) {
    return { ok: false, error: membersError.message }
  }

  if (!members || members.length === 0) {
    return { ok: true, members: [] }
  }

  // Obtener emails de los usuarios
  const userIds = members.map((m) => m.user_id)
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", userIds)

  if (profilesError) {
    return { ok: false, error: profilesError.message }
  }

  const emailMap = new Map(profiles?.map((p) => [p.id, p.email]) || [])

  const formattedMembers = members.map((m) => ({
    id: m.id,
    user_id: m.user_id,
    email: emailMap.get(m.user_id) || "",
    role: m.role,
    status: m.status,
    joined_at: m.created_at,
  }))

  return { ok: true, members: formattedMembers as CompanyMember[] }
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
  if (!trimmedEmail) {
    return { ok: false, error: "El email es obligatorio." }
  }

  // Buscar el perfil por email
  const { data: allProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email")

  if (profilesError) {
    return { ok: false, error: "Error al buscar usuarios." }
  }

  if (!allProfiles || allProfiles.length === 0) {
    return { ok: false, error: "No hay usuarios registrados aún." }
  }

  const profile = allProfiles.find(p => {
    const profileEmail = (p.email || "").toLowerCase().trim()
    return profileEmail === trimmedEmail
  })

  let userId = profile?.id

  if (!userId) {
    // Si no existe perfil, intentar encontrar el user_id en auth.users por email
    // Buscar un usuario con ese email que no tenga perfil
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers()
    const targetUser = authUser?.users?.find(u => u.email?.toLowerCase() === trimmedEmail)

    if (!targetUser) {
      const availableEmails = allProfiles.slice(0, 5).map(p => p.email).join(", ")
      const hint = allProfiles.length > 5 ? ` (ej: ${availableEmails}...)` : ` (disponibles: ${availableEmails})`
      return { ok: false, error: `No existe un usuario registrado con el email "${email}". Verifica que el email sea exacto${hint}` }
    }

    userId = targetUser.id

    // Crear el perfil si no existe
    const { error: createError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email: targetUser.email || trimmedEmail,
        first_name: "",
        last_name: "",
      })

    if (createError && !createError.message.includes("duplicate")) {
      return { ok: false, error: "Error al crear el perfil del usuario." }
    }
  }

  // Verificar si ya es miembro
  const { data: existing } = await supabase
    .from("company_members")
    .select("id")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .maybeSingle()

  if (existing) {
    return { ok: false, error: "Este usuario ya es miembro de la empresa." }
  }

  // Agregar como miembro
  const { error } = await supabase
    .from("company_members")
    .insert({
      company_id: companyId,
      user_id: userId,
      role,
      status: "active",
    })

  if (error) {
    return { ok: false, error: error.message }
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
