"use server"

import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { getAuthenticatedUserOrNull, requireAuthenticatedUser } from "@/lib/authHelpers"
import { checkProjectPermission, getProjectAccessContext } from "@/lib/project/projectAccess"
import { revalidateProjectPath } from "@/lib/project/revalidateProjectPath"
import { canAccessUnitProgress } from "@/lib/project/projectAccessContext"
import {
  hasStrictProjectPermission,
  type ProjectPermissions,
} from "@/lib/project/projectPermissions"
import { isTaskAssignedToUnit } from "@/lib/projects/unitTaskAssignments"
import {
  getUnitTaskKey,
  isUnitTaskCompletedForLoading,
  mapTaskStatusToDb,
  type CargarAvanceTaskStatus,
} from "@/lib/projects/cargarAvance"
import { PROGRESS_PHOTOS_BUCKET } from "@/lib/progress/progressPhotoConfig"
import { loadUnitTaskAssignmentsByUnit } from "@/lib/projects/loadUnitTaskAssignments"
import { loadLatestProgressEntries } from "@/lib/projects/loadLatestProgressEntries"
import { loadProjectMemberDisplayNames } from "@/lib/projects/projectMemberFicha"
import { getUnitTaskAssignments } from "../configuracion/actions"
import { armarTrabajoDiario, type FilaDeGrupo } from "@/lib/projects/armarTrabajoDiario"
import { armarDetalleDeTrabajo } from "@/lib/projects/armarDetalleDeTrabajo"

export type SaveCargarAvanceInput = {
  projectId: string
  floorId: string
  rubroId: string
  unitIds: string[]
  tasks: Array<{
    taskId: string
    unitIds: string[]
    taskStatus: CargarAvanceTaskStatus
    comment: string | null
    photoCount?: number
  }>
}

export type SaveCargarAvanceResult =
  | {
      ok: true
      entries: Array<{ entryId: string; unitId: string; taskId: string }>
    }
  | { ok: false; error: string }

export type RegisterProgressAttachmentInput = {
  entryId: string
  storagePath: string
  fileName: string
  fileType: string
  fileSize: number
}

export type RegisterProgressAttachmentsResult = { ok: true } | { ok: false; error: string }

export type TrabajoDiarioTaskStatus = "Completado" | "En Proceso" | "Bloqueado" | "Certificada"

export type TrabajoDiarioTaskAttachment = {
  id: string
  fileName: string
  signedUrl: string
}

export type TrabajoDiarioTaskHistoryStatus = TrabajoDiarioTaskStatus | "Certificada"

export type TrabajoDiarioTaskHistoryItem = {
  id: string
  status: TrabajoDiarioTaskHistoryStatus
  comment: string | null
  occurredAt: string
  formattedDate: string
  authorName: string
  attachments: TrabajoDiarioTaskAttachment[]
}

export type TrabajoDiarioTaskDetail = {
  entryId: string
  taskName: string
  rubroName: string
  floorName: string
  floorIdentifier: string | null
  unitLabel: string
  occurredAt: string
  formattedLongDate: string
  registeredByName: string
  status: TrabajoDiarioTaskStatus
  comment: string | null
  attachments: TrabajoDiarioTaskAttachment[]
  history: TrabajoDiarioTaskHistoryItem[]
}

export type UpdateTrabajoDiarioTaskInput = {
  projectId: string
  entryId: string
  taskStatus: CargarAvanceTaskStatus
  comment: string | null
}

export type UpdateTrabajoDiarioTaskResult =
  | { ok: true; entryId: string }
  | { ok: false; error: string }

export type TrabajoDiarioTask = {
  id: string
  taskCode: string
  name: string
  category: string
  floorId: string
  floorName: string
  unitId: string
  unitLabel: string
  unitName: string | null
  occurredAt: string | null
  date: string
  status: TrabajoDiarioTaskStatus
}

export type TrabajoDiarioUnit = {
  id: string
  code: string | null
  name: string | null
}

export type TrabajoDiarioFloor = {
  id: string
  name: string
  identifier: string | null
  level: string | null
  units: TrabajoDiarioUnit[]
}

export type TrabajoDiarioRubroTask = {
  id: string
  name: string
  sortOrder: number
  weightPercent: number | null
}

export type TrabajoDiarioRubro = {
  id: string
  name: string
  tasks: TrabajoDiarioRubroTask[]
}

