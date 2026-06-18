import type { SupabaseClient } from "@supabase/supabase-js"
import {
  PROJECT_ROLE_SLUG,
  TASK_TRACKING_SLUG,
  UNIT_TYPE_SLUG,
  USER_TYPE_SLUG,
} from "@/lib/projects/catalogSlugs"
import type {
  ProjectTeamRole,
  ProjectUserType,
  StructureUnitType,
  TaskTrackingType,
} from "@/lib/projects/createProjectDraft"

export type ProjectCatalogIds = {
  unitTypeIds: Record<StructureUnitType, string>
  trackingTypeIds: Record<TaskTrackingType, string>
  userTypeIds: Record<ProjectUserType, string>
  roleIds: Record<ProjectTeamRole, string>
}

async function mapBySlug<T extends string>(
  rows: { id: string; slug: string }[] | null,
  slugMap: Record<T, string>,
): Promise<Record<T, string>> {
  const bySlug = new Map((rows ?? []).map((row) => [row.slug, row.id]))
  const result = {} as Record<T, string>
  for (const key of Object.keys(slugMap) as T[]) {
    const id = bySlug.get(slugMap[key])
    if (!id) {
      throw new Error(`Catálogo incompleto: falta ${slugMap[key]}`)
    }
    result[key] = id
  }
  return result
}

export async function loadProjectCatalogIds(
  supabase: SupabaseClient,
): Promise<ProjectCatalogIds> {
  const [unitTypes, trackingTypes, userTypes, roles] = await Promise.all([
    supabase.from("unit_types").select("id, slug"),
    supabase.from("task_tracking_types").select("id, slug"),
    supabase.from("user_types").select("id, slug"),
    supabase.from("project_roles").select("id, slug"),
  ])

  if (unitTypes.error) throw unitTypes.error
  if (trackingTypes.error) throw trackingTypes.error
  if (userTypes.error) throw userTypes.error
  if (roles.error) throw roles.error

  return {
    unitTypeIds: await mapBySlug(unitTypes.data, UNIT_TYPE_SLUG),
    trackingTypeIds: await mapBySlug(trackingTypes.data, TASK_TRACKING_SLUG),
    userTypeIds: await mapBySlug(userTypes.data, USER_TYPE_SLUG),
    roleIds: await mapBySlug(roles.data, PROJECT_ROLE_SLUG),
  }
}
