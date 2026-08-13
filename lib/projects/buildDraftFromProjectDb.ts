import {
  getProjectStructure,
  getProjectUnits,
  getProjectRubroGroups,
  getUnitTaskAssignments,
} from "@/app/[projectId]/configuracion/actions"
import type {
  CreateProjectDraft,
  ProjectTeamRole,
  ProjectUserType,
  ProjectWorkStage,
  TeamMemberDraft,
} from "@/lib/projects/createProjectDraft"
import { PROJECT_ROLE_SLUG, USER_TYPE_SLUG } from "@/lib/projects/catalogSlugs"
import { buildConfigDraftFromProjectData } from "@/lib/projects/unitTaskAssignments"
import { createClient } from "@/utils/supabase/server"

export type ProjectBasicsRow = {
  name: string | null
  location: string | null
  start_date: string | null
  end_date: string | null
  total_surface_m2: number | null
  company_id: string | null
  building_type: string | null
  companyName: string | null
}

import { formatTotalSurfaceFromNumber } from "@/lib/projects/totalSurfaceInput"

function parseWorkStage(buildingType: string | null): ProjectWorkStage {
  return buildingType === "in_execution" ? "in_execution" : "not_started"
}

async function loadPendingTeamInvitations(projectId: string): Promise<TeamMemberDraft[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("project_invitations")
    .select(
      `
      email,
      first_name,
      last_name,
      project_roles ( slug, label ),
      user_types ( slug )
    `,
    )
    .eq("project_id", projectId)
    .eq("status", "pending")

  if (error || !data) return []

  const roleBySlug = new Map<string, ProjectTeamRole>(
    Object.entries(PROJECT_ROLE_SLUG).map(([label, slug]) => [slug, label as ProjectTeamRole]),
  )
  const userTypeBySlug = new Map<string, ProjectUserType>(
    Object.entries(USER_TYPE_SLUG).map(([label, slug]) => [slug, label as ProjectUserType]),
  )

  return data.map((row, index) => {
    const roleRaw = row.project_roles as
      | { slug: string; label: string }
      | { slug: string; label: string }[]
      | null
    const userTypeRaw = row.user_types as { slug: string } | { slug: string }[] | null

    const roleRow = roleRaw
      ? Array.isArray(roleRaw)
        ? roleRaw[0]
        : roleRaw
      : null
    const userTypeRow = userTypeRaw
      ? Array.isArray(userTypeRaw)
        ? userTypeRaw[0]
        : userTypeRaw
      : null

    const role = roleBySlug.get(roleRow?.slug ?? "") ?? "Residente"
    const userType = userTypeBySlug.get(userTypeRow?.slug ?? "") ?? "Operador"

    return {
      id: `invite-${index}-${row.email}`,
      firstName: row.first_name ?? "",
      lastName: row.last_name ?? "",
      email: row.email,
      roleTitle: roleRow?.label ?? role,
      userType,
      role,
    }
  })
}

export async function buildDraftFromProjectDb(
  projectId: string,
  basicsRow: ProjectBasicsRow,
): Promise<{
  draft: CreateProjectDraft
  hasDbFloors: boolean
  hasDbRubros: boolean
  hasDbTeam: boolean
}> {
  const id = projectId.trim()

  const [floors, units, groups, assignments, teamMembers] = await Promise.all([
    getProjectStructure(id),
    getProjectUnits(id),
    getProjectRubroGroups(id),
    getUnitTaskAssignments(id),
    loadPendingTeamInvitations(id),
  ])

  const configDraft = buildConfigDraftFromProjectData({
    projectName: basicsRow.name ?? "",
    location: basicsRow.location ?? "",
    floors,
    units,
    groups,
    assignmentsByUnit: assignments.byUnit,
  })

  const draft: CreateProjectDraft = {
    ...configDraft,
    companyId: basicsRow.company_id,
    companyName: basicsRow.companyName ?? "",
    totalSurface: formatTotalSurfaceFromNumber(basicsRow.total_surface_m2),
    startDate: basicsRow.start_date ?? "",
    endDate: basicsRow.end_date ?? "",
    workStage: parseWorkStage(basicsRow.building_type),
    teamMembers,
  }

  return {
    draft,
    hasDbFloors: floors.length > 0,
    hasDbRubros: groups.length > 0,
    hasDbTeam: teamMembers.length > 0,
  }
}
