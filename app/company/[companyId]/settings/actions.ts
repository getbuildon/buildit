"use server"

import { createClient } from "@/utils/supabase/server"
import { requireAuthenticatedUser } from "@/lib/authHelpers"

export type CompanyInfo = {
  id: string
  name: string
  legal_name: string | null
  country: string | null
}

export type UpdateCompanyInfoInput = {
  companyId: string
  name: string
  legal_name?: string
  country?: string
}

export type UpdateResult = { ok: true } | { ok: false; error: string }

export async function getCompanyInfo(companyId: string): Promise<CompanyInfo | null> {
  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

  // Verificar que el usuario es member de esta company
  const { data: membership } = await supabase
    .from("company_members")
    .select("id")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (!membership) return null

  // Obtener info de la company
  const { data: company, error } = await supabase
    .from("companies")
    .select("id, name, legal_name, country")
    .eq("id", companyId)
    .maybeSingle()

  if (error || !company) return null

  return company
}

export async function updateCompanyInfo(input: UpdateCompanyInfoInput): Promise<UpdateResult> {
  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

  // Verificar que el usuario es admin/owner
  const { data: membership } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", input.companyId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { ok: false, error: "No tienes permisos para modificar esta empresa." }
  }

  const name = input.name.trim()
  if (!name) {
    return { ok: false, error: "El nombre de la empresa es obligatorio." }
  }

  const { error } = await supabase
    .from("companies")
    .update({
      name,
      legal_name: input.legal_name?.trim() || null,
      country: input.country?.trim() || null,
    })
    .eq("id", input.companyId)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
