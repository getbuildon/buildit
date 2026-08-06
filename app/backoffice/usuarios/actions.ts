"use server"

import { revalidatePath } from "next/cache"

import { isBackofficeEmail, requireBackofficeUser } from "@/lib/auth/backofficeAccess"
import { buildRegisterConfirmCallbackUrl } from "@/lib/auth/registerConfirmPath"
import { BACKOFFICE_USERS_PAGE_SIZE } from "@/lib/backoffice/usuariosQuery"
import { getCollaborationProjectCountsByUserIds } from "@/lib/backoffice/collaborationProjectCounts"
import { formatCompanyRole } from "@/lib/company/formatCompanyRole"
import { getSiteOrigin } from "@/lib/invitations/siteOrigin"
import { createAdminClient } from "@/utils/supabase/admin"

import type { BackofficeUsersStatusKind } from "@/lib/backoffice/usuariosQuery"
import { resolveBackofficeUsersStatusFilter } from "@/lib/backoffice/usuariosQuery"

export type BackofficeUserMembership = {
  companyName: string
  role: string
  status: string
}

export type BackofficeUserRow = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  avatarUrl: string | null
  createdAt: string
  memberships: BackofficeUserMembership[]
  isActive: boolean
  collaborationProjectCount: number
}

export type BackofficeUserActionResult = { ok: true } | { ok: false; error: string }

export type CreateBackofficeUserInput = {
  firstName: string
  lastName: string
  email: string
  phone?: string
}

export type GetBackofficeUsersParams = {
  page?: number
  pageSize?: number
  search?: string
  statuses?: BackofficeUsersStatusKind[]
}

export type BackofficeUsersResult = {
  users: BackofficeUserRow[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  activeCount: number
}

type ProfileRow = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  created_at: string
}

type MembershipRow = {
  user_id: string
  role: string
  status: string
  company: { name: string } | { name: string }[] | null
}

function companyNameFromRelation(company: MembershipRow["company"]): string {
  if (!company) return "Empresa"
  if (Array.isArray(company)) return company[0]?.name ?? "Empresa"
  return company.name
}

function sanitizeSearchTerm(search: string): string {
  return search.trim().replace(/[%_,]/g, " ")
}

function parsePage(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return 1
  return Math.max(1, Math.floor(value))
}

function parsePageSize(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return BACKOFFICE_USERS_PAGE_SIZE
  return Math.min(100, Math.max(1, Math.floor(value)))
}

function formatInList(ids: string[]): string {
  return `(${ids.map((id) => `"${id}"`).join(",")})`
}

async function getEmailConfirmedUserIds(
  admin: ReturnType<typeof createAdminClient>,
): Promise<string[]> {
  const confirmedIds: string[] = []
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })

    if (error) {
      throw new Error(error.message)
    }

    const users = data.users ?? []

    for (const user of users) {
      if (user.email_confirmed_at) {
        confirmedIds.push(user.id)
      }
    }

    if (users.length < perPage) break
    page += 1
  }

  return confirmedIds
}

async function getSearchMatchingUserIds(
  admin: ReturnType<typeof createAdminClient>,
  search: string,
): Promise<string[]> {
  const term = sanitizeSearchTerm(search)
  if (!term) return []

  const pattern = `%${term}%`
  const matchingIds = new Set<string>()

  const { data: profileMatches, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .or(
      `email.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern},phone.ilike.${pattern}`,
    )

  if (profileError) {
    throw new Error(profileError.message)
  }

  for (const row of profileMatches ?? []) {
    matchingIds.add(row.id as string)
  }

  const { data: companyMatches, error: companyError } = await admin
    .from("companies")
    .select("id")
    .ilike("name", pattern)

  if (companyError) {
    throw new Error(companyError.message)
  }

  const companyIds = (companyMatches ?? []).map((row) => row.id as string)
  if (companyIds.length > 0) {
    const { data: memberMatches, error: memberError } = await admin
      .from("company_members")
      .select("user_id")
      .in("company_id", companyIds)

    if (memberError) {
      throw new Error(memberError.message)
    }

    for (const row of memberMatches ?? []) {
      matchingIds.add(row.user_id as string)
    }
  }

  return [...matchingIds]
}

function intersectIds(first: string[], second: string[]): string[] {
  const secondSet = new Set(second)
  return first.filter((id) => secondSet.has(id))
}

async function getEmailConfirmedByUserIds(
  admin: ReturnType<typeof createAdminClient>,
  userIds: string[],
): Promise<Map<string, boolean>> {
  const entries = await Promise.all(
    userIds.map(async (id) => {
      const { data, error } = await admin.auth.admin.getUserById(id)

      if (error || !data.user) {
        return [id, false] as const
      }

      return [id, Boolean(data.user.email_confirmed_at)] as const
    }),
  )

  return new Map(entries)
}

async function mapProfilesToUsers(
  admin: ReturnType<typeof createAdminClient>,
  profileRows: ProfileRow[],
): Promise<BackofficeUserRow[]> {
  if (profileRows.length === 0) return []

  const userIds = profileRows.map((profile) => profile.id)
  const emailConfirmedByUserId = await getEmailConfirmedByUserIds(admin, userIds)

  const { data: memberships, error: membershipsError } = await admin
    .from("company_members")
    .select("user_id, role, status, company:companies(name)")
    .in("user_id", userIds)

  if (membershipsError) {
    throw new Error(membershipsError.message)
  }

  const membershipsByUser = new Map<string, BackofficeUserMembership[]>()

  for (const row of (memberships ?? []) as MembershipRow[]) {
    const current = membershipsByUser.get(row.user_id) ?? []
    current.push({
      companyName: companyNameFromRelation(row.company),
      role: formatCompanyRole(row.role),
      status: row.status,
    })
    membershipsByUser.set(row.user_id, current)
  }

  const collaborationProjectCountsByUser =
    await getCollaborationProjectCountsByUserIds(admin, userIds)

  return profileRows.map((profile) => {
    const userMemberships = membershipsByUser.get(profile.id) ?? []
    const isActive = emailConfirmedByUserId.get(profile.id) ?? false

    return {
      id: profile.id,
      firstName: profile.first_name ?? "",
      lastName: profile.last_name ?? "",
      email: profile.email,
      phone: profile.phone,
      avatarUrl: profile.avatar_url,
      createdAt: profile.created_at,
      memberships: userMemberships,
      isActive,
      collaborationProjectCount:
        collaborationProjectCountsByUser.get(profile.id) ?? 0,
    }
  })
}

export async function confirmBackofficeUser(
  userId: string,
): Promise<BackofficeUserActionResult> {
  const currentUser = await requireBackofficeUser()
  const admin = createAdminClient()

  if (userId === currentUser.id) {
    return { ok: false, error: "No podés confirmar tu propia cuenta desde acá." }
  }

  const { data: authUser, error: authError } =
    await admin.auth.admin.getUserById(userId)

  if (authError || !authUser.user) {
    return { ok: false, error: "No encontramos ese usuario." }
  }

  if (authUser.user.email_confirmed_at) {
    return { ok: false, error: "Ese usuario ya confirmó su email." }
  }

  const { error } = await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath("/backoffice/usuarios")
  return { ok: true }
}

export async function deleteBackofficeUser(
  userId: string,
): Promise<BackofficeUserActionResult> {
  const currentUser = await requireBackofficeUser()
  const admin = createAdminClient()

  if (userId === currentUser.id) {
    return { ok: false, error: "No podés eliminar tu propia cuenta." }
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle()

  if (profileError) {
    return { ok: false, error: profileError.message }
  }

  if (!profile) {
    return { ok: false, error: "No encontramos ese usuario." }
  }

  if (isBackofficeEmail(profile.email)) {
    return { ok: false, error: "No podés eliminar un usuario con acceso al backoffice." }
  }

  const { error } = await admin.auth.admin.deleteUser(userId)

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
          "No se puede eliminar este usuario porque tiene actividad registrada en la plataforma.",
      }
    }

    return { ok: false, error: error.message }
  }

  revalidatePath("/backoffice/usuarios")
  return { ok: true }
}