export type TrabajoDiarioRubroGroup = {
  id: string
  name: string
  rubros: TrabajoDiarioRubro[]
}

export type TrabajoDiarioData = {
  floors: TrabajoDiarioFloor[]
  tasks: TrabajoDiarioTask[]
  rubroGroups: TrabajoDiarioRubroGroup[]
  assignmentsByUnit: Record<string, string[]>
  loadedUnitTaskKeys: string[]
  unitTaskStatuses: Record<string, CargarAvanceTaskStatus>
}

const CERTIFIED_STATUS_LOCKED_ERROR =
  "No tenés permiso para cambiar el estado de una tarea certificada."

async function assertCanChangeCertifiedUnitTasks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  unitIds: string[],
  taskIds: string[],
  permissions: ProjectPermissions,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (hasStrictProjectPermission(permissions, "certifyTasks")) {
    return { ok: true }
  }

  const uniqueUnitIds = [...new Set(unitIds)]
  const targetTaskIds = new Set(taskIds)

  for (const unitId of uniqueUnitIds) {
    const latest = await loadLatestProgressEntries(supabase, projectId, { unitId })
    const certified = latest.some(
      (entry) => targetTaskIds.has(entry.task_id) && entry.status === "approved",
    )
    if (certified) {
      return { ok: false, error: CERTIFIED_STATUS_LOCKED_ERROR }
    }
  }

  return { ok: true }
}

async function getAttachmentsByEntry(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  entryIds: string[],
): Promise<Map<string, TrabajoDiarioTaskAttachment[]>> {
  const result = new Map<string, TrabajoDiarioTaskAttachment[]>()
  if (entryIds.length === 0) return result

  const { data, error } = await supabase
    .from("attachments")
    .select("id, entity_id, file_url, file_name, created_at")
    .eq("project_id", projectId)
    .eq("entity_type", "progress_entry")
    .in("entity_id", entryIds)
    .order("created_at", { ascending: true })

  if (error || !data) return result

  const storagePaths = [...new Set(data.map((row) => row.file_url))]
  const signedUrlByPath = new Map<string, string>()

  if (storagePaths.length > 0) {
    const { data: signedUrls, error: signedError } = await supabase.storage
      .from(PROGRESS_PHOTOS_BUCKET)
      .createSignedUrls(storagePaths, 3600)

    if (!signedError && signedUrls) {
      for (const item of signedUrls) {
        if (item.signedUrl) signedUrlByPath.set(item.path ?? "", item.signedUrl)
      }
    }
  }

  for (const row of data) {
    const signedUrl = signedUrlByPath.get(row.file_url)
    if (!signedUrl) continue

    const current = result.get(row.entity_id) ?? []
    current.push({
      id: row.id,
      fileName: row.file_name,
      signedUrl,
    })
    result.set(row.entity_id, current)
  }

  return result
}

export async function getTrabajoDiarioData(
  projectId: string,
): Promise<TrabajoDiarioData | null> {
  const id = projectId.trim()
  if (!id) return null

  const user = await getAuthenticatedUserOrNull()
  if (!user) return null

  const permission = await checkProjectPermission(id, "loadProgress")
  if (!permission.ok) return null

  const supabase = await createClient()

  const [floorsResult, unitsResult, assignmentsByUnit, rubroGroupsResult, entries] =
    await Promise.all([
    supabase
      .from("project_floors")
      .select("id, name, identifier, level, sort_order")
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("project_units")
      .select("id, floor_id, code, name, sort_order")
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),
    loadUnitTaskAssignmentsByUnit(supabase, id),
    supabase
      .from("rubro_groups")
      .select(
        `
        id, name, sort_order,
        rubros (
          id, name, sort_order,
          rubro_tasks (id, name, sort_order, weight_percent)
        )
      `,
      )
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),
    loadLatestProgressEntries(supabase, id),
  ])

  if (floorsResult.error || unitsResult.error || rubroGroupsResult.error) {
    return null
  }

  return armarTrabajoDiario({
    floors: floorsResult.data ?? [],
    units: unitsResult.data ?? [],
    rubroGroups: (rubroGroupsResult.data ?? []) as FilaDeGrupo[],
    assignmentsByUnit,
    entries,
  })
}

