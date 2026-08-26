"use server"

import { differenceInDays } from "date-fns"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { getAuthenticatedUserOrNull, requireAuthenticatedUser } from "@/lib/authHelpers"
import {
  formatArgentinaTaskDate,
  formatArgentinaTaskTime,
} from "@/lib/datetime/argentinaDateTime"
import { checkProjectPermission, checkProjectSectionAccess } from "@/lib/project/projectAccess"
import { revalidateProjectPath } from "@/lib/project/revalidateProjectPath"
import { hasProjectPermission } from "@/lib/project/projectPermissions"
import { buildTaskCodeMap, buildTaskLabelMap } from "@/lib/projects/unitDetailTasks"
import { isTaskAssignedToUnit } from "@/lib/projects/unitTaskAssignments"
import { getUnitPillLabel } from "@/lib/projects/floorLabels"
import { loadUnitTaskAssignmentsByUnit } from "@/lib/projects/loadUnitTaskAssignments"
import { loadLatestProgressEntries } from "@/lib/projects/loadLatestProgressEntries"
import { loadProjectMemberDisplayNames } from "@/lib/projects/projectMemberFicha"

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

  const floors = floorsResult.data ?? []
  const units = unitsResult.data ?? []
  const assignments = { byUnit: assignmentsByUnit }
  const taskCodeById = buildTaskCodeMap(groupsResult.data ?? [])
  const taskLabelsById = buildTaskLabelMap(groupsResult.data ?? [])
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

  const tasks: CertificacionTask[] = []
  const authorIds = new Set<string>()

  for (const entry of entries) {
    if (!entry.unit_id || !entry.task_id) continue
    if (!isTaskAssignedToUnit(assignments.byUnit, entry.unit_id, entry.task_id)) {
      continue
    }

    if (entry.status !== "submitted" && entry.status !== "approved") continue
    if (entry.status === "submitted" && entry.progress_state !== "completed") continue

    const unitMeta = unitIndexById.get(entry.unit_id)
    const floorId = entry.floor_id
    const floorName =
      unitMeta?.floorName ??
      (floorId ? floorById.get(floorId) ?? "—" : "—")

    const labels = taskLabelsById.get(entry.task_id)
    const occurredAt = entry.submitted_at ?? entry.created_at
    const daysPending = Math.max(0, differenceInDays(new Date(), new Date(occurredAt)))

    authorIds.add(entry.created_by)

    tasks.push({
      entryId: entry.id,
      taskCode: taskCodeById.get(entry.task_id) ?? "—",
      taskName: labels?.taskName ?? "Tarea",
      rubroName: labels?.rubroName ?? "Rubro",
      floorName,
      unitLabel: unitMeta?.unitLabel ?? "—",
      authorId: entry.created_by,
      authorName: "",
      certifiedById: null,
      certifiedByName: null,
      occurredAt,
      certifiedAt: null,
      formattedDate: formatArgentinaTaskDate(occurredAt),
      formattedTime: formatArgentinaTaskTime(occurredAt),
      comment: entry.comment,
      daysPending,
      isUrgent: daysPending >= 7,
      status: entry.status === "approved" ? "certified" : "pending",
    })
  }

  const certifiedEntryIds = tasks
    .filter((task) => task.status === "certified")
    .map((task) => task.entryId)

  const certifiedAtByEntryId = new Map<string, string>()
  const certifiedByIdByEntryId = new Map<string, string>()
  const certificationCommentByEntryId = new Map<string, string | null>()

  if (certifiedEntryIds.length > 0) {
    const { data: validations } = await supabase
      .from("progress_validations")
      .select("progress_entry_id, validated_at, validated_by, comment")
      .in("progress_entry_id", certifiedEntryIds)
      .eq("decision", "approved")
      .order("validated_at", { ascending: false })

    for (const validation of validations ?? []) {
      if (certifiedAtByEntryId.has(validation.progress_entry_id)) continue
      certifiedAtByEntryId.set(validation.progress_entry_id, validation.validated_at)
      certifiedByIdByEntryId.set(validation.progress_entry_id, validation.validated_by)
      certificationCommentByEntryId.set(
        validation.progress_entry_id,
        validation.comment,
      )
    }
  }

  const memberIds = [...new Set([
    ...authorIds,
    ...certifiedByIdByEntryId.values(),
  ])]
  const nameById = await loadProjectMemberDisplayNames(admin, id, memberIds)

  for (const task of tasks) {
    task.authorName = nameById.get(task.authorId) ?? "Usuario"

    if (task.status !== "certified") continue

    const certifiedAt =
      certifiedAtByEntryId.get(task.entryId) ?? task.occurredAt
    task.certifiedAt = certifiedAt
    task.formattedDate = formatArgentinaTaskDate(certifiedAt)
    task.formattedTime = formatArgentinaTaskTime(certifiedAt)

    const certifierId = certifiedByIdByEntryId.get(task.entryId)
    task.certifiedById = certifierId ?? null
    task.certifiedByName = certifierId
      ? (nameById.get(certifierId) ?? "Usuario")
      : null

    const certificationComment = certificationCommentByEntryId.get(task.entryId)
    if (certificationComment !== undefined) {
      task.comment = certificationComment
    }
  }

  const members: CertificacionMember[] = memberIds
    .map((userId) => ({
      userId,
      name: nameById.get(userId) ?? "Usuario",
    }))
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

  revalidateProjectPath(id, "certificaciones")
  revalidateProjectPath(id, "trabajo-diario")
  revalidateProjectPath(id)

  return { ok: true, certifiedCount }
}
