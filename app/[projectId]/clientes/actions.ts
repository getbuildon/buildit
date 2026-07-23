"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { requireAuthenticatedUser } from "@/lib/authHelpers"
import { getUnitPillLabel } from "@/lib/projects/floorLabels"
import { loadProjectCatalogIds } from "@/lib/projects/projectCatalogServer"
import { PROJECT_ROLE_SLUG } from "@/lib/projects/catalogSlugs"

export type ProjectClientUnit = {
  id: string
  label: string
  pillLabel: string
}

export type ProjectClient = {
  userId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  avatarUrl: string | null
  units: ProjectClientUnit[]
}

export type ProjectClientInvitation = {
  invitationId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  units: ProjectClientUnit[]
}

export type ProjectUnitOption = {
  id: string
  label: string
  pillLabel: string
}

export type ProjectClientsData = {
  clients: ProjectClient[]
  pendingInvitations: ProjectClientInvitation[]
  unitOptions: ProjectUnitOption[]
}

type RawUnit = {
  id: string
  floor_id: string
  code: string | null
  sort_order: number
}

type RawFloor = {
  id: string
  name: string
  identifier: string | null
  sort_order: number
}

function buildUnitOptions(
  floors: RawFloor[],
  units: RawUnit[],
): ProjectUnitOption[] {
  const floorOrder = new Map(
    [...floors]
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((floor, index) => [floor.id, index]),
  )
  const floorById = new Map(floors.map((floor) => [floor.id, floor]))

  const unitsSorted = [...units].sort((a, b) => {
    const floorDiff =
      (floorOrder.get(a.floor_id) ?? 0) - (floorOrder.get(b.floor_id) ?? 0)
    if (floorDiff !== 0) return floorDiff
    return (a.sort_order ?? 0) - (b.sort_order ?? 0)
  })

  const unitsByFloor = new Map<string, RawUnit[]>()
  for (const unit of unitsSorted) {
    const list = unitsByFloor.get(unit.floor_id) ?? []
    list.push(unit)
    unitsByFloor.set(unit.floor_id, list)
  }

  return unitsSorted.map((unit) => {
    const floor = floorById.get(unit.floor_id)
    const floorUnits = unitsByFloor.get(unit.floor_id) ?? []
    const unitIndex = floorUnits.findIndex((item) => item.id === unit.id) + 1
    const pillLabel = getUnitPillLabel(
      { name: floor?.name ?? "Piso", identifier: floor?.identifier ?? null },
      { id: unit.id, code: unit.code },
      unitIndex,
    )

    return {
      id: unit.id,
      pillLabel,
      label: `Unidad ${pillLabel}`,
    }
  })
}

function mapUnitsById(
  unitIds: string[],
  unitOptionById: Map<string, ProjectUnitOption>,
): ProjectClientUnit[] {
  return unitIds
    .map((unitId) => {
      const option = unitOptionById.get(unitId)
      if (!option) return null
      return {
        id: option.id,
        label: option.label,
        pillLabel: option.pillLabel,
      }
    })
    .filter((unit): unit is ProjectClientUnit => unit !== null)
}

async function validateUnitAssignment(
  admin: ReturnType<typeof createAdminClient>,
  projectId: string,
  unitIds: string[],
  excludeUserId?: string,
  excludeInvitationId?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (unitIds.length === 0) return { ok: true }

  const { data: projectUnits, error: unitsError } = await admin
    .from("project_units")
    .select("id")
    .eq("project_id", projectId)
    .in("id", unitIds)

  if (unitsError) return { ok: false, error: unitsError.message }
  if ((projectUnits ?? []).length !== unitIds.length) {
    return { ok: false, error: "Una o más unidades no son válidas." }
  }

  let activeQuery = admin
    .from("unit_clients")
    .select("unit_id, user_id")
    .in("unit_id", unitIds)
    .eq("status", "active")

  if (excludeUserId) {
    activeQuery = activeQuery.neq("user_id", excludeUserId)
  }

  const { data: activeAssignments, error: activeError } = await activeQuery
  if (activeError) return { ok: false, error: activeError.message }
  if ((activeAssignments ?? []).length > 0) {
    return { ok: false, error: "Una o más unidades ya están asignadas a otro cliente." }
  }

  let invitationQuery = admin
    .from("client_invitation_units")
    .select("unit_id, invitation_id")
    .in("unit_id", unitIds)

  if (excludeInvitationId) {
    invitationQuery = invitationQuery.neq("invitation_id", excludeInvitationId)
  }

  const { data: invitationAssignments, error: invitationError } =
    await invitationQuery

  if (invitationError) {
    if (invitationError.code === "42P01") return { ok: true }
    return { ok: false, error: invitationError.message }
  }

  const invitationIds = [
    ...new Set((invitationAssignments ?? []).map((row) => row.invitation_id)),
  ]

  if (invitationIds.length > 0) {
    const { data: pendingInvitations, error: pendingError } = await admin
      .from("project_invitations")
      .select("id")
      .in("id", invitationIds)
      .eq("project_id", projectId)
      .eq("status", "pending")

    if (pendingError) return { ok: false, error: pendingError.message }
    if ((pendingInvitations ?? []).length > 0) {
      return {
        ok: false,
        error: "Una o más unidades ya están reservadas en otra invitación pendiente.",
      }
    }
  }

  return { ok: true }
}

