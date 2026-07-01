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

  const { data: members, error } = await supabase
    .from("company_members")
    .select(`
      id,
      user_id,
      role,
      status,
      created_at,
      user:auth.users (
        email
      )
    `)
    .eq("company_id", companyId)
    .eq("status", "active")
    .order("created_at", { ascending: true })

  if (error) {
    return { ok: false, error: error.message }
  }

  const formattedMembers = members?.map((m: any) => ({
    id: m.id,
    user_id: m.user_id,
    email: m.user?.email || "",
    role: m.role,
    status: m.status,
    joined_at: m.created_at,
  })) || []

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
