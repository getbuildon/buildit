"use server"

import { createClient } from "@/utils/supabase/server"
import { getAuthenticatedUserOrNull } from "@/lib/authHelpers"
import type { UserProjectListItem } from "@/lib/projects/types"

type ProjectRow = {
  id: string
  name: string
  location: string | null
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
    organizationName: "",
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

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, location")
    .eq("id", id)
    .maybeSingle()

  if (error || !project) return null

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
        location
      )
    `
    )
    .eq("user_id", user.id)
    .eq("is_active", true)

  if (error || !memberships) return []

  const projects: ProjectRow[] = []
  for (const row of memberships) {
    const project = row.project as ProjectRow | ProjectRow[] | null
    if (!project) continue
    if (Array.isArray(project)) {
      for (const item of project) projects.push(item)
    } else {
      projects.push(project)
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
