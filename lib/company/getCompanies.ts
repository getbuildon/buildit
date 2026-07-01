"use server"

import { createClient } from "@/utils/supabase/server"
import { getAuthenticatedUserOrNull } from "@/lib/authHelpers"

export type CompanyData = {
  id: string
  name: string
  role: string
}

export async function getUserCompanies(): Promise<CompanyData[]> {
  const user = await getAuthenticatedUserOrNull()
  if (!user) return []

  const supabase = await createClient()

  const { data: memberships, error } = await supabase
    .from("company_members")
    .select("company_id, role, company:companies(id, name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (error || !memberships) return []

  return memberships
    .map((m: any) => {
      const company = m.company as { id: string; name: string } | { id: string; name: string }[] | null
      if (!company) return null
      const companyData = Array.isArray(company) ? company[0] : company
      if (!companyData) return null
      return {
        id: companyData.id,
        name: companyData.name,
        role: m.role,
      }
    })
    .filter((c): c is CompanyData => c !== null)
}

export async function getCompanyById(companyId: string): Promise<CompanyData | null> {
  const user = await getAuthenticatedUserOrNull()
  if (!user) return null

  const supabase = await createClient()

  const { data: membership, error } = await supabase
    .from("company_members")
    .select("company_id, role, company:companies(id, name)")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (error || !membership) return null

  const company = membership.company as { id: string; name: string } | { id: string; name: string }[] | null
  if (!company) return null
  const companyData = Array.isArray(company) ? company[0] : company
  if (!companyData) return null

  return {
    id: companyData.id,
    name: companyData.name,
    role: membership.role,
  }
}
