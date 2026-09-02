"use server"

import { revalidatePath } from "next/cache"

import { requireBackofficeUser } from "@/lib/auth/backofficeAccess"
import { BACKOFFICE_EMPRESAS_PAGE_SIZE } from "@/lib/backoffice/empresasQuery"
import { COMPANY_ROLES, type CompanyRole } from "@/lib/company/formatCompanyRole"
import { createAdminClient } from "@/utils/supabase/admin"

export type BackofficeCompanyOwner = {
  userId: string
  name: string
  email: string
}

export type BackofficeCompanyRow = {
  id: string
  name: string
  legalName: string | null
  country: string | null
  taxId: string | null
  owner: BackofficeCompanyOwner | null
  memberCount: number
  createdAt: string
}

export type BackofficeOwnerCandidate = {
  id: string
  name: string
  email: string
}

export type BackofficeCompanyActionResult = { ok: true } | { ok: false; error: string }

export type BackofficeCompanyRole = CompanyRole

export type BackofficeCompanyMember = {
  id: string
  userId: string
  name: string
  email: string
  role: BackofficeCompanyRole
}

export type BackofficeCompanyInput = {
  name: string
  legalName?: string
  country?: string
  taxId?: string
  ownerUserId?: string | null
}

export type GetBackofficeCompaniesParams = {
  page?: number
  pageSize?: number
  search?: string
}

export type BackofficeCompaniesResult = {
  companies: BackofficeCompanyRow[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

type CompanyRow = {
  id: string
  name: string
  legal_name: string | null
  country: string | null
  tax_id: string | null
  created_at: string
}

function sanitizeSearchTerm(search: string): string {
  return search.trim().replace(/[%_,]/g, " ")
}

function parsePage(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return 1
  return Math.max(1, Math.floor(value))
}

function parsePageSize(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return BACKOFFICE_EMPRESAS_PAGE_SIZE
  return Math.min(100, Math.max(1, Math.floor(value)))
}

function normalizeCompanyInput(input: BackofficeCompanyInput) {
  const name = input.name.trim()

  if (!name) {
    return { ok: false as const, error: "El nombre de la empresa es obligatorio." }
  }

  return {
    ok: true as const,
    data: {
      name,
      legal_name: input.legalName?.trim() || null,
      country: input.country?.trim() || null,
      tax_id: input.taxId?.trim() || null,
    },
  }
}

function formatProfileName(
  firstName: string,
  lastName: string,
  email: string,
): string {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim()
  return name || email
}

async function getOwnersByCompanyIds(
  admin: ReturnType<typeof createAdminClient>,
  companyIds: string[],
): Promise<Map<string, BackofficeCompanyOwner>> {
  if (companyIds.length === 0) return new Map()

  const { data: ownerMembers, error } = await admin
    .from("company_members")
    .select("company_id, user_id")
    .in("company_id", companyIds)
    .eq("role", "owner")
    .eq("status", "active")

  if (error) {
    throw new Error(error.message)
  }

  if (!ownerMembers?.length) return new Map()

  const userIds = [...new Set(ownerMembers.map((row) => row.user_id as string))]

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, first_name, last_name, email")
    .in("id", userIds)

  if (profilesError) {
    throw new Error(profilesError.message)
  }

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id as string, profile]),
  )

  const ownersByCompany = new Map<string, BackofficeCompanyOwner>()

  for (const row of ownerMembers) {
    const companyId = row.company_id as string
    if (ownersByCompany.has(companyId)) continue

    const profile = profileById.get(row.user_id as string)
    if (!profile) continue

    ownersByCompany.set(companyId, {
      userId: profile.id as string,
      name: formatProfileName(
        profile.first_name ?? "",
        profile.last_name ?? "",
        profile.email,
      ),
      email: profile.email,
    })
  }

  return ownersByCompany
}

async function validateUserCanBeCompanyOwner(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  exceptCompanyId?: string,
): Promise<BackofficeCompanyActionResult | { ok: true }> {
  let query = admin
    .from("company_members")
    .select("company_id")
    .eq("user_id", userId)
    .eq("role", "owner")
    .eq("status", "active")
    .limit(1)

  if (exceptCompanyId) {
    query = query.neq("company_id", exceptCompanyId)
  }

  const { data, error } = await query

  if (error) {
    return { ok: false, error: error.message }
  }

  if (data && data.length > 0) {
    return {
      ok: false,
      error: "Este usuario ya es owner de otra empresa.",
    }
  }

  return { ok: true }
}

