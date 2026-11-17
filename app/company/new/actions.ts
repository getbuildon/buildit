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
  await requireAuthenticatedUser()
  const supabase = await createClient()

  const name = input.name.trim()
  if (!name) {
    return { ok: false, error: "El nombre de la empresa es obligatorio." }
  }

  try {
    // Crea la empresa y agrega al usuario actual como owner en una sola transacción.
    // La función toma el usuario de la sesión (auth.uid()), no de un parámetro.
    const { data: companyId, error: createError } = await supabase.rpc(
      "create_company_with_owner",
      {
        p_name: name,
        p_legal_name: input.legal_name?.trim() || null,
        p_country: input.country?.trim() || null,
      }
    )

    if (createError || !companyId) {
      return { ok: false, error: createError?.message || "Error al crear la empresa." }
    }

    return { ok: true, companyId: companyId as string }
  } catch (err) {
    return { ok: false, error: "Error al crear la empresa." }
  }
}