async function replaceInvitationUnits(
  admin: ReturnType<typeof createAdminClient>,
  invitationId: string,
  unitIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error: deleteError } = await admin
    .from("client_invitation_units")
    .delete()
    .eq("invitation_id", invitationId)

  if (deleteError) {
    if (deleteError.code === "42P01") return { ok: true }
    return { ok: false, error: deleteError.message }
  }

  if (unitIds.length === 0) return { ok: true }

  const { error: insertError } = await admin.from("client_invitation_units").insert(
    unitIds.map((unitId) => ({
      invitation_id: invitationId,
      unit_id: unitId,
    })),
  )

  if (insertError) {
    if (insertError.code === "42P01") return { ok: true }
    return { ok: false, error: insertError.message }
  }

  return { ok: true }
}

async function syncClientUnits(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  unitIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: currentRows, error: currentError } = await admin
    .from("unit_clients")
    .select("unit_id, status")
    .eq("user_id", userId)
    .eq("status", "active")

  if (currentError) return { ok: false, error: currentError.message }

  const currentIds = new Set((currentRows ?? []).map((row) => row.unit_id))
  const nextIds = new Set(unitIds)

  const toDisable = [...currentIds].filter((unitId) => !nextIds.has(unitId))
  const toEnable = [...nextIds].filter((unitId) => !currentIds.has(unitId))

  if (toDisable.length > 0) {
    const { error } = await admin
      .from("unit_clients")
      .update({ status: "disabled", revoked_at: new Date().toISOString() })
      .eq("user_id", userId)
      .in("unit_id", toDisable)
      .eq("status", "active")

    if (error) return { ok: false, error: error.message }
  }

  for (const unitId of toEnable) {
    const { data: existing } = await admin
      .from("unit_clients")
      .select("id, status")
      .eq("user_id", userId)
      .eq("unit_id", unitId)
      .maybeSingle()

    if (existing?.status === "disabled") {
      const { error } = await admin
        .from("unit_clients")
        .update({ status: "active", revoked_at: null })
        .eq("id", existing.id)

      if (error) return { ok: false, error: error.message }
    } else if (!existing) {
      const { error } = await admin.from("unit_clients").insert({
        unit_id: unitId,
        user_id: userId,
        status: "active",
      })

      if (error) return { ok: false, error: error.message }
    }
  }

  return { ok: true }
}

