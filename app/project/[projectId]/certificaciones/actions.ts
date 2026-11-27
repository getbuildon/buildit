"use server"

import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { getAuthenticatedUserOrNull, requireAuthenticatedUser } from "@/lib/authHelpers"
import { checkProjectPermission, checkProjectSectionAccess } from "@/lib/project/projectAccess"
import { revalidateProjectPath } from "@/lib/project/revalidateProjectPath"
import { hasProjectPermission } from "@/lib/project/projectPermissions"
import { loadUnitTaskAssignmentsByUnit } from "@/lib/projects/loadUnitTaskAssignments"
import { loadLatestProgressEntries } from "@/lib/projects/loadLatestProgressEntries"
import { loadProjectMemberDisplayNames } from "@/lib/projects/projectMemberFicha"
import { armarCertificaciones } from "@/lib/projects/armarCertificaciones"

export type CertificacionMember = {
  userId: string
  name: string
}

export type CertificacionTask = {
  entryId: string
  taskCode: string
  taskName: string
  rubroName: string
  floorName: string
  unitLabel: string
  authorId: string
  authorName: string
  certifiedById: string | null
  certifiedByName: string | null
  occurredAt: string
  certifiedAt: string | null
  formattedDate: string
  formattedTime: string
  comment: string | null
  daysPending: number
  isUrgent: boolean
  status: "pending" | "certified"
}

export type CertificacionesData = {
  tasks: CertificacionTask[]
  members: CertificacionMember[]
  canCertify: boolean
}

export async function getCertificacionesData(
  projectId: string,
): Promise<CertificacionesData | null> {
  const id = projectId.trim()
  if (!id) return null

  const user = await getAuthenticatedUserOrNull()
  if (!user) return null

  const section = await checkProjectSectionAccess(id, "certificaciones")
  if (!section.ok) return null
  const accessContext = section.context

  const supabase = await createClient()
  const admin = createAdminClient()

  const [floorsResult, unitsResult, assignmentsByUnit, groupsResult, entries] =
    await Promise.all([
      supabase
        .from("project_floors")
        .select("id, name, identifier, sort_order")
        .eq("project_id", id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("project_units")
        .select("id, floor_id, code, sort_order")
        .eq("project_id", id)
        .order("sort_order", { ascending: true }),
      loadUnitTaskAssignmentsByUnit(supabase, id),
      supabase
        .from("rubro_groups")
        .select(
          `
          id, sort_order,
          rubros (
            id, name, sort_order,
            rubro_tasks (id, name, sort_order)
          )
        `,
        )
        .eq("project_id", id)
        .order("sort_order", { ascending: true }),
      loadLatestProgressEntries(supabase, id, {
        statuses: ["submitted", "approved"],
      }),
    ])

  if (floorsResult.error || unitsResult.error || groupsResult.error) {
    return null
  }

  const canCertify =
    accessContext != null &&
    hasProjectPermission(accessContext.permissions, "certifyTasks")

  // Certificaciones vigentes de lo ya certificado y nombres de autores y certificadores.
  const approvedIds = entries.filter((e) => e.status === "approved").map((e) => e.id)
  const { data: validations } = approvedIds.length
    ? await supabase
        .from("progress_validations")
        .select("progress_entry_id, validated_at, validated_by, comment")
        .in("progress_entry_id", approvedIds)
        .eq("decision", "approved")
        .order("validated_at", { ascending: false })
    : { data: [] }
  const personIds = [
    ...new Set([...entries.map((e) => e.created_by), ...(validations ?? []).map((v) => v.validated_by)]),
  ]
  const nameById = await loadProjectMemberDisplayNames(admin, id, personIds)

  return armarCertificaciones(
    {
      floors: floorsResult.data ?? [],
      units: unitsResult.data ?? [],
      rubroGroups: groupsResult.data ?? [],
      assignmentsByUnit,
      entries,
      validations: validations ?? [],
      nombres: Object.fromEntries(nameById),
    },
    canCertify,
    new Date(),
  )
}

export async function certifyProgressEntries(
  projectId: string,
  entryIds: string[],
  notesByEntryId?: Record<string, string>,
): Promise<{ ok: true; certifiedCount: number } | { ok: false; error: string }> {
  const id = projectId.trim()
  if (!id) return { ok: false, error: "Proyecto inválido." }

  const uniqueEntryIds = [...new Set(entryIds.map((entryId) => entryId.trim()))].filter(Boolean)
  if (uniqueEntryIds.length === 0) {
    return { ok: false, error: "Seleccioná al menos una tarea." }
  }

  const permission = await checkProjectPermission(id, "certifyTasks")
  if (!permission.ok) return permission

  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

  const { data: entries, error: entriesError } = await supabase
    .from("progress_entries")
    .select("id, status, progress_state")
    .eq("project_id", id)
    .in("id", uniqueEntryIds)

  if (entriesError) return { ok: false, error: entriesError.message }
  if (!entries || entries.length !== uniqueEntryIds.length) {
    return { ok: false, error: "Una o más tareas no son válidas." }
  }

  const pendingEntries = entries.filter(
    (entry) => entry.status === "submitted" && entry.progress_state === "completed",
  )
  if (pendingEntries.length === 0) {
    const hasInProgress = entries.some(
      (entry) => entry.status === "submitted" && entry.progress_state !== "completed",
    )
    if (hasInProgress) {
      return { ok: false, error: "Solo se pueden certificar tareas completadas." }
    }
    return { ok: false, error: "Las tareas seleccionadas ya están certificadas." }
  }

  const now = new Date().toISOString()
  let certifiedCount = 0

  for (const entry of pendingEntries) {
    const note = notesByEntryId?.[entry.id]?.trim()
    const { error: validationError } = await supabase.from("progress_validations").insert({
      progress_entry_id: entry.id,
      validated_by: user.id,
      decision: "approved",
      comment: note || null,
      validated_at: now,
    })

    if (validationError) {
      return { ok: false, error: validationError.message }
    }

    const { error: updateError } = await supabase
      .from("progress_entries")
      .update({ status: "approved", progress_state: "completed" })
      .eq("id", entry.id)
      .eq("project_id", id)

    if (updateError) return { ok: false, error: updateError.message }
    certifiedCount += 1
  }

  revalidateProjectPath(id, "certificaciones")
  revalidateProjectPath(id, "trabajo-diario")
  revalidateProjectPath(id)

  return { ok: true, certifiedCount }
}
