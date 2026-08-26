import type { SupabaseClient } from "@supabase/supabase-js"

export type ProjectMemberFichaFields = {
  first_name: string
  last_name: string
  phone: string | null
}

export function toProjectMemberFicha(input: {
  firstName: string
  lastName: string
  phone?: string | null
}): ProjectMemberFichaFields {
  return {
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    phone: input.phone?.trim() || null,
  }
}

export function fichaFromProfileRow(row: {
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
} | null): ProjectMemberFichaFields {
  return {
    first_name: row?.first_name?.trim() || "",
    last_name: row?.last_name?.trim() || "",
    phone: row?.phone?.trim() || null,
  }
}

export async function loadFichaSnapshotsFromProfiles(
  client: SupabaseClient,
  userIds: string[],
): Promise<Map<string, ProjectMemberFichaFields>> {
  if (userIds.length === 0) return new Map()

  const { data } = await client
    .from("profiles")
    .select("id, first_name, last_name, phone")
    .in("id", userIds)

  return new Map(
    (data ?? []).map((row) => [row.id as string, fichaFromProfileRow(row)]),
  )
}

export function formatProjectMemberDisplayName(
  ficha: { first_name?: string | null; last_name?: string | null } | null | undefined,
  email?: string | null,
  fallback = "Usuario",
): string {
  const firstName = ficha?.first_name?.trim()
  const lastName = ficha?.last_name?.trim()
  if (firstName && lastName) return `${firstName} ${lastName}`
  if (firstName) return firstName
  if (lastName) return lastName
  const trimmedEmail = email?.trim()
  if (trimmedEmail) return trimmedEmail
  return fallback
}

export async function loadProjectMemberDisplayNames(
  client: SupabaseClient,
  projectId: string,
  userIds: string[],
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))]
  const names = new Map<string, string>()
  if (uniqueIds.length === 0) return names

  const [membersRes, profilesRes] = await Promise.all([
    client
      .from("project_members")
      .select("user_id, first_name, last_name")
      .eq("project_id", projectId)
      .in("user_id", uniqueIds),
    client.from("profiles").select("id, email").in("id", uniqueIds),
  ])

  const emailById = new Map(
    (profilesRes.data ?? []).map((row) => [row.id as string, row.email as string | null]),
  )
  const fichaById = new Map(
    (membersRes.data ?? []).map((row) => [row.user_id as string, row]),
  )

  for (const userId of uniqueIds) {
    names.set(
      userId,
      formatProjectMemberDisplayName(fichaById.get(userId), emailById.get(userId)),
    )
  }

  return names
}
