"use server"

import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { requireAuthenticatedUser } from "@/lib/authHelpers"
import { loadProjectCatalogIds } from "@/lib/projects/projectCatalogServer"
import { PROJECT_ROLE_SLUG } from "@/lib/projects/catalogSlugs"

export type ProjectClient = {
  userId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  units: { id: string; label: string }[]
}

export type ProjectClientInvitation = {
  invitationId: string
  firstName: string
  lastName: string
  email: string
}

export type ProjectUnitOption = {
  id: string
  label: string
}

export type ProjectClientsData = {
  clients: ProjectClient[]
  pendingInvitations: ProjectClientInvitation[]
  unitOptions: ProjectUnitOption[]
}

export async function getProjectClientsData(projectId: string): Promise<ProjectClientsData> {
  await requireAuthenticatedUser()
  const admin = createAdminClient()
  const supabase = await createClient()

  const [floorsRes, unitsRes, unitTypesRes, invitationsRes, rolesRes] = await Promise.all([
    admin.from("project_floors").select("id, name").eq("project_id", projectId),
    admin
      .from("project_units")
      .select("id, floor_id, unit_type_id, sort_order")
      .eq("project_id", projectId),
    admin.from("unit_types").select("id, label"),
    supabase
      .from("project_invitations")
      .select("id, email, first_name, last_name, role_id")
      .eq("project_id", projectId)
      .eq("status", "pending"),
    admin.from("project_roles").select("id, slug"),
  ])

  const floors = floorsRes.data ?? []
  const units = unitsRes.data ?? []
  const unitTypes = unitTypesRes.data ?? []
  const invitations = invitationsRes.data ?? []
  const roles = rolesRes.data ?? []

  const floorById = new Map(floors.map((f) => [f.id, f]))
  const unitTypeById = new Map(unitTypes.map((t) => [t.id, t]))
  const roleById = new Map(roles.map((r) => [r.id, r]))

  // Build unit options — label is "{floor.name} · {type} {position within floor+type}"
  const unitOptions: ProjectUnitOption[] = units
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((unit) => {
      const floor = floorById.get(unit.floor_id)
      const unitType = unitTypeById.get(unit.unit_type_id)
      const sameTypeInFloor = units.filter(
        (u) => u.floor_id === unit.floor_id && u.unit_type_id === unit.unit_type_id,
      )
      const position = sameTypeInFloor.findIndex((u) => u.id === unit.id) + 1
      return {
        id: unit.id,
        label: `${floor?.name ?? "Piso"} · ${unitType?.label ?? "Unidad"} ${position}`,
      }
    })

  const unitLabelById = new Map(unitOptions.map((u) => [u.id, u.label]))
  const unitIds = units.map((u) => u.id)

  // Get active unit_clients for this project
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
          .select("id, first_name, last_name, email, phone")
          .in("id", clientUserIds)
      : { data: [] }

  const profileById = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p]),
  )

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
        units: (clientUnitsMap.get(userId) ?? []).map((uid) => ({
          id: uid,
          label: unitLabelById.get(uid) ?? uid,
        })),
      }
    })
    .filter((c): c is ProjectClient => c !== null)

  const clienteSlug = PROJECT_ROLE_SLUG.Cliente
  const pendingInvitations: ProjectClientInvitation[] = invitations
    .filter((i) => roleById.get(i.role_id)?.slug === clienteSlug)
    .map((i) => ({
      invitationId: i.id,
      firstName: i.first_name,
      lastName: i.last_name,
      email: i.email,
    }))

  return { clients, pendingInvitations, unitOptions }
}

export async function addProjectClientInvitation(
  projectId: string,
  data: {
    firstName: string
    lastName: string
    email: string
  },
): Promise<
  | { ok: true; invitation: ProjectClientInvitation }
  | { ok: false; error: string }
> {
  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

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
      user_type_id: catalog.userTypeIds.Cliente,
      role_id: catalog.roleIds.Cliente,
      status: "pending",
      invited_by: user.id,
    })
    .select("id, email, first_name, last_name")
    .single()

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Ya existe una invitación pendiente para ese correo." }
    }
    return { ok: false, error: error.message }
  }

  return {
    ok: true,
    invitation: {
      invitationId: invitation.id,
      firstName: invitation.first_name,
      lastName: invitation.last_name,
      email: invitation.email,
    },
  }
}

export async function revokeClientInvitation(
  invitationId: string,
  projectId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAuthenticatedUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from("project_invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("project_id", projectId)

  if (error) return { ok: false, error: error.message }
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

  const unitIds = (units ?? []).map((u) => u.id)

  if (unitIds.length > 0) {
    const { error } = await supabase
      .from("unit_clients")
      .update({ status: "disabled", revoked_at: new Date().toISOString() })
      .in("unit_id", unitIds)
      .eq("user_id", userId)

    if (error) return { ok: false, error: error.message }
  }

  return { ok: true }
}