export async function saveCargarAvance(
  input: SaveCargarAvanceInput,
): Promise<SaveCargarAvanceResult> {
  const projectId = input.projectId.trim()
  if (!projectId) return { ok: false, error: "Proyecto inválido." }
  if (!input.floorId) return { ok: false, error: "Seleccioná un nivel." }
  if (!input.rubroId) return { ok: false, error: "Seleccioná un rubro." }
  if (input.unitIds.length === 0) {
    return { ok: false, error: "Seleccioná al menos una unidad." }
  }

  const tasksToSave = input.tasks.filter((task) => task.taskStatus !== "pending")

  if (tasksToSave.length === 0) {
    return { ok: false, error: "Seleccioná un estado en al menos una tarea." }
  }

  const permission = await checkProjectPermission(projectId, "loadProgress")
  if (!permission.ok) return permission

  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

  const assignments = await getUnitTaskAssignments(projectId)

  const { data: rubro, error: rubroError } = await supabase
    .from("rubros")
    .select("id")
    .eq("id", input.rubroId)
    .eq("project_id", projectId)
    .maybeSingle()

  if (rubroError) return { ok: false, error: rubroError.message }
  if (!rubro) return { ok: false, error: "Rubro no encontrado." }

  const { data: taskRows, error: tasksError } = await supabase
    .from("rubro_tasks")
    .select("id, rubro_id")
    .eq("project_id", projectId)
    .in(
      "id",
      tasksToSave.map((task) => task.taskId),
    )

  if (tasksError) return { ok: false, error: tasksError.message }

  const validTaskIds = new Set(
    (taskRows ?? [])
      .filter((task) => task.rubro_id === input.rubroId)
      .map((task) => task.id),
  )

  for (const task of tasksToSave) {
    if (!validTaskIds.has(task.taskId)) {
      return { ok: false, error: "Hay tareas inválidas para el rubro seleccionado." }
    }
    if (task.unitIds.length === 0) {
      return { ok: false, error: "Seleccioná al menos una unidad por tarea." }
    }
  }

  const allTargetUnitIds = [...new Set(tasksToSave.flatMap((task) => task.unitIds))]

  const { data: units, error: unitsError } = await supabase
    .from("project_units")
    .select("id, floor_id")
    .eq("project_id", projectId)
    .in("id", allTargetUnitIds)

  if (unitsError) return { ok: false, error: unitsError.message }
  if (!units || units.length !== allTargetUnitIds.length) {
    return { ok: false, error: "Una o más unidades no son válidas." }
  }

  for (const unit of units) {
    if (unit.floor_id !== input.floorId) {
      return { ok: false, error: "Las unidades deben pertenecer al nivel seleccionado." }
    }
  }

  for (const task of tasksToSave) {
    for (const unitId of task.unitIds) {
      if (!isTaskAssignedToUnit(assignments.byUnit, unitId, task.taskId)) {
        return { ok: false, error: "Hay tareas no asignadas a alguna unidad seleccionada." }
      }
    }
  }

  const { data: existingEntries, error: existingEntriesError } = await supabase
    .from("progress_entries")
    .select("unit_id, task_id, status, progress_state, created_at")
    .eq("project_id", projectId)
    .in("unit_id", allTargetUnitIds)
    .in(
      "task_id",
      tasksToSave.map((task) => task.taskId),
    )
    .order("created_at", { ascending: false })

  if (existingEntriesError) {
    return { ok: false, error: existingEntriesError.message }
  }

  const closedKeys = new Set<string>()
  const seenUnitTaskKeys = new Set<string>()

  for (const entry of existingEntries ?? []) {
    if (!entry.unit_id || !entry.task_id) continue

    const unitTaskKey = getUnitTaskKey(entry.unit_id, entry.task_id)
    if (seenUnitTaskKeys.has(unitTaskKey)) continue
    seenUnitTaskKeys.add(unitTaskKey)

    if (isUnitTaskCompletedForLoading(entry.status, entry.progress_state)) {
      closedKeys.add(unitTaskKey)
    }
  }

  const now = new Date().toISOString()
  const rows = tasksToSave.flatMap((task) =>
    task.unitIds.flatMap((unitId) => {
      if (closedKeys.has(getUnitTaskKey(unitId, task.taskId))) return []

      const mapped = mapTaskStatusToDb(task.taskStatus)
      return [
        {
          project_id: projectId,
          floor_id: input.floorId,
          unit_id: unitId,
          category_id: input.rubroId,
          task_id: task.taskId,
          created_by: user.id,
          status: mapped.status,
          progress_state: mapped.progress_state,
          comment: task.comment?.trim() || null,
          submitted_at: mapped.status === "draft" ? null : now,
        },
      ]
    }),
  )

  if (rows.length === 0) {
    return {
      ok: false,
      error:
        "Las tareas seleccionadas ya están completadas para estas unidades.",
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("progress_entries")
    .insert(rows)
    .select("id, unit_id, task_id")

  if (insertError) return { ok: false, error: insertError.message }

  revalidateProjectPath(projectId, "trabajo-diario")
  return {
    ok: true,
    entries: (inserted ?? []).map((row) => ({
      entryId: row.id,
      unitId: row.unit_id,
      taskId: row.task_id,
    })),
  }
}

export async function registerProgressAttachments(
  projectId: string,
  attachments: RegisterProgressAttachmentInput[],
): Promise<RegisterProgressAttachmentsResult> {
  const id = projectId.trim()
  if (!id) return { ok: false, error: "Proyecto inválido." }
  if (attachments.length === 0) return { ok: true }

  const permission = await checkProjectPermission(id, "loadProgress")
  if (!permission.ok) return permission

  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

  const entryIds = [...new Set(attachments.map((item) => item.entryId))]

  const { data: entries, error: entriesError } = await supabase
    .from("progress_entries")
    .select("id")
    .eq("project_id", id)
    .in("id", entryIds)

  if (entriesError) return { ok: false, error: entriesError.message }
  if (!entries || entries.length !== entryIds.length) {
    return { ok: false, error: "Uno o más avances no son válidos." }
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("company_id")
    .eq("id", id)
    .maybeSingle()

  if (projectError) return { ok: false, error: projectError.message }
  if (!project) return { ok: false, error: "Proyecto no encontrado." }

  const rows = attachments.map((attachment) => ({
    company_id: project.company_id,
    project_id: id,
    uploaded_by: user.id,
    entity_type: "progress_entry" as const,
    entity_id: attachment.entryId,
    file_url: attachment.storagePath,
    file_name: attachment.fileName,
    file_type: attachment.fileType,
    file_size: attachment.fileSize,
  }))

  const { error: insertError } = await supabase.from("attachments").insert(rows)
  if (insertError) return { ok: false, error: insertError.message }

  revalidateProjectPath(id, "trabajo-diario")
  return { ok: true }
}

export async function getTrabajoDiarioTaskDetail(
  projectId: string,
  entryId: string,
): Promise<TrabajoDiarioTaskDetail | null> {
  const id = projectId.trim()
  const progressEntryId = entryId.trim()
  if (!id || !progressEntryId) return null

  const user = await getAuthenticatedUserOrNull()
  if (!user) return null

  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: entry, error: entryError } = await supabase
    .from("progress_entries")
    .select(`
      id,
      unit_id,
      floor_id,
      task_id,
      category_id,
      status,
      progress_state,
      comment,
      created_at,
      submitted_at,
      created_by,
      rubros:category_id (name),
      rubro_tasks:task_id (name),
      project_floors:floor_id (name, identifier),
      project_units:unit_id (id)
    `)
    .eq("project_id", id)
    .eq("id", progressEntryId)
    .maybeSingle()

  if (entryError || !entry || !entry.unit_id || !entry.task_id) return null

  const accessContext = await getProjectAccessContext(id)
  if (
    !accessContext ||
    !(
      hasStrictProjectPermission(accessContext.permissions, "loadProgress") ||
      hasStrictProjectPermission(accessContext.permissions, "editTasks") ||
      hasStrictProjectPermission(accessContext.permissions, "certifyTasks") ||
      canAccessUnitProgress(accessContext, entry.unit_id)
    )
  ) {
    return null
  }

  const canViewHistory = hasStrictProjectPermission(accessContext.permissions, "viewAuditLog")

  let unidadesDelPiso: { id: string; code: string | null }[] | null = null
  if (entry.floor_id) {
    const { data: floorUnits } = await supabase
      .from("project_units")
      .select("id, code")
      .eq("project_id", id)
      .eq("floor_id", entry.floor_id)
      .order("sort_order", { ascending: true })
    unidadesDelPiso = floorUnits ?? []
  }

  const { data: historyRows, error: historyError } = canViewHistory
    ? await supabase
        .from("progress_entries")
        .select("id, status, progress_state, comment, created_at, submitted_at, created_by")
        .eq("project_id", id)
        .eq("unit_id", entry.unit_id)
        .eq("task_id", entry.task_id)
        .order("created_at", { ascending: false })
    : { data: [], error: null }

  if (historyError || !historyRows) return null

  const historyEntryIds = historyRows.map((row) => row.id)
  const attachmentsByEntry = await getAttachmentsByEntry(supabase, id, [
    ...historyEntryIds,
    entry.id,
  ])

  const { data: validationRows } = await supabase
    .from("progress_validations")
    .select("id, progress_entry_id, validated_by, validated_at, comment, decision")
    .in("progress_entry_id", historyEntryIds)
    .eq("decision", "approved")
    .order("validated_at", { ascending: false })

  const authorIds = [...new Set(historyRows.map((row) => row.created_by))]
  const validatorIds = [...new Set((validationRows ?? []).map((row) => row.validated_by))]
  const nameById = await loadProjectMemberDisplayNames(admin, id, [
    ...authorIds,
    ...validatorIds,
  ])

  const uno = <T,>(valor: T | T[] | null): T | null => (Array.isArray(valor) ? (valor[0] ?? null) : valor)
  const rubro = uno(entry.rubros as { name: string } | { name: string }[] | null)
  const task = uno(entry.rubro_tasks as { name: string } | { name: string }[] | null)
  const floor = uno(
    entry.project_floors as
      | { name: string; identifier?: string | null }
      | Array<{ name: string; identifier?: string | null }>
      | null,
  )

  return armarDetalleDeTrabajo({
    avance: {
      id: entry.id,
      unit_id: entry.unit_id,
      status: entry.status,
      progress_state: entry.progress_state,
      comment: entry.comment,
      created_at: entry.created_at,
      submitted_at: entry.submitted_at,
      rubro: rubro?.name ?? null,
      tarea: task?.name ?? null,
      piso: floor ? { name: floor.name, identifier: floor.identifier ?? null } : null,
    },
    unidadesDelPiso,
    historial: historyRows,
    validaciones: validationRows ?? [],
    adjuntos: Object.fromEntries(attachmentsByEntry),
    nombres: Object.fromEntries(nameById),
    veHistorial: canViewHistory,
  })
}

export async function updateTrabajoDiarioTask(
  input: UpdateTrabajoDiarioTaskInput,
): Promise<UpdateTrabajoDiarioTaskResult> {
  const projectId = input.projectId.trim()
  const entryId = input.entryId.trim()
  if (!projectId || !entryId) return { ok: false, error: "Datos inválidos." }
  if (input.taskStatus === "pending") {
    return { ok: false, error: "Seleccioná un estado válido." }
  }

  const permission = await checkProjectPermission(projectId, "editTasks")
  if (!permission.ok) return permission

  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

  const { data: entry, error: entryError } = await supabase
    .from("progress_entries")
    .select("id, floor_id, unit_id, category_id, task_id")
    .eq("project_id", projectId)
    .eq("id", entryId)
    .maybeSingle()

  if (entryError) return { ok: false, error: entryError.message }
  if (!entry || !entry.unit_id || !entry.task_id || !entry.floor_id) {
    return { ok: false, error: "Avance no encontrado." }
  }

  if (!canAccessUnitProgress(permission.context, entry.unit_id)) {
    return { ok: false, error: "No tenés permiso para editar tareas de esta unidad." }
  }

  const certifiedLock = await assertCanChangeCertifiedUnitTasks(
    supabase,
    projectId,
    [entry.unit_id],
    [entry.task_id],
    permission.context.permissions,
  )
  if (!certifiedLock.ok) return certifiedLock

  const assignments = await getUnitTaskAssignments(projectId)
  if (!isTaskAssignedToUnit(assignments.byUnit, entry.unit_id, entry.task_id)) {
    return { ok: false, error: "La tarea no está asignada a esta unidad." }
  }

  const mapped = mapTaskStatusToDb(input.taskStatus)
  const now = new Date().toISOString()

  const { data: inserted, error: insertError } = await supabase
    .from("progress_entries")
    .insert({
      project_id: projectId,
      floor_id: entry.floor_id,
      unit_id: entry.unit_id,
      category_id: entry.category_id,
      task_id: entry.task_id,
      created_by: user.id,
      status: mapped.status,
      progress_state: mapped.progress_state,
      comment: input.comment?.trim() || null,
      submitted_at: mapped.status === "draft" ? null : now,
    })
    .select("id")
    .single()

  if (insertError) return { ok: false, error: insertError.message }

  revalidateProjectPath(projectId, "trabajo-diario")
  return { ok: true, entryId: inserted.id }
}
