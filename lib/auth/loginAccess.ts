"use server"

import { clearLoginAudience, setLoginAudience } from "@/lib/auth/loginAudienceActions"
import { type LoginAudience } from "@/lib/auth/loginAudience"
import { projectHref } from "@/lib/project/routes"
import { getAuthenticatedUserOrNull } from "@/lib/authHelpers"
import { PROJECT_ROLE_SLUG, USER_TYPE_SLUG } from "@/lib/projects/catalogSlugs"
import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"

function slugFromRelation(
  value: { slug?: string } | { slug?: string }[] | null | undefined,
) {
  if (!value) return null
  const row = Array.isArray(value) ? value[0] : value
  return row?.slug ?? null
}

export async function getFirstClientProjectId(userId: string): Promise<string | null> {
  const admin = createAdminClient()

  const { data: clientUnits } = await admin
    .from("unit_clients")
    .select("unit_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(20)

  const unitIds = (clientUnits ?? []).map((row) => row.unit_id).filter(Boolean)
  if (unitIds.length > 0) {
    const { data: units } = await admin
      .from("project_units")
      .select("project_id")
      .in("id", unitIds)
      .limit(1)

    if (units?.[0]?.project_id) return units[0].project_id
  }

  const { data: memberships } = await admin
    .from("project_members")
    .select("project_id, user_types ( slug ), project_roles ( slug )")
    .eq("user_id", userId)
    .eq("is_active", true)

  for (const row of memberships ?? []) {
    const userTypeSlug = slugFromRelation(row.user_types as never)
    const roleSlug = slugFromRelation(row.project_roles as never)
    if (
      userTypeSlug === USER_TYPE_SLUG.Cliente ||
      roleSlug === PROJECT_ROLE_SLUG.Cliente
    ) {
      return row.project_id
    }
  }

  return null
}

export async function isTeamAccessUser(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: companyMember } = await supabase
    .from("company_members")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .in("role", ["owner", "admin"])
    .limit(1)
    .maybeSingle()

  if (companyMember) return true

  const { data: memberships } = await supabase
    .from("project_members")
    .select("user_types ( slug ), project_roles ( slug )")
    .eq("user_id", userId)
    .eq("is_active", true)

  return (memberships ?? []).some((row) => {
    const userTypeSlug = slugFromRelation(row.user_types as never)
    const roleSlug = slugFromRelation(row.project_roles as never)
    return (
      userTypeSlug !== USER_TYPE_SLUG.Cliente &&
      roleSlug !== PROJECT_ROLE_SLUG.Cliente
    )
  })
}

export async function finalizeAccessLogin(audience: LoginAudience): Promise<
  { ok: true; redirectTo: string } | { ok: false; error: string }
> {
  const user = await getAuthenticatedUserOrNull()
  if (!user) {
    return { ok: false, error: "No pudimos validar la sesión. Intentá de nuevo." }
  }

  const supabase = await createClient()

  if (audience === "cliente") {
    const projectId = await getFirstClientProjectId(user.id)
    if (!projectId) {
      await supabase.auth.signOut()
      await clearLoginAudience()
      return {
        ok: false,
        error: "Este acceso es solo para clientes con unidades asignadas.",
      }
    }

    await setLoginAudience("cliente")
    return { ok: true, redirectTo: projectHref(projectId, "mi-unidad") }
  }

  const canUseTeamLogin = await isTeamAccessUser(user.id)
  if (!canUseTeamLogin) {
    await supabase.auth.signOut()
    await clearLoginAudience()
    return {
      ok: false,
      error: "Este acceso es solo para el equipo de obra.",
    }
  }

  await setLoginAudience("equipo")
  return { ok: true, redirectTo: "/home" }
}

export async function switchToClientPortal(): Promise<
  { ok: true; redirectTo: string } | { ok: false; error: string }
> {
  const user = await getAuthenticatedUserOrNull()
  if (!user) {
    return { ok: false, error: "No pudimos validar la sesión. Intentá de nuevo." }
  }

  const projectId = await getFirstClientProjectId(user.id)
  if (!projectId) {
    return {
      ok: false,
      error: "No tenés unidades asignadas como cliente.",
    }
  }

  await setLoginAudience("cliente")
  return { ok: true, redirectTo: projectHref(projectId, "mi-unidad") }
}