async function assignCompanyOwner(
  admin: ReturnType<typeof createAdminClient>,
  companyId: string,
  userId: string,
): Promise<BackofficeCompanyActionResult> {
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle()

  if (profileError) {
    return { ok: false, error: profileError.message }
  }

  if (!profile) {
    return { ok: false, error: "No encontramos ese usuario." }
  }

  const ownerValidation = await validateUserCanBeCompanyOwner(
    admin,
    userId,
    companyId,
  )
  if (!ownerValidation.ok) {
    return ownerValidation
  }

  const { error: demoteError } = await admin
    .from("company_members")
    .update({ role: "admin" })
    .eq("company_id", companyId)
    .eq("role", "owner")
    .eq("status", "active")

  if (demoteError) {
    return { ok: false, error: demoteError.message }
  }

  const { data: existingMember, error: existingError } = await admin
    .from("company_members")
    .select("id")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle()

  if (existingError) {
    return { ok: false, error: existingError.message }
  }

  if (existingMember) {
    const { error } = await admin
      .from("company_members")
      .update({ role: "owner" })
      .eq("id", existingMember.id)

    if (error) {
      return { ok: false, error: error.message }
    }
  } else {
    const { error } = await admin.from("company_members").insert({
      company_id: companyId,
      user_id: userId,
      role: "owner",
      status: "active",
    })

    if (error) {
      return { ok: false, error: error.message }
    }
  }

  return { ok: true }
}

async function getActiveMemberCountsByCompany(
  admin: ReturnType<typeof createAdminClient>,
  companyIds: string[],
): Promise<Map<string, number>> {
  if (companyIds.length === 0) return new Map()

  const { data, error } = await admin
    .from("company_members")
    .select("company_id")
    .in("company_id", companyIds)
    .eq("status", "active")

  if (error) {
    throw new Error(error.message)
  }

  const counts = new Map<string, number>()

  for (const row of data ?? []) {
    const companyId = row.company_id as string
    counts.set(companyId, (counts.get(companyId) ?? 0) + 1)
  }

  return counts
}

function mapCompanyRows(
  rows: CompanyRow[],
  memberCounts: Map<string, number>,
  ownersByCompany: Map<string, BackofficeCompanyOwner>,
): BackofficeCompanyRow[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    legalName: row.legal_name,
    country: row.country,
    taxId: row.tax_id,
    owner: ownersByCompany.get(row.id) ?? null,
    memberCount: memberCounts.get(row.id) ?? 0,
    createdAt: row.created_at,
  }))
}

export async function getBackofficeCompanies(
  params: GetBackofficeCompaniesParams = {},
): Promise<BackofficeCompaniesResult> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const page = parsePage(params.page)
  const pageSize = parsePageSize(params.pageSize)
  const search = sanitizeSearchTerm(params.search ?? "")

  let query = admin
    .from("companies")
    .select("id, name, legal_name, country, tax_id, created_at", { count: "exact" })
    .order("created_at", { ascending: false })

  if (search) {
    const pattern = `%${search}%`
    query = query.or(
      `name.ilike.${pattern},legal_name.ilike.${pattern},country.ilike.${pattern},tax_id.ilike.${pattern}`,
    )
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as CompanyRow[]
  const companyIds = rows.map((row) => row.id)
  const [memberCounts, ownersByCompany] = await Promise.all([
    getActiveMemberCountsByCompany(admin, companyIds),
    getOwnersByCompanyIds(admin, companyIds),
  ])

  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return {
    companies: mapCompanyRows(rows, memberCounts, ownersByCompany),
    totalCount,
    page: Math.min(page, totalPages),
    pageSize,
    totalPages,
  }
}

export async function createBackofficeCompany(
  input: BackofficeCompanyInput,
): Promise<BackofficeCompanyActionResult> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const normalized = normalizeCompanyInput(input)
  if (!normalized.ok) return normalized

  const { data: created, error } = await admin
    .from("companies")
    .insert(normalized.data)
    .select("id")
    .single()

  if (error || !created) {
    return { ok: false, error: error?.message ?? "No pudimos crear la empresa." }
  }

  if (input.ownerUserId) {
    const ownerResult = await assignCompanyOwner(admin, created.id, input.ownerUserId)
    if (!ownerResult.ok) {
      await admin.from("companies").delete().eq("id", created.id)
      return ownerResult
    }
  }

  revalidatePath("/backoffice/empresas")
  return { ok: true }
}

