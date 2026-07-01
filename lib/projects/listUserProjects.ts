"use server"

import { createClient } from "@/utils/supabase/server"
import { getAuthenticatedUserOrNull } from "@/lib/authHelpers"
import type { UserProjectListItem } from "@/lib/projects/types"

type ProjectRow = {
  id: string
  name: string
  location: string | null
  company_id: string
  company_name: string | null
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
): UserProjectListItem {
  return {
    projectId: project.id,
    company_id: project.company_id,
    organizationName: project.company_name || "",
    name: project.name,
    address: project.location?.trim() || "Sin dirección",
    floors: counts.floors,
    units: counts.units,
    progressPercent: 0,
    generalProgressPercent: 0,
  }
}

export async function getProjectById(
  projectId: string,
): Promise<UserProjectListItem | null> {
  const id = projectId.trim()
  if (!id) return null

  const user = await getAuthenticatedUserOrNull()
  if (!user) return null

  const supabase = await createClient()

  const { data: raw, error } = await supabase
    .from("projects")
    .select("id, name, location, company_id, company:companies(name)")
    .eq("id", id)
    .maybeSingle()

  if (error || !raw) return null

  const r = raw as any
  const company = Array.isArray(r.company) ? r.company[0] : r.company
  const project: ProjectRow = {
    id: r.id,
    name: r.name,
    location: r.location,
    company_id: r.company_id,
    company_name: company?.name ?? null,
  }

  const counts = await countFloorsAndUnits(supabase, project.id)
  return toUserProjectListItem(project, counts)
}

function normalizeProjects(rows: any[]): ProjectRow[] {
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
      })
    }
  }
  return projects
}

export async function listUserProjects(): Promise<UserProjectListItem[]> {
  const user = await getAuthenticatedUserOrNull()
  if (!user) return []

  const supabase = await createClient()

  // Proyectos con membresía explícita (todos los roles)
  const { data: memberships } = await supabase
    .from("project_members")
    .select(`project:projects ( id, name, location, company_id, company:companies ( name ) )`)
    .eq("user_id", user.id)
    .eq("is_active", true)

  // Proyectos de empresas donde el usuario es owner/admin (acceso automático)
  const { data: companyMemberships } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["owner", "admin"])

  const explicitProjects = normalizeProjects(
    (memberships || []).map((m) => m.project)
  )

  let companyProjects: ProjectRow[] = []
  if (companyMemberships && companyMemberships.length > 0) {
    const companyIds = companyMemberships.map((cm) => cm.company_id)
    const { data: rawProjects } = await supabase
      .from("projects")
      .select("id, name, location, company_id, company:companies ( name )")
      .in("company_id", companyIds)

    companyProjects = normalizeProjects(rawProjects || [])
  }

  // Unir sin duplicados (priorizar explícitos)
  const seen = new Set(explicitProjects.map((p) => p.id))
  const merged = [
    ...explicitProjects,
    ...companyProjects.filter((p) => !seen.has(p.id)),
  ]

  if (merged.length === 0) return []

  const results = await Promise.all(
    merged.map(async (project) => {
      const counts = await countFloorsAndUnits(supabase, project.id)
      return toUserProjectListItem(project, counts)
    }),
  )

  return results
}
