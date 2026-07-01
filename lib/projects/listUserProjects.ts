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

export async function listUserProjects(): Promise<UserProjectListItem[]> {
  const user = await getAuthenticatedUserOrNull()
  if (!user) return []

  const supabase = await createClient()

  // Obtener proyectos donde el usuario es miembro
  const { data: memberships, error } = await supabase
    .from("project_members")
    .select(
      `
      project:projects (
        id,
        name,
        location,
        company_id,
        company:companies ( name )
      )
    `
    )
    .eq("user_id", user.id)
    .eq("is_active", true)

  if (error || !memberships) return []

  const projects: ProjectRow[] = []
  for (const row of memberships) {
    const raw = row.project as any
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

  if (projects.length === 0) return []

  const results = await Promise.all(
    projects.map(async (project) => {
      const counts = await countFloorsAndUnits(supabase, project.id)
      return toUserProjectListItem(project, counts)
    }),
  )

  return results
}
