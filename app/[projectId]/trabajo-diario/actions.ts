"use server"

import { revalidatePath } from "next/cache"
import { format } from "date-fns"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { getAuthenticatedUserOrNull, requireAuthenticatedUser } from "@/lib/authHelpers"
import { isTaskAssignedToUnit } from "@/lib/projects/unitTaskAssignments"
import {
  getUnitTaskKey,
  mapTaskStatusToDb,
  type CargarAvanceTaskStatus,
} from "@/lib/projects/cargarAvance"
import { getUnitLabelInFloor } from "@/lib/projects/floorLabels"
import { PROGRESS_PHOTOS_BUCKET } from "@/lib/progress/progressPhotoConfig"
import { getUnitTaskAssignments } from "../configuracion/actions"

export type SaveCargarAvanceInput = {
  projectId: string
  floorId: string
  rubroId: string
  unitIds: string[]
  tasks: Array<{
    taskId: string
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

export type TrabajoDiarioTaskStatus = "Completado" | "En Proceso" | "Bloqueado"

export type TrabajoDiarioTaskAttachment = {
  id: string
  fileName: string
  signedUrl: string
}

export type TrabajoDiarioTaskHistoryItem = {
  id: string
  status: TrabajoDiarioTaskStatus
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
  unitLabel: string
  occurredAt: string
  formattedLongDate: string
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
  code: string
  name: string | null
}

export type TrabajoDiarioFloor = {
  id: string
  name: string
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
}

function mapProgressStatus(
  status: string,
  progressState: string,
): TrabajoDiarioTaskStatus {
  if (status === "rejected") return "Bloqueado"
  if (progressState === "completed" || status === "approved") return "Completado"
  return "En Proceso"
}

function formatEntryDate(value: string | null): string {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
  }).format(new Date(value))
}

function formatEntryLongDate(value: string): string {
  const formatted = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value))
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function formatHistoryDate(value: string): string {
  return format(new Date(value), "dd/MM/yyyy HH:mm")
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

  const supabase = await createClient()

  const [floorsResult, unitsResult, assignments, rubroGroupsResult, entriesResult] =
    await Promise.all([
    supabase
      .from("project_floors")
      .select("id, name, level, sort_order")
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("project_units")
      .select("id, floor_id, code, name, sort_order")
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),
    getUnitTaskAssignments(id),
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
    supabase
      .from("progress_entries")
      .select(`
        id,
        unit_id,
        floor_id,
        task_id,
        status,
        progress_state,
        created_at,
        submitted_at,
        rubros:category_id (name),
        rubro_tasks:task_id (name)
      `)
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
  ])

  if (floorsResult.error || unitsResult.error || rubroGroupsResult.error || entriesResult.error) {
    return null
  }

  const floors = floorsResult.data ?? []
  const units = unitsResult.data ?? []
  const rubroGroupsRaw = rubroGroupsResult.data ?? []
  const entries = entriesResult.data ?? []

  const floorById = new Map(floors.map((floor) => [floor.id, floor.name]))
  const unitById = new Map(
    units.map((unit) => [
      unit.id,
      { code: unit.code, name: unit.name, floorId: unit.floor_id },
    ]),
  )

  const trabajoFloors: TrabajoDiarioFloor[] = floors.map((floor) => ({
    id: floor.id,
    name: floor.name,
    level: floor.level,
    units: units
      .filter((unit) => unit.floor_id === floor.id)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((unit) => ({
        id: unit.id,
        code: unit.code,
        name: unit.name,
      })),
  }))

  const floorUnitsById = new Map(trabajoFloors.map((floor) => [floor.id, floor.units]))

  const rubroGroups: TrabajoDiarioRubroGroup[] = rubroGroupsRaw.map((group) => ({
    id: group.id,
    name: group.name,
    rubros: ((group.rubros as Array<{
      id: string
      name: string
      sort_order: number
      rubro_tasks: Array<{
        id: string
        name: string
        sort_order: number
        weight_percent: number | null
      }> | null
    }>) ?? [])
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((rubro) => ({
        id: rubro.id,
        name: rubro.name,
        tasks: (rubro.rubro_tasks ?? [])
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((task) => ({
            id: task.id,
            name: task.name,
            sortOrder: task.sort_order ?? 0,
            weightPercent: task.weight_percent ?? null,
          })),
      })),
  }))

  const tasks: TrabajoDiarioTask[] = []
  const latestEntryKeys = new Set<string>()
  const loadedUnitTaskKeys = new Set<string>()

  for (const entry of entries) {
    if (!entry.unit_id || !entry.task_id) continue

    loadedUnitTaskKeys.add(`${entry.unit_id}:${entry.task_id}`)

    if (!isTaskAssignedToUnit(assignments.byUnit, entry.unit_id, entry.task_id)) continue

    const unitTaskKey = `${entry.unit_id}:${entry.task_id}`
    if (latestEntryKeys.has(unitTaskKey)) continue
    latestEntryKeys.add(unitTaskKey)

    const unit = unitById.get(entry.unit_id)
    if (!unit) continue

    const floorId = entry.floor_id ?? unit.floorId
    const floorName = floorId ? floorById.get(floorId) ?? "—" : "—"
    const rubro = entry.rubros as { name: string } | { name: string }[] | null
    const task = entry.rubro_tasks as { name: string } | { name: string }[] | null
    const rubroName = Array.isArray(rubro) ? rubro[0]?.name : rubro?.name
    const taskName = Array.isArray(task) ? task[0]?.name : task?.name

    const floorUnits = floorId ? floorUnitsById.get(floorId) ?? [] : []

    tasks.push({
      id: entry.id,
      name: taskName ?? "Tarea",
      category: rubroName ?? "Rubro",
      floorId,
      floorName,
      unitId: entry.unit_id,
      unitLabel: getUnitLabelInFloor(floorUnits, entry.unit_id),
      unitName: unit.name,
      occurredAt: entry.submitted_at ?? entry.created_at,
      date: formatEntryDate(entry.submitted_at ?? entry.created_at),
      status: mapProgressStatus(entry.status, entry.progress_state),
    })
  }

  return {
    floors: trabajoFloors,
    tasks,
    rubroGroups,
    assignmentsByUnit: assignments.byUnit,
    loadedUnitTaskKeys: [...loadedUnitTaskKeys],
  }
}