export async function searchBackofficeOwnerCandidates(
  search: string,
  options?: { exceptCompanyId?: string },
): Promise<BackofficeOwnerCandidate[]> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const term = sanitizeSearchTerm(search)
  if (!term) return []

  const pattern = `%${term}%`
  const { data, error } = await admin
    .from("profiles")
    .select("id, first_name, last_name, email")
    .or(
      `email.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern}`,
    )
    .order("created_at", { ascending: false })
    .limit(5)

  if (error) {
    throw new Error(error.message)
  }

  let blockedOwnerQuery = admin
    .from("company_members")
    .select("user_id")
    .eq("role", "owner")
    .eq("status", "active")

  if (options?.exceptCompanyId) {
    blockedOwnerQuery = blockedOwnerQuery.neq("company_id", options.exceptCompanyId)
  }

  const { data: existingOwners, error: ownersError } = await blockedOwnerQuery

  if (ownersError) {
    throw new Error(ownersError.message)
  }

  const blockedOwnerIds = new Set(
    (existingOwners ?? []).map((row) => row.user_id as string),
  )

  return (data ?? [])
    .filter((profile) => !blockedOwnerIds.has(profile.id as string))
    .map((profile) => ({
      id: profile.id as string,
      name: formatProfileName(
        profile.first_name ?? "",
        profile.last_name ?? "",
        profile.email,
      ),
      email: profile.email,
    }))
}

export async function updateBackofficeCompany(
  companyId: string,
  input: BackofficeCompanyInput,
): Promise<BackofficeCompanyActionResult> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const normalized = normalizeCompanyInput(input)
  if (!normalized.ok) return normalized

  const { data: existing, error: existingError } = await admin
    .from("companies")
    .select("id")
    .eq("id", companyId)
    .maybeSingle()

  if (existingError) {
    return { ok: false, error: existingError.message }
  }

  if (!existing) {
    return { ok: false, error: "No encontramos esa empresa." }
  }

  const { error } = await admin
    .from("companies")
    .update(normalized.data)
    .eq("id", companyId)

  if (error) {
    return { ok: false, error: error.message }
  }

  if (input.ownerUserId) {
    const ownersByCompany = await getOwnersByCompanyIds(admin, [companyId])
    const currentOwner = ownersByCompany.get(companyId)

    if (currentOwner?.userId !== input.ownerUserId) {
      const ownerResult = await assignCompanyOwner(admin, companyId, input.ownerUserId)
      if (!ownerResult.ok) {
        return ownerResult
      }
    }
  }

  revalidatePath("/backoffice/empresas")
  return { ok: true }
}

function isCompanyRole(value: string): value is BackofficeCompanyRole {
  return (COMPANY_ROLES as readonly string[]).includes(value)
}

export async function getBackofficeCompanyMembers(
  companyId: string,
): Promise<BackofficeCompanyMember[]> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const { data: members, error } = await admin
    .from("company_members")
    .select("id, user_id, role")
    .eq("company_id", companyId)
    .eq("status", "active")
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const userIds = [...new Set((members ?? []).map((row) => row.user_id as string))]
  if (userIds.length === 0) return []

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, first_name, last_name, email")
    .in("id", userIds)

  if (profilesError) {
    throw new Error(profilesError.message)
  }

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id as string, profile]),
  )

  return (members ?? [])
    .map((row) => {
      const profile = profileById.get(row.user_id as string)
      if (!profile || !isCompanyRole(row.role)) return null

      return {
        id: row.id as string,
        userId: profile.id as string,
        name: formatProfileName(
          profile.first_name ?? "",
          profile.last_name ?? "",
          profile.email,
        ),
        email: profile.email,
        role: row.role,
      }
    })
    .filter((member): member is BackofficeCompanyMember => member !== null)
}

export async function searchBackofficeMemberCandidates(
  search: string,
  options?: { companyId?: string; role?: BackofficeCompanyRole },
): Promise<BackofficeOwnerCandidate[]> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const term = sanitizeSearchTerm(search)
  if (!term) return []

  const pattern = `%${term}%`
  const { data, error } = await admin
    .from("profiles")
    .select("id, first_name, last_name, email")
    .or(
      `email.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern}`,
    )
    .order("created_at", { ascending: false })
    .limit(8)

  if (error) {
    throw new Error(error.message)
  }

  const blockedIds = new Set<string>()

  if (options?.companyId) {
    const { data: companyMembers, error: membersError } = await admin
      .from("company_members")
      .select("user_id, role")
      .eq("company_id", options.companyId)
      .eq("status", "active")

    if (membersError) {
      throw new Error(membersError.message)
    }

    for (const row of companyMembers ?? []) {
      if (!options.role || row.role === options.role) {
        blockedIds.add(row.user_id as string)
      }
    }
  }

  if (options?.role === "owner") {
    let blockedOwnerQuery = admin
      .from("company_members")
      .select("user_id")
      .eq("role", "owner")
      .eq("status", "active")

    if (options.companyId) {
      blockedOwnerQuery = blockedOwnerQuery.neq("company_id", options.companyId)
    }

    const { data: existingOwners, error: ownersError } = await blockedOwnerQuery
    if (ownersError) {
      throw new Error(ownersError.message)
    }

    for (const row of existingOwners ?? []) {
      blockedIds.add(row.user_id as string)
    }
  }

  return (data ?? [])
    .filter((profile) => !blockedIds.has(profile.id as string))
    .map((profile) => ({
      id: profile.id as string,
      name: formatProfileName(
        profile.first_name ?? "",
        profile.last_name ?? "",
        profile.email,
      ),
      email: profile.email,
    }))
}