export async function getProjectClientsData(
  projectId: string,
): Promise<ProjectClientsData> {
  await requireAuthenticatedUser()
  const admin = createAdminClient()
  const supabase = await createClient()

  const [floorsRes, unitsRes, invitationsRes, rolesRes] = await Promise.all([
    admin
      .from("project_floors")
      .select("id, name, identifier, sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true }),
    admin
      .from("project_units")
      .select("id, floor_id, code, sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("project_invitations")
      .select("id, email, first_name, last_name, phone, role_id")
      .eq("project_id", projectId)
      .eq("status", "pending"),
    admin.from("project_roles").select("id, slug"),
  ])

  const floors = (floorsRes.data ?? []) as RawFloor[]
  const units = (unitsRes.data ?? []) as RawUnit[]
  const invitations = invitationsRes.data ?? []
  const roles = rolesRes.data ?? []

  const unitOptions = buildUnitOptions(floors, units)
  const unitOptionById = new Map(unitOptions.map((unit) => [unit.id, unit]))
  const unitIds = units.map((unit) => unit.id)

  const invitationIds = invitations.map((invitation) => invitation.id)
  const invitationUnitsRes =
    invitationIds.length > 0
      ? await admin
          .from("client_invitation_units")
          .select("invitation_id, unit_id")
          .in("invitation_id", invitationIds)
      : { data: [] }

  const invitationUnitsMap = new Map<string, string[]>()
  for (const row of invitationUnitsRes.data ?? []) {
    const list = invitationUnitsMap.get(row.invitation_id) ?? []
    list.push(row.unit_id)
    invitationUnitsMap.set(row.invitation_id, list)
  }

  const unitClientsData =
    unitIds.length > 0
      ? await admin
          .from("unit_clients")
          .select("unit_id, user_id")
          .in("unit_id", unitIds)
          .eq("status", "active")
      : { data: [] }

  const unitClientRows = unitClientsData.data ?? []
  const clientUserIds = [...new Set(unitClientRows.map((uc) => uc.user_id))]

  const profilesRes =
    clientUserIds.length > 0
      ? await admin
          .from("profiles")
          .select("id, first_name, last_name, email, phone, avatar_url")
          .in("id", clientUserIds)
      : { data: [] }

  const profileById = new Map((profilesRes.data ?? []).map((p) => [p.id, p]))

  const clientUnitsMap = new Map<string, string[]>()
  for (const uc of unitClientRows) {
    const list = clientUnitsMap.get(uc.user_id) ?? []
    list.push(uc.unit_id)
    clientUnitsMap.set(uc.user_id, list)
  }

  const clients: ProjectClient[] = clientUserIds
    .map((userId) => {
      const profile = profileById.get(userId)
      if (!profile) return null
      return {
        userId,
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        email: profile.email,
        phone: profile.phone ?? null,
        avatarUrl: profile.avatar_url ?? null,
        units: mapUnitsById(clientUnitsMap.get(userId) ?? [], unitOptionById),
      }
    })
    .filter((c): c is ProjectClient => c !== null)

  const clienteSlug = PROJECT_ROLE_SLUG.Cliente
  const roleById = new Map(roles.map((role) => [role.id, role.slug]))
  const pendingInvitations: ProjectClientInvitation[] = invitations
    .filter((invitation) => roleById.get(invitation.role_id) === clienteSlug)
    .map((invitation) => ({
      invitationId: invitation.id,
      firstName: invitation.first_name,
      lastName: invitation.last_name,
      email: invitation.email,
      phone: invitation.phone ?? null,
      units: mapUnitsById(
        invitationUnitsMap.get(invitation.id) ?? [],
        unitOptionById,
      ),
    }))

  return { clients, pendingInvitations, unitOptions }
}

export async function addProjectClientInvitation(
  projectId: string,
  data: {
    firstName: string
    lastName: string
    email: string
    phone: string | null
    unitIds: string[]
  },
): Promise<
  | { ok: true; invitation: ProjectClientInvitation }
  | { ok: false; error: string }
> {
  const user = await requireAuthenticatedUser()
  const supabase = await createClient()
  const admin = createAdminClient()

  const unitValidation = await validateUnitAssignment(
    admin,
    projectId,
    data.unitIds,
  )
  if (!unitValidation.ok) return unitValidation

  let catalog
  try {
    catalog = await loadProjectCatalogIds(supabase)
  } catch {
    return { ok: false, error: "No se pudo cargar la configuración del proyecto." }
  }

  const { data: invitation, error } = await supabase
    .from("project_invitations")
    .insert({
      project_id: projectId,
      email: data.email.trim().toLowerCase(),
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      phone: data.phone?.trim() || null,
      user_type_id: catalog.userTypeIds.Cliente,
      role_id: catalog.roleIds.Cliente,
      status: "pending",
      invited_by: user.id,
    })
    .select("id, email, first_name, last_name, phone")
    .single()

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Ya existe una invitación pendiente para ese correo." }
    }
    return { ok: false, error: error.message }
  }

  const unitsResult = await replaceInvitationUnits(
    admin,
    invitation.id,
    data.unitIds,
  )
  if (!unitsResult.ok) return unitsResult

  const refreshed = await getProjectClientsData(projectId)
  const created =
    refreshed.pendingInvitations.find(
      (item) => item.invitationId === invitation.id,
    ) ??
    ({
      invitationId: invitation.id,
      firstName: invitation.first_name,
      lastName: invitation.last_name,
      email: invitation.email,
      phone: invitation.phone ?? null,
      units: mapUnitsById(
        data.unitIds,
        new Map(refreshed.unitOptions.map((unit) => [unit.id, unit])),
      ),
    } satisfies ProjectClientInvitation)

  revalidatePath(`/${projectId}/clientes`)
  return { ok: true, invitation: created }
}

export async function updateProjectClientInvitation(
  projectId: string,
  invitationId: string,
  data: {
    firstName: string
    lastName: string
    email: string
    phone: string | null
    unitIds: string[]
  },
): Promise<
  | { ok: true; invitation: ProjectClientInvitation }
  | { ok: false; error: string }
> {
  await requireAuthenticatedUser()
  const supabase = await createClient()
  const admin = createAdminClient()

  const unitValidation = await validateUnitAssignment(
    admin,
    projectId,
    data.unitIds,
    undefined,
    invitationId,
  )
  if (!unitValidation.ok) return unitValidation

  const { data: invitation, error } = await supabase
    .from("project_invitations")
    .update({
      email: data.email.trim().toLowerCase(),
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      phone: data.phone?.trim() || null,
    })
    .eq("id", invitationId)
    .eq("project_id", projectId)
    .eq("status", "pending")
    .select("id, email, first_name, last_name, phone")
    .single()

  if (error || !invitation) {
    return { ok: false, error: error?.message ?? "Invitación no encontrada." }
  }

  const unitsResult = await replaceInvitationUnits(
    admin,
    invitationId,
    data.unitIds,
  )
  if (!unitsResult.ok) return unitsResult

  const refreshed = await getProjectClientsData(projectId)
  const updated = refreshed.pendingInvitations.find(
    (item) => item.invitationId === invitationId,
  )

  if (!updated) {
    return { ok: false, error: "No se pudo cargar la invitación actualizada." }
  }

  revalidatePath(`/${projectId}/clientes`)
  return { ok: true, invitation: updated }
}

export async function updateProjectClient(
  projectId: string,
  userId: string,
  data: {
    firstName: string
    lastName: string
    phone: string | null
    unitIds: string[]
  },
): Promise<{ ok: true; client: ProjectClient } | { ok: false; error: string }> {
  await requireAuthenticatedUser()
  const admin = createAdminClient()

  const unitValidation = await validateUnitAssignment(
    admin,
    projectId,
    data.unitIds,
    userId,
  )
  if (!unitValidation.ok) return unitValidation

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      phone: data.phone?.trim() || null,
    })
    .eq("id", userId)

  if (profileError) return { ok: false, error: profileError.message }

  const unitsResult = await syncClientUnits(admin, userId, data.unitIds)
  if (!unitsResult.ok) return unitsResult

  const refreshed = await getProjectClientsData(projectId)
  const updated = refreshed.clients.find((client) => client.userId === userId)

  if (!updated) {
    return { ok: false, error: "No se pudo cargar el cliente actualizado." }
  }

  revalidatePath(`/${projectId}/clientes`)
  return { ok: true, client: updated }
}

export async function revokeClientInvitation(
  invitationId: string,
  projectId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAuthenticatedUser()
  const supabase = await createClient()
  const admin = createAdminClient()

  const { error } = await supabase
    .from("project_invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("project_id", projectId)

  if (error) return { ok: false, error: error.message }

  await admin.from("client_invitation_units").delete().eq("invitation_id", invitationId)

  revalidatePath(`/${projectId}/clientes`)
  return { ok: true }
}

export async function removeProjectClient(
  projectId: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAuthenticatedUser()
  const supabase = await createClient()

  const { data: units } = await supabase
    .from("project_units")
    .select("id")
    .eq("project_id", projectId)

  const unitIds = (units ?? []).map((unit) => unit.id)

  if (unitIds.length > 0) {
    const { error } = await supabase
      .from("unit_clients")
      .update({ status: "disabled", revoked_at: new Date().toISOString() })
      .in("unit_id", unitIds)
      .eq("user_id", userId)

    if (error) return { ok: false, error: error.message }
  }

  revalidatePath(`/${projectId}/clientes`)
  return { ok: true }
}
