"use server"

import { differenceInDays, format } from "date-fns"
import { es } from "date-fns/locale"
import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { getAuthenticatedUserOrNull, requireAuthenticatedUser } from "@/lib/authHelpers"
import { checkProjectPermission, getProjectAccessContext } from "@/lib/project/projectAccess"
import { hasProjectPermission } from "@/lib/project/projectPermissions"
import { buildTaskCodeMap } from "@/lib/projects/unitDetailTasks"
import { isTaskAssignedToUnit } from "@/lib/projects/unitTaskAssignments"
import { getUnitPillLabel } from "@/lib/projects/floorLabels"
import { getUnitTaskAssignments } from "../configuracion/actions"

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

function formatProfileName(profile: {
  first_name: string | null
  last_name: string | null
  email: string
}): string {
  const firstName = profile.first_name?.trim()
  const lastName = profile.last_name?.trim()
  if (firstName && lastName) return `${firstName} ${lastName}`
  if (firstName) return firstName
  return profile.email
}

function formatTaskDate(value: string): string {
  return format(new Date(value), "d MMM yyyy", { locale: es })
}

function formatTaskTime(value: string): string {
  return format(new Date(value), "H:mm", { locale: es }) + " h"
}

export async function getCertificacionesData(
  projectId: string,
): Promise<CertificacionesData | null> {
  const id = projectId.trim()
  if (!id) return null

  const user = await getAuthenticatedUserOrNull()
  if (!user) return null

  const supabase = await createClient()
  const admin = createAdminClient()

  const [floorsResult, unitsResult, assignments, groupsResult, entriesResult, accessContext] =
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
      getUnitTaskAssignments(id),
      supabase
        .from("rubro_groups")
        .select(
          `
          id, sort_order,
          rubros (
            id, sort_order,
            rubro_tasks (id, sort_order)
          )
        `,
        )
        .eq("project_id", id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("progress_entries")
        .select(`
          id,
          unit_id,
          floor_id,
          task_id,
          status,
          progress_state,
          comment,
          created_at,
          submitted_at,
          created_by,
          rubros:category_id (name),
          rubro_tasks:task_id (name)
        `)
        .eq("project_id", id)
        .in("status", ["submitted", "approved"])
        .order("created_at", { ascending: false }),
      getProjectAccessContext(id),
    ])

  if (floorsResult.error || unitsResult.error || groupsResult.error || entriesResult.error) {
    return null
  }

  const floors = floorsResult.data ?? []
  const units = unitsResult.data ?? []
  const entries = entriesResult.data ?? []
  const taskCodeById = buildTaskCodeMap(groupsResult.data ?? [])
  const canCertify =
    accessContext != null &&
    hasProjectPermission(accessContext.permissions, "certifyTasks")

  const floorById = new Map(floors.map((floor) => [floor.id, floor.name]))

  const unitsByFloor = new Map<string, typeof units>()
  for (const unit of units) {
    const list = unitsByFloor.get(unit.floor_id) ?? []
    list.push(unit)
    unitsByFloor.set(unit.floor_id, list)
  }

  const unitIndexById = new Map<string, { floorName: string; unitLabel: string }>()
  for (const floor of floors) {
    const floorUnits = (unitsByFloor.get(floor.id) ?? []).sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    )
    floorUnits.forEach((unit, index) => {
      const unitCode = getUnitPillLabel(
        { name: floor.name, identifier: floor.identifier },
        { id: unit.id, code: unit.code },
        index + 1,
      )
      unitIndexById.set(unit.id, {
        floorName: floor.name,
        unitLabel: unitCode === "—" ? "—" : `Unidad ${unitCode}`,
      })
    })
  }

  const latestEntryKeys = new Set<string>()
  const tasks: CertificacionTask[] = []
  const authorIds = new Set<string>()

  for (const entry of entries) {
    if (!entry.unit_id || !entry.task_id) continue
    if (!isTaskAssignedToUnit(assignments.byUnit, entry.unit_id, entry.task_id)) {
      continue
    }

    const unitTaskKey = `${entry.unit_id}:${entry.task_id}`
    if (latestEntryKeys.has(unitTaskKey)) continue
    latestEntryKeys.add(unitTaskKey)

    if (entry.status !== "submitted" && entry.status !== "approved") continue
    if (entry.status === "submitted" && entry.progress_state !== "completed") continue

    const unitMeta = unitIndexById.get(entry.unit_id)
    const floorId = entry.floor_id
    const floorName =
      unitMeta?.floorName ??
      (floorId ? floorById.get(floorId) ?? "—" : "—")

    const rubro = entry.rubros as { name: string } | { name: string }[] | null
    const task = entry.rubro_tasks as { name: string } | { name: string }[] | null
    const rubroName = Array.isArray(rubro) ? rubro[0]?.name : rubro?.name
    const taskName = Array.isArray(task) ? task[0]?.name : task?.name

    const occurredAt = entry.submitted_at ?? entry.created_at
    const daysPending = Math.max(0, differenceInDays(new Date(), new Date(occurredAt)))

    authorIds.add(entry.created_by)

    tasks.push({
      entryId: entry.id,
      taskCode: taskCodeById.get(entry.task_id) ?? "—",
      taskName: taskName ?? "Tarea",
      rubroName: rubroName ?? "Rubro",
      floorName,
      unitLabel: unitMeta?.unitLabel ?? "—",
      authorId: entry.created_by,
      authorName: "",
      certifiedById: null,
      certifiedByName: null,
      occurredAt,
      certifiedAt: null,
      formattedDate: formatTaskDate(occurredAt),
      formattedTime: formatTaskTime(occurredAt),
      comment: entry.comment,
      daysPending,
      isUrgent: daysPending >= 7,
      status: entry.status === "approved" ? "certified" : "pending",
    })
  }

  const { data: profiles } =
    authorIds.size > 0
      ? await admin
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", [...authorIds])
      : { data: [] as Array<{
          id: string
          first_name: string | null
          last_name: string | null
          email: string
        }> }

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

  for (const task of tasks) {
    const profile = profileById.get(task.authorId)
    task.authorName = profile ? formatProfileName(profile) : "Usuario"
  }

  const certifiedEntryIds = tasks
    .filter((task) => task.status === "certified")
    .map((task) => task.entryId)

  if (certifiedEntryIds.length > 0) {
    const { data: validations } = await supabase
      .from("progress_validations")
      .select("progress_entry_id, validated_at, validated_by, comment")
      .in("progress_entry_id", certifiedEntryIds)
      .eq("decision", "approved")
      .order("validated_at", { ascending: false })

    const certifiedAtByEntryId = new Map<string, string>()
    const certifiedByIdByEntryId = new Map<string, string>()
    const certificationCommentByEntryId = new Map<string, string | null>()

    for (const validation of validations ?? []) {
      if (certifiedAtByEntryId.has(validation.progress_entry_id)) continue
      certifiedAtByEntryId.set(validation.progress_entry_id, validation.validated_at)
      certifiedByIdByEntryId.set(validation.progress_entry_id, validation.validated_by)
      certificationCommentByEntryId.set(
        validation.progress_entry_id,
        validation.comment,
      )
    }

    const certifierIds = [...new Set([...certifiedByIdByEntryId.values()])]
    const missingCertifierIds = certifierIds.filter((userId) => !profileById.has(userId))

    if (missingCertifierIds.length > 0) {
      const { data: certifierProfiles } = await admin
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", missingCertifierIds)

      for (const profile of certifierProfiles ?? []) {
        profileById.set(profile.id, profile)
      }
    }

    for (const task of tasks) {
      if (task.status !== "certified") continue

      const certifiedAt =
        certifiedAtByEntryId.get(task.entryId) ?? task.occurredAt
      task.certifiedAt = certifiedAt
      task.formattedDate = formatTaskDate(certifiedAt)
      task.formattedTime = formatTaskTime(certifiedAt)

      const certifierId = certifiedByIdByEntryId.get(task.entryId)
      task.certifiedById = certifierId ?? null
      task.certifiedByName = certifierId
        ? profileById.get(certifierId)
          ? formatProfileName(profileById.get(certifierId)!)
          : "Usuario"
        : null

      const certificationComment = certificationCommentByEntryId.get(task.entryId)
      if (certificationComment !== undefined) {
        task.comment = certificationComment
      }
    }
  }

  const memberIds = new Set(authorIds)
  for (const task of tasks) {
    if (task.certifiedById) memberIds.add(task.certifiedById)
  }

  const members: CertificacionMember[] = [...memberIds]
    .map((userId) => {
      const profile = profileById.get(userId)
      if (!profile) return null
      return { userId, name: formatProfileName(profile) }
    })
    .filter((member): member is CertificacionMember => member !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "es"))

  return { tasks, members, canCertify }
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

  revalidatePath(`/${id}/certificaciones`)
  revalidatePath(`/${id}/trabajo-diario`)
  revalidatePath(`/${id}`)

  return { ok: true, certifiedCount }
}
