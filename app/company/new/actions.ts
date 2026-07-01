"use server"

import { createClient } from "@/utils/supabase/server"
import { requireAuthenticatedUser } from "@/lib/authHelpers"

export type CreateCompanyInput = {
  name: string
  legal_name?: string
  country?: string
}

export type CreateCompanyResult = { ok: true; companyId: string } | { ok: false; error: string }

export async function createCompany(input: CreateCompanyInput): Promise<CreateCompanyResult> {
  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

  const name = input.name.trim()
  if (!name) {
    return { ok: false, error: "El nombre de la empresa es obligatorio." }
  }

  try {
    const { data: company, error: createError } = await supabase
      .from("companies")
      .insert({
        name,
        legal_name: input.legal_name?.trim() || null,
        country: input.country?.trim() || null,
      })
      .select("id")
      .single()

    if (createError || !company) {
      return { ok: false, error: createError?.message || "Error al crear la empresa." }
    }

    const { error: memberError } = await supabase
      .from("company_members")
      .insert({
        company_id: company.id,
        user_id: user.id,
        role: "owner",
        status: "active",
      })

    if (memberError) {
      return { ok: false, error: memberError.message }
    }

    return { ok: true, companyId: company.id }
  } catch (err) {
    return { ok: false, error: "Error al crear la empresa." }
  }
}