export async function saveCargarAvance(
  input: SaveCargarAvanceInput,
): Promise<SaveCargarAvanceResult> {
  const projectId = input.projectId.trim()
  if (!projectId) return { ok: false, error: "Proyecto inválido." }
  if (!input.floorId) return { ok: false, error: "Seleccioná un piso." }
  if (!input.rubroId) return { ok: false, error: "Seleccioná un rubro." }
  if (input.unitIds.length === 0) {
    return { ok: false, error: "Seleccioná al menos una unidad." }
  }

  const tasksToSave = input.tasks.filter(
    (task) =>
      task.taskStatus !== "pending" ||
      (task.comment?.trim().length ?? 0) > 0 ||
      (task.photoCount ?? 0) > 0,
  )

  if (tasksToSave.length === 0) {
    return { ok: false, error: "Completá al menos una tarea antes de guardar." }
  }

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
  }

  const { data: units, error: unitsError } = await supabase
    .from("project_units")
    .select("id, floor_id")
    .eq("project_id", projectId)
    .in("id", input.unitIds)

  if (unitsError) return { ok: false, error: unitsError.message }
  if (!units || units.length !== input.unitIds.length) {
    return { ok: false, error: "Una o más unidades no son válidas." }
  }

  for (const unit of units) {
    if (unit.floor_id !== input.floorId) {
      return { ok: false, error: "Las unidades deben pertenecer al piso seleccionado." }
    }

    for (const task of tasksToSave) {
      if (!isTaskAssignedToUnit(assignments.byUnit, unit.id, task.taskId)) {
        return { ok: false, error: "Hay tareas no asignadas a alguna unidad seleccionada." }
      }
    }
  }

  const { data: existingEntries, error: existingEntriesError } = await supabase
    .from("progress_entries")
    .select("unit_id, task_id")
    .eq("project_id", projectId)
    .in("unit_id", input.unitIds)
    .in(
      "task_id",
      tasksToSave.map((task) => task.taskId),
    )

  if (existingEntriesError) {
    return { ok: false, error: existingEntriesError.message }
  }

  const loadedKeys = new Set(
    (existingEntries ?? []).map((entry) => getUnitTaskKey(entry.unit_id, entry.task_id)),
  )

  const now = new Date().toISOString()
  const rows = input.unitIds.flatMap((unitId) =>
    tasksToSave.flatMap((task) => {
      if (loadedKeys.has(getUnitTaskKey(unitId, task.taskId))) return []

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
      error: "Las tareas seleccionadas ya tienen avance cargado para estas unidades.",
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("progress_entries")
    .insert(rows)
    .select("id, unit_id, task_id")

  if (insertError) return { ok: false, error: insertError.message }

  revalidatePath(`/${projectId}/trabajo-diario`)
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

  revalidatePath(`/${id}/trabajo-diario`)
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
      project_floors:floor_id (name),
      project_units:unit_id (id)
    `)
    .eq("project_id", id)
    .eq("id", progressEntryId)
    .maybeSingle()

  if (entryError || !entry || !entry.unit_id || !entry.task_id) return null

  const floorId = entry.floor_id
  let unitLabel = "—"

  if (floorId) {
    const { data: floorUnits } = await supabase
      .from("project_units")
      .select("id")
      .eq("project_id", id)
      .eq("floor_id", floorId)
      .order("sort_order", { ascending: true })

    unitLabel = getUnitLabelInFloor(floorUnits ?? [], entry.unit_id)
  }

  const { data: historyRows, error: historyError } = await supabase
    .from("progress_entries")
    .select(`
      id,
      status,
      progress_state,
      comment,
      created_at,
      submitted_at,
      created_by
    `)
    .eq("project_id", id)
    .eq("unit_id", entry.unit_id)
    .eq("task_id", entry.task_id)
    .order("created_at", { ascending: false })

  if (historyError || !historyRows) return null

  const historyEntryIds = historyRows.map((row) => row.id)
  const attachmentsByEntry = await getAttachmentsByEntry(supabase, id, [
    ...historyEntryIds,
    entry.id,
  ])

  const authorIds = [...new Set(historyRows.map((row) => row.created_by))]
  const { data: profiles } =
    authorIds.length > 0
      ? await admin
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", authorIds)
      : { data: [] as Array<{
          id: string
          first_name: string | null
          last_name: string | null
          email: string
        }> }

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

  const rubro = entry.rubros as { name: string } | { name: string }[] | null
  const task = entry.rubro_tasks as { name: string } | { name: string }[] | null
  const floor = entry.project_floors as { name: string } | { name: string }[] | null

  const rubroName = Array.isArray(rubro) ? rubro[0]?.name : rubro?.name
  const taskName = Array.isArray(task) ? task[0]?.name : task?.name
  const floorName = Array.isArray(floor) ? floor[0]?.name : floor?.name

  const occurredAt = entry.submitted_at ?? entry.created_at

  const history: TrabajoDiarioTaskHistoryItem[] = historyRows.map((row) => {
    const rowOccurredAt = row.submitted_at ?? row.created_at
    const profile = profileById.get(row.created_by)
    return {
      id: row.id,
      status: mapProgressStatus(row.status, row.progress_state),
      comment: row.comment,
      occurredAt: rowOccurredAt,
      formattedDate: formatHistoryDate(rowOccurredAt),
      authorName: profile ? formatProfileName(profile) : "Usuario",
      attachments: attachmentsByEntry.get(row.id) ?? [],
    }
  })

  return {
    entryId: entry.id,
    taskName: taskName ?? "Tarea",
    rubroName: rubroName ?? "Rubro",
    floorName: floorName ?? "—",
    unitLabel,
    occurredAt,
    formattedLongDate: formatEntryLongDate(occurredAt),
    status: mapProgressStatus(entry.status, entry.progress_state),
    comment: entry.comment,
    attachments: attachmentsByEntry.get(entry.id) ?? [],
    history,
  }
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

  revalidatePath(`/${projectId}/trabajo-diario`)
  return { ok: true, entryId: inserted.id }
}
