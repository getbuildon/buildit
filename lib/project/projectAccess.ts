"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { requireAuthenticatedUser } from "@/lib/authHelpers"
import type { ProjectUserType } from "@/lib/projects/createProjectDraft"
import { USER_TYPE_SLUG } from "@/lib/projects/catalogSlugs"
import {
  getProjectPermissions,
  hasProjectPermission,
  isNavSegmentAllowed,
  type ProjectPermissionKey,
  type ProjectPermissions,
} from "@/lib/project/projectPermissions"
import { projectHref } from "@/lib/project/routes"

export type ProjectAccessContext = {
  userType: ProjectUserType
  permissions: ProjectPermissions
}

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

  if (!userType) return null

  return {
    userType,
    permissions: getProjectPermissions(userType),
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
  if (!context || !isNavSegmentAllowed(context.permissions, segment)) {
    redirect(projectHref(projectId))
  }
  return context
}
