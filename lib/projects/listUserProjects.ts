"use server"

import { createClient } from "@/utils/supabase/server"
import { getAuthenticatedUserOrNull } from "@/lib/authHelpers"
import type { HomeProjectListItem, UserProjectListItem } from "@/lib/projects/types"
import {
  loadProjectsHomeProgress,
  type ProjectHomeProgress,
} from "@/lib/projects/homeProjectProgress"

type ProjectRow = {
  id: string
  name: string
  location: string | null
  company_id: string
  company_name: string | null
  status: UserProjectListItem["status"]
}

async function countFloorsAndUnits(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
): Promise<{ floors: number; units: number }> {
  const [{ count: floors }, { count: units }] = await Promise.all([
    supabase
      .from("project_floors")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId),
    supabase
      .from("project_units")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId),
  ])

  return { floors: floors ?? 0, units: units ?? 0 }
}

function toUserProjectListItem(
  project: ProjectRow,
  counts: { floors: number; units: number },
  progress: { generalProgressPercent: number; weeklyProgressDelta: number },
): UserProjectListItem {
  return {
    projectId: project.id,
    company_id: project.company_id,
    organizationName: project.company_name || "",
    name: project.name,
    address: project.location?.trim() || "Sin dirección",
    floors: counts.floors,
    units: counts.units,
    status: project.status,
    generalProgressPercent: progress.generalProgressPercent,
    weeklyProgressDelta: progress.weeklyProgressDelta,
  }
}

function normalizeProjects(rows: unknown[]): ProjectRow[] {
  const projects: ProjectRow[] = []
  for (const raw of rows) {
    if (!raw) continue
    const items = Array.isArray(raw) ? raw : [raw]
    for (const item of items) {
      const company = Array.isArray(item.company) ? item.company[0] : item.company
      projects.push({
        id: item.id,
        name: item.name,
        location: item.location,
        company_id: item.company_id,
        company_name: company?.name ?? null,
        status: item.status ?? "active",
      })
    }
  }
  return projects
}

async function collectAccessibleProjectRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<ProjectRow[]> {
  const { data: memberships } = await supabase
    .from("project_members")
    .select(`project:projects ( id, name, location, company_id, status, company:companies ( name ) )`)
    .eq("user_id", userId)
    .eq("is_active", true)

  const { data: companyMemberships } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .in("role", ["owner", "admin"])

  const { data: clientUnitRows } = await supabase
    .from("unit_clients")
    .select(
      `unit:project_units!inner (
        project:projects (
          id,
          name,
          location,
          company_id,
          status,
          company:companies ( name )
        )
      )`,
    )
    .eq("user_id", userId)
    .eq("status", "active")

  const explicitProjects = normalizeProjects(
    (memberships || []).map((m) => m.project),
  )

  const clientProjects = normalizeProjects(
    (clientUnitRows || [])
      .map((row) => {
        const unit = row.unit as { project?: unknown } | { project?: unknown }[] | null
        if (!unit) return null
        const unitData = Array.isArray(unit) ? unit[0] : unit
        return unitData?.project ?? null
      })
      .filter(Boolean),
  )

  let companyProjects: ProjectRow[] = []
  if (companyMemberships && companyMemberships.length > 0) {
    const companyIds = companyMemberships.map((cm) => cm.company_id)
    const { data: rawProjects } = await supabase
      .from("projects")
      .select("id, name, location, company_id, status, company:companies ( name )")
      .in("company_id", companyIds)

    companyProjects = normalizeProjects(rawProjects || [])
  }

  const seen = new Set<string>()
  const deduped: ProjectRow[] = []
  for (const project of [...explicitProjects, ...clientProjects, ...companyProjects]) {
    if (seen.has(project.id)) continue
    seen.add(project.id)
    deduped.push(project)
  }
  return deduped
}

async function countFloorsByProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (projectIds.length === 0) return counts

  const { data } = await supabase
    .from("project_floors")
    .select("project_id")
    .in("project_id", projectIds)

  for (const row of data ?? []) {
    const projectId = row.project_id as string
    counts.set(projectId, (counts.get(projectId) ?? 0) + 1)
  }
  return counts
}

export async function getProjectById(
  projectId: string,
): Promise<UserProjectListItem | null> {
  const id = projectId.trim()
  if (!id) return null

  const user = await getAuthenticatedUserOrNull()
  if (!user) return null

  const supabase = await createClient()

  const withCompany = await supabase
    .from("projects")
    .select("id, name, location, company_id, status, company:companies(name)")
    .eq("id", id)
    .maybeSingle()

  const withoutCompany = withCompany.error
    ? await supabase
        .from("projects")
        .select("id, name, location, company_id, status")
        .eq("id", id)
        .maybeSingle()
    : null

  const raw = withoutCompany?.data ?? withCompany.data
  if ((withoutCompany?.error ?? withCompany.error) || !raw) return null

  const r = raw as {
    id: string
    name: string
    location: string | null
    company_id: string
    status?: UserProjectListItem["status"]
    company?: { name?: string } | { name?: string }[] | null
  }
  const company = Array.isArray(r.company) ? r.company[0] : r.company
  const project: ProjectRow = {
    id: r.id,
    name: r.name,
    location: r.location,
    company_id: r.company_id,
    company_name: company?.name ?? null,
    status: r.status ?? "active",
  }

  const counts = await countFloorsAndUnits(supabase, project.id)
  return toUserProjectListItem(project, counts, {
    generalProgressPercent: 0,
    weeklyProgressDelta: 0,
  })
}

export async function listHomeProjects(): Promise<HomeProjectListItem[]> {
  const user = await getAuthenticatedUserOrNull()
  if (!user) return []

  const supabase = await createClient()
  const deduped = await collectAccessibleProjectRows(supabase, user.id)
  if (deduped.length === 0) return []

  const floorCounts = await countFloorsByProject(
    supabase,
    deduped.map((project) => project.id),
  )

  return deduped.map((project) => ({
    projectId: project.id,
    name: project.name,
    address: project.location?.trim() || "Sin dirección",
    floors: floorCounts.get(project.id) ?? 0,
    status: project.status,
  }))
}

/** @deprecated Prefer listHomeProjects — mismo listado liviano de Home. */
export async function listUserProjects(): Promise<HomeProjectListItem[]> {
  return listHomeProjects()
}

export async function getHomeProjectsProgress(
  projectIds: string[],
): Promise<Record<string, ProjectHomeProgress>> {
  const unique = [...new Set(projectIds.map((id) => id.trim()).filter(Boolean))]
  if (unique.length === 0) return {}

  const user = await getAuthenticatedUserOrNull()
  if (!user) return {}

  const supabase = await createClient()
  const accessible = await collectAccessibleProjectRows(supabase, user.id)
  const allowed = new Set(accessible.map((project) => project.id))
  const ids = unique.filter((id) => allowed.has(id))
  if (ids.length === 0) return {}

  const progressMap = await loadProjectsHomeProgress(supabase, ids)
  const result: Record<string, ProjectHomeProgress> = {}
  for (const id of ids) {
    result[id] = progressMap.get(id) ?? {
      generalProgressPercent: 0,
      weeklyProgressDelta: 0,
    }
  }
  return result
}