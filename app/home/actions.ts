"use server"

import { isBackofficeEmail } from "@/lib/auth/backofficeAccess"
import { getAuthenticatedUserOrNull } from "@/lib/authHelpers"
import { PROJECT_ROLE_SLUG, USER_TYPE_SLUG } from "@/lib/projects/catalogSlugs"
import { createClient } from "@/utils/supabase/server"

export type HomeCompanyOption = {
  id: string
  name: string
  role: string
}

export type HomeShellData = {
  firstName: string
  lastName: string
  displayName: string
  avatarUrl: string | null
  primaryCompany: { id: string; name: string } | null
  manageableCompanies: HomeCompanyOption[]
  canCreateProjects: boolean
  hasClientAccess: boolean
  canSeeBackoffice: boolean
}

function slugFromRelation(
  value: { slug?: string } | { slug?: string }[] | null | undefined,
): string | null {
  if (!value) return null
  const row = Array.isArray(value) ? value[0] : value
  return row?.slug ?? null
}

async function userHasClientAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<boolean> {
  const { data: clientUnit } = await supabase
    .from("unit_clients")
    .select("unit_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle()

  if (clientUnit?.unit_id) return true

  const { data: memberships } = await supabase
    .from("project_members")
    .select("user_types ( slug ), project_roles ( slug )")
    .eq("user_id", userId)
    .eq("is_active", true)

  return (memberships ?? []).some((row) => {
    const userTypeSlug = slugFromRelation(row.user_types as never)
    const roleSlug = slugFromRelation(row.project_roles as never)
    return (
      userTypeSlug === USER_TYPE_SLUG.Cliente ||
      roleSlug === PROJECT_ROLE_SLUG.Cliente
    )
  })
}

function displayNameFromProfile(firstName: string, lastName: string, email: string): string {
  const full = `${firstName} ${lastName}`.trim()
  if (full) return full
  const local = email.split("@")[0]?.trim()
  return local || ""
}

export async function getHomeShell(): Promise<HomeShellData | null> {
  const user = await getAuthenticatedUserOrNull()
  if (!user) return null

  const supabase = await createClient()

  const [profileResult, companiesResult, hasClientAccess] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("company_members")
      .select("company_id, role, company:companies(id, name)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    userHasClientAccess(supabase, user.id),
  ])

  const companies = (companiesResult.error ? [] : companiesResult.data ?? [])
    .map((row) => {
      const company = row.company as
        | { id: string; name: string }
        | { id: string; name: string }[]
        | null
      if (!company) return null
      const companyData = Array.isArray(company) ? company[0] : company
      if (!companyData) return null
      return { id: companyData.id, name: companyData.name, role: row.role as string }
    })
    .filter((company): company is { id: string; name: string; role: string } => company !== null)

  const firstName = profileResult.data?.first_name?.trim() ?? ""
  const lastName = profileResult.data?.last_name?.trim() ?? ""
  const canCreateProjects = companies.some(
    (company) => company.role === "owner" || company.role === "admin",
  )
  const manageableCompanies = companies.filter((company) => {
    const role = company.role.trim().toLowerCase()
    return role === "owner" || role === "admin"
  })
  const primary = companies[0] ?? null

  return {
    firstName,
    lastName,
    displayName: displayNameFromProfile(firstName, lastName, user.email),
    avatarUrl: profileResult.data?.avatar_url ?? null,
    primaryCompany: primary ? { id: primary.id, name: primary.name } : null,
    manageableCompanies,
    canCreateProjects,
    hasClientAccess,
    canSeeBackoffice: isBackofficeEmail(user.email),
  }
}

export async function getHomeBackofficeAccess(): Promise<boolean> {
  const user = await getAuthenticatedUserOrNull()
  if (!user?.email) return false
  return isBackofficeEmail(user.email)
}