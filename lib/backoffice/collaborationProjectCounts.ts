import { createAdminClient } from "@/utils/supabase/admin"

type ProjectRefRow = {
  id: string
  company_id: string
}

type ProjectMembershipRow = {
  user_id: string
  project: ProjectRefRow | ProjectRefRow[] | null
}

type UnitClientRow = {
  user_id: string
  unit:
    | { project?: ProjectRefRow | ProjectRefRow[] | null }
    | { project?: ProjectRefRow | ProjectRefRow[] | null }[]
    | null
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function projectRefFromRelation(
  value: ProjectRefRow | ProjectRefRow[] | null | undefined,
): ProjectRefRow | null {
  return firstRelation(value)
}

function projectRefFromUnitClientRow(row: UnitClientRow): ProjectRefRow | null {
  if (!row.unit) return null
  const unit = Array.isArray(row.unit) ? row.unit[0] : row.unit
  return projectRefFromRelation(unit?.project ?? null)
}

export function formatCollaborationProjectCount(count: number): string {
  return count === 1 ? "1 proyecto" : `${count} proyectos`
}

export async function getCollaborationProjectCountsByUserIds(
  admin: ReturnType<typeof createAdminClient>,
  userIds: string[],
): Promise<Map<string, number>> {
  const countsByUser = new Map<string, number>()

  if (userIds.length === 0) return countsByUser

  for (const userId of userIds) {
    countsByUser.set(userId, 0)
  }

  const { data: ownerMemberships, error: ownerError } = await admin
    .from("company_members")
    .select("user_id, company_id")
    .in("user_id", userIds)
    .eq("role", "owner")
    .eq("status", "active")

  if (ownerError) throw new Error(ownerError.message)

  const ownedCompanyIdsByUser = new Map<string, Set<string>>()

  for (const row of ownerMemberships ?? []) {
    const userId = row.user_id as string
    const companyId = row.company_id as string
    const ownedCompanies = ownedCompanyIdsByUser.get(userId) ?? new Set<string>()
    ownedCompanies.add(companyId)
    ownedCompanyIdsByUser.set(userId, ownedCompanies)
  }

  const projectIdsByUser = new Map<string, Set<string>>()

  for (const userId of userIds) {
    projectIdsByUser.set(userId, new Set())
  }

  const addCollaborationProject = (
    userId: string,
    project: ProjectRefRow | null,
  ) => {
    if (!project?.id || !project.company_id) return

    const ownedCompanies = ownedCompanyIdsByUser.get(userId)
    if (ownedCompanies?.has(project.company_id)) return

    projectIdsByUser.get(userId)?.add(project.id)
  }

  const [{ data: projectMemberships, error: membershipsError }, { data: unitClientRows, error: unitClientsError }] =
    await Promise.all([
      admin
        .from("project_members")
        .select("user_id, project:projects(id, company_id)")
        .in("user_id", userIds)
        .eq("is_active", true),
      admin
        .from("unit_clients")
        .select(
          "user_id, unit:project_units!inner(project:projects(id, company_id))",
        )
        .in("user_id", userIds)
        .eq("status", "active"),
    ])

  if (membershipsError) throw new Error(membershipsError.message)
  if (unitClientsError) throw new Error(unitClientsError.message)

  for (const row of (projectMemberships ?? []) as ProjectMembershipRow[]) {
    addCollaborationProject(row.user_id, projectRefFromRelation(row.project))
  }

  for (const row of (unitClientRows ?? []) as UnitClientRow[]) {
    addCollaborationProject(row.user_id, projectRefFromUnitClientRow(row))
  }

  for (const [userId, projectIds] of projectIdsByUser) {
    countsByUser.set(userId, projectIds.size)
  }

  return countsByUser
}