function isDuplicateAuthEmailError(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes("already been registered") ||
    normalized.includes("already registered") ||
    normalized.includes("duplicate")
  )
}

export async function createBackofficeUser(
  input: CreateBackofficeUserInput,
): Promise<BackofficeUserActionResult> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const email = input.email.trim().toLowerCase()
  const phone = input.phone?.trim() || null
  const siteOrigin = getSiteOrigin()
  const redirectTo = buildRegisterConfirmCallbackUrl(siteOrigin)

  if (!firstName) {
    return { ok: false, error: "El nombre es requerido." }
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Ingresá un correo electrónico válido." }
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      first_name: firstName,
      last_name: lastName,
      password_setup_required: true,
    },
  })

  if (error) {
    if (isDuplicateAuthEmailError(error.message)) {
      return { ok: false, error: "Ya existe una cuenta con ese correo." }
    }

    return { ok: false, error: error.message }
  }

  const userId = data.user?.id

  if (!userId) {
    return { ok: false, error: "No pudimos crear el usuario." }
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      phone,
    })
    .eq("id", userId)

  if (profileError) {
    return { ok: false, error: profileError.message }
  }

  revalidatePath("/backoffice/usuarios")
  return { ok: true }
}

export async function getBackofficeUsers(
  params: GetBackofficeUsersParams = {},
): Promise<BackofficeUsersResult> {
  await requireBackofficeUser()
  const admin = createAdminClient()

  const page = parsePage(params.page)
  const pageSize = parsePageSize(params.pageSize)
  const search = sanitizeSearchTerm(params.search ?? "")
  const status = resolveBackofficeUsersStatusFilter(params.statuses ?? [])

  const activeUserIds = await getEmailConfirmedUserIds(admin)
  const activeCount = activeUserIds.length

  let scopedIds: string[] | null = null

  if (search) {
    scopedIds = await getSearchMatchingUserIds(admin, search)
    if (scopedIds.length === 0) {
      return {
        users: [],
        totalCount: 0,
        page: 1,
        pageSize,
        totalPages: 1,
        activeCount,
      }
    }
  }

  if (status === "active") {
    scopedIds = scopedIds
      ? intersectIds(scopedIds, activeUserIds)
      : activeUserIds

    if (scopedIds.length === 0) {
      return {
        users: [],
        totalCount: 0,
        page: 1,
        pageSize,
        totalPages: 1,
        activeCount,
      }
    }
  }

  let query = admin
    .from("profiles")
    .select(
      "id, first_name, last_name, email, phone, avatar_url, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })

  if (scopedIds) {
    query = query.in("id", scopedIds)
  }

  if (status === "inactive" && activeUserIds.length > 0) {
    query = query.not("id", "in", formatInList(activeUserIds))
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const {
    data: profiles,
    error: profilesError,
    count,
  } = await query.range(from, to)

  if (profilesError) {
    throw new Error(profilesError.message)
  }

  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(page, totalPages)
  const profileRows = (profiles ?? []) as ProfileRow[]
  const users = await mapProfilesToUsers(admin, profileRows)

  return {
    users,
    totalCount,
    page: safePage,
    pageSize,
    totalPages,
    activeCount,
  }
}
