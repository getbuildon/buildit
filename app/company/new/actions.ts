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
    // Usar función SQL que bypasses RLS con SECURITY DEFINER
    const { data: companyResult, error: createError } = await supabase.rpc(
      "create_company_for_user",
      {
        p_name: name,
        p_legal_name: input.legal_name?.trim() || null,
        p_country: input.country?.trim() || null,
      }
    )

    if (createError || !companyResult) {
      return { ok: false, error: createError?.message || "Error al crear la empresa." }
    }

    const companyId = companyResult

    // Agregar usuario como owner
    const { error: memberError } = await supabase.rpc(
      "add_user_as_company_owner",
      {
        p_company_id: companyId,
        p_user_id: user.id,
      }
    )

    if (memberError) {
      return { ok: false, error: memberError.message }
    }

    return { ok: true, companyId }
  } catch (err) {
    return { ok: false, error: "Error al crear la empresa." }
  }
}
