"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { getLoginAudience } from "@/lib/auth/loginAudienceActions"
import { requireAuthenticatedUser } from "@/lib/authHelpers"
import type { ProjectUserType } from "@/lib/projects/createProjectDraft"
import { USER_TYPE_SLUG } from "@/lib/projects/catalogSlugs"
import {
  canAccessUnitProgress,
  type ProjectAccessContext,
} from "@/lib/project/projectAccessContext"
import {
  getProjectPermissions,
  hasProjectPermission,
  isNavSegmentAllowed,
  resolveAssignedUnitIds,
  type ProjectPermissionKey,
} from "@/lib/project/projectPermissions"
import { projectHref } from "@/lib/project/routes"

export type { ProjectAccessContext } from "@/lib/project/projectAccessContext"

const SLUG_TO_USER_TYPE: Record<string, ProjectUserType> = {
  [USER_TYPE_SLUG.Owner]: "Owner",
  [USER_TYPE_SLUG.Admin]: "Admin",
  [USER_TYPE_SLUG.Supervisor]: "Supervisor",
  [USER_TYPE_SLUG.Operador]: "Operador",
  [USER_TYPE_SLUG.Cliente]: "Cliente",
}

function userTypeFromSlug(slug: string | null | undefined): ProjectUserType | null {
  if (!slug) return null
  return SLUG_TO_USER_TYPE[slug] ?? null
}

export async function getClientAssignedUnitIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  userId: string,
): Promise<string[]> {
  const { data: projectUnits, error: unitsError } = await supabase
    .from("project_units")
    .select("id")
    .eq("project_id", projectId)

  if (unitsError) return []

  const unitIds = (projectUnits ?? []).map((unit) => unit.id)
  if (unitIds.length === 0) return []

  const { data: assignments, error: assignmentsError } = await supabase
    .from("unit_clients")
    .select("unit_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .in("unit_id", unitIds)

  if (assignmentsError) return []
  return (assignments ?? []).map((row) => row.unit_id)
}

export async function getProjectAccessContext(
  projectId: string,
): Promise<ProjectAccessContext | null> {
  const user = await requireAuthenticatedUser()
  const id = projectId.trim()
  if (!id) return null

  const supabase = await createClient()

  const { data: member } = await supabase
    .from("project_members")
    .select("user_type_id, user_types ( slug )")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle()

  let userType = userTypeFromSlug(
    (() => {
      const relation = member?.user_types as { slug: string } | { slug: string }[] | null | undefined
      if (!relation) return null
      return Array.isArray(relation) ? relation[0]?.slug : relation.slug
    })(),
  )

  if (!userType) {
    const { data: project } = await supabase
      .from("projects")
      .select("company_id")
      .eq("id", id)
      .maybeSingle()

    if (project?.company_id) {
      const { data: companyMember } = await supabase
        .from("company_members")
        .select("role")
        .eq("company_id", project.company_id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .in("role", ["owner", "admin"])
        .maybeSingle()

      if (companyMember?.role === "owner") userType = "Owner"
      else if (companyMember?.role === "admin") userType = "Admin"
    }
  }

  const clientUnitIds = await getClientAssignedUnitIds(supabase, id, user.id)
  const loginAudience = (await getLoginAudience()) ?? "equipo"

  if (!userType) {
    if (clientUnitIds.length === 0) return null
    userType = "Cliente"
  }

  const permissions = getProjectPermissions(userType)
  const effectivePermissions =
    clientUnitIds.length > 0 && !permissions.clientPortal
      ? { ...permissions, clientPortal: true as const }
      : permissions

  return {
    userType,
    permissions: effectivePermissions,
    assignedUnitIds:
      loginAudience === "cliente"
        ? clientUnitIds
        : resolveAssignedUnitIds(effectivePermissions, clientUnitIds),
    loginAudience,
  }
}

export async function requireProjectPermission(
  projectId: string,
  permission: ProjectPermissionKey,
): Promise<ProjectAccessContext> {
  const context = await getProjectAccessContext(projectId)
  if (!context || !hasProjectPermission(context.permissions, permission)) {
    throw new Error("No tenés permiso para realizar esta acción.")
  }
  return context
}

export async function checkProjectPermission(
  projectId: string,
  permission: ProjectPermissionKey,
): Promise<
  { ok: true; context: ProjectAccessContext } | { ok: false; error: string }
> {
  try {
    const context = await requireProjectPermission(projectId, permission)
    return { ok: true, context }
  } catch (cause) {
    return {
      ok: false,
      error:
        cause instanceof Error
          ? cause.message
          : "No tenés permiso para realizar esta acción.",
    }
  }
}

export async function assertProjectSectionAccess(
  projectId: string,
  segment: string,
): Promise<ProjectAccessContext> {
  const context = await getProjectAccessContext(projectId)
  if (!context) {
    redirect("/home")
  }

  if (context.loginAudience === "cliente") {
    if (segment !== "mi-unidad") {
      redirect(projectHref(projectId, "mi-unidad"))
    }
    return context
  }

  if (segment === "mi-unidad") {
    redirect(projectHref(projectId))
  }

  if (!isNavSegmentAllowed(context.permissions, segment)) {
    redirect(projectHref(projectId))
  }
  return context
}

export async function assertUnitDetailAccess(
  projectId: string,
  unitId: string,
): Promise<ProjectAccessContext> {
  const context = await getProjectAccessContext(projectId)
  if (!context || !canAccessUnitProgress(context, unitId)) {
    redirect(projectHref(projectId))
  }
  return context
}

export async function checkUnitDetailAccess(
  projectId: string,
  unitId: string,
): Promise<
  { ok: true; context: ProjectAccessContext } | { ok: false; error: string }
> {
  const context = await getProjectAccessContext(projectId)
  if (!context) {
    return { ok: false, error: "No tenés acceso a este proyecto." }
  }
  if (!canAccessUnitProgress(context, unitId)) {
    return { ok: false, error: "No tenés permiso para ver esta unidad." }
  }
  return { ok: true, context }
}