export async function addBackofficeCompanyMember(
  companyId: string,
  userId: string,
  role: BackofficeCompanyRole,
): Promise<BackofficeCompanyActionResult> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("id")
    .eq("id", companyId)
    .maybeSingle()

  if (companyError) return { ok: false, error: companyError.message }
  if (!company) return { ok: false, error: "No encontramos esa empresa." }

  if (role === "owner") {
    const result = await assignCompanyOwner(admin, companyId, userId)
    if (result.ok) revalidatePath("/backoffice/empresas")
    return result
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle()

  if (profileError) return { ok: false, error: profileError.message }
  if (!profile) return { ok: false, error: "No encontramos ese usuario." }

  const { data: existingMember, error: existingError } = await admin
    .from("company_members")
    .select("id, role, status")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .maybeSingle()

  if (existingError) return { ok: false, error: existingError.message }

  if (existingMember?.status === "active" && existingMember.role === "owner") {
    const { data: owners, error: ownersError } = await admin
      .from("company_members")
      .select("id")
      .eq("company_id", companyId)
      .eq("role", "owner")
      .eq("status", "active")

    if (ownersError) return { ok: false, error: ownersError.message }
    if ((owners ?? []).length === 1) {
      return { ok: false, error: "La empresa debe tener al menos un owner." }
    }
  }

  if (existingMember) {
    const { error } = await admin
      .from("company_members")
      .update({ role, status: "active", disabled_at: null })
      .eq("id", existingMember.id)

    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await admin.from("company_members").insert({
      company_id: companyId,
      user_id: userId,
      role,
      status: "active",
    })

    if (error) return { ok: false, error: error.message }
  }

  revalidatePath("/backoffice/empresas")
  return { ok: true }
}

export async function removeBackofficeCompanyMember(
  companyId: string,
  memberId: string,
): Promise<BackofficeCompanyActionResult> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const { data: targetMember, error: targetError } = await admin
    .from("company_members")
    .select("id, role")
    .eq("id", memberId)
    .eq("company_id", companyId)
    .eq("status", "active")
    .maybeSingle()

  if (targetError) return { ok: false, error: targetError.message }
  if (!targetMember) return { ok: false, error: "No encontramos ese miembro." }

  if (targetMember.role === "owner") {
    const { data: owners, error: ownersError } = await admin
      .from("company_members")
      .select("id")
      .eq("company_id", companyId)
      .eq("role", "owner")
      .eq("status", "active")

    if (ownersError) return { ok: false, error: ownersError.message }
    if ((owners ?? []).length === 1) {
      return { ok: false, error: "La empresa debe tener al menos un owner." }
    }
  }

  const { error } = await admin
    .from("company_members")
    .update({ status: "disabled", disabled_at: new Date().toISOString() })
    .eq("id", memberId)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/backoffice/empresas")
  return { ok: true }
}

export async function deleteBackofficeCompany(
  companyId: string,
): Promise<BackofficeCompanyActionResult> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const { data: existing, error: existingError } = await admin
    .from("companies")
    .select("id, name")
    .eq("id", companyId)
    .maybeSingle()

  if (existingError) {
    return { ok: false, error: existingError.message }
  }

  if (!existing) {
    return { ok: false, error: "No encontramos esa empresa." }
  }

  const { error } = await admin.from("companies").delete().eq("id", companyId)

  if (error) {
    const message = error.message.toLowerCase()

    if (
      message.includes("foreign key") ||
      message.includes("violates") ||
      message.includes("restrict")
    ) {
      return {
        ok: false,
        error:
          "No se puede eliminar esta empresa porque tiene proyectos o datos asociados.",
      }
    }

    return { ok: false, error: error.message }
  }

  revalidatePath("/backoffice/empresas")
  return { ok: true }
}
