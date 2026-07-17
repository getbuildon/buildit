"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { getAuthenticatedUserOrNull, requireAuthenticatedUser } from "@/lib/authHelpers"
import {
  calculateUnitProgressPercent,
  countAssignedBlockedTasks,
  countAssignedCompletedTasks,
  getAssignedTaskIdsForUnit,
} from "@/lib/projects/dashboardProgress"
import {
  syncProjectRubros,
  type RubroGroupSaveInput,
} from "@/lib/projects/syncProjectRubros"
import {
  syncProjectStructure,
  type StructureFloorSaveInput,
} from "@/lib/projects/syncProjectStructure"

export type ProjectBasics = {
  id: string
  name: string
  location: string
  startDate: string
  endDate: string
  companyId: string | null
  companyName: string | null
}

export type UpdateProjectBasicsInput = {
  projectId: string
  name: string
  location: string
  startDate: string
  endDate: string
}

export type UpdateProjectBasicsResult = { ok: true } | { ok: false; error: string }

export type FloorData = {
  id: string
  name: string
  level: string | null
  sort_order: number
}

export type UnitData = {
  id: string
  floor_id: string
  code: string
  name: string | null
  unit_type: string | null
  rooms: number | null
  area_m2: number | null
  sort_order: number
}

export type RubroData = {
  id: string
  name: string
  description: string | null
  tracking_scope: string
  sort_order: number
  tasks: TaskData[]
}

export type TaskData = {
  id: string
  name: string
  description: string | null
  sort_order: number
  default_weight: number | null
}

export type RubroGroupData = {
  id: string
  name: string
  sort_order: number
  rubros: RubroData[]
}

export type DashboardUnit = {
  id: string
  code: string
  name: string | null
  unit_type: string | null
  progress: number
}

export type DashboardFloor = {
  id: string
  name: string
  progress: number
  units: DashboardUnit[]
}

export type DashboardStats = {
  totalFloors: number
  totalUnits: number
  generalProgress: number
  completedUnits: number
  completedTasksThisWeek: number | null
  blockedTasks: number | null
}

export async function getDashboardData(
  projectId: string,
): Promise<{ floors: DashboardFloor[]; stats: DashboardStats } | null> {
  const id = projectId.trim()
  if (!id) return null

  const user = await getAuthenticatedUserOrNull()
  if (!user) return null

  const supabase = await createClient()

  const [floorsResult, unitsResult, assignments, tasksResult, entriesResult] =
    await Promise.all([
      supabase
        .from("project_floors")
        .select("id, name, sort_order")
        .eq("project_id", id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("project_units")
        .select("id, floor_id, code, name, unit_type, sort_order")
        .eq("project_id", id)
        .order("sort_order", { ascending: true }),
      getUnitTaskAssignments(id),
      supabase.from("rubro_tasks").select("id, weight_percent").eq("project_id", id),
      supabase
        .from("progress_entries")
        .select("unit_id, task_id, progress_state, status, submitted_at, created_at")
        .eq("project_id", id),
    ])

  if (floorsResult.error || unitsResult.error || tasksResult.error || entriesResult.error) {
    return null
  }

  const floors = floorsResult.data ?? []
  const units = unitsResult.data ?? []
  const allTaskIds = (tasksResult.data ?? []).map((task) => task.id)
  const taskWeights = new Map<string, number | null>(
    (tasksResult.data ?? []).map((task) => [task.id, task.weight_percent]),
  )
  const entries = entriesResult.data ?? []
  const unitIds = units.map((unit) => unit.id)

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const completedTasksThisWeek = countAssignedCompletedTasks(
    assignments.byUnit,
    allTaskIds,
    unitIds,
    entries.filter((entry) => {
      const dateValue = entry.submitted_at ?? entry.created_at
      if (!dateValue) return false
      return new Date(dateValue) >= weekAgo
    }),
  )

  const blockedTasks = countAssignedBlockedTasks(
    assignments.byUnit,
    allTaskIds,
    unitIds,
    entries,
  )

  const dashboardFloors: DashboardFloor[] = floors.map((floor) => {
    const floorUnits: DashboardUnit[] = units
      .filter((unit) => unit.floor_id === floor.id)
      .map((unit) => {
        const assignedTaskIds = getAssignedTaskIdsForUnit(
          assignments.byUnit,
          unit.id,
          allTaskIds,
        )
        const progress = calculateUnitProgressPercent(
          unit.id,
          assignedTaskIds,
          entries,
          taskWeights,
        )

        return {
          id: unit.id,
          code: unit.code,
          name: unit.name,
          unit_type: unit.unit_type,
          progress,
        }
      })

    const floorProgress =
      floorUnits.length > 0
        ? Math.round(floorUnits.reduce((sum, unit) => sum + unit.progress, 0) / floorUnits.length)
        : 0

    return { id: floor.id, name: floor.name, progress: floorProgress, units: floorUnits }
  })

  const allUnits = dashboardFloors.flatMap((floor) => floor.units)
  const generalProgress =
    allUnits.length > 0
      ? Math.round(allUnits.reduce((sum, unit) => sum + unit.progress, 0) / allUnits.length)
      : 0
  const completedUnits = allUnits.filter((unit) => unit.progress === 100).length

  return {
    floors: dashboardFloors,
    stats: {
      totalFloors: dashboardFloors.length,
      totalUnits: allUnits.length,
      generalProgress,
      completedUnits,
      completedTasksThisWeek,
      blockedTasks,
    },
  }
}

export type UnitTaskAssignments = {
  byUnit: Record<string, string[]>
}

export async function getUnitTaskAssignments(
  projectId: string,
): Promise<UnitTaskAssignments> {
  const id = projectId.trim()
  if (!id) return { byUnit: {} }

  const user = await getAuthenticatedUserOrNull()
  if (!user) return { byUnit: {} }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("unit_task_assignments")
    .select("unit_id, rubro_task_id")
    .eq("project_id", id)

  if (error || !data) return { byUnit: {} }

  const byUnit: Record<string, string[]> = {}
  for (const row of data) {
    if (!byUnit[row.unit_id]) byUnit[row.unit_id] = []
    byUnit[row.unit_id].push(row.rubro_task_id)
  }

  return { byUnit }
}

export async function setUnitTaskAssignments(
  projectId: string,
  assignments: Record<string, string[]>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = projectId.trim()
  if (!id) return { ok: false, error: "Proyecto inválido." }

  await requireAuthenticatedUser()
  const supabase = await createClient()

  try {
    // Solo unit_task_assignments: no toca progress_entries (avances históricos).
    await supabase
      .from("unit_task_assignments")
      .delete()
      .eq("project_id", id)

    const rows = Object.entries(assignments).flatMap(([unitId, taskIds]) =>
      taskIds.map((taskId) => ({
        project_id: id,
        unit_id: unitId,
        rubro_task_id: taskId,
      })),
    )

    if (rows.length > 0) {
      const { error } = await supabase.from("unit_task_assignments").insert(rows)
      if (error) throw error
    }

    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al guardar asignaciones."
    return { ok: false, error: message }
  }
}

function normalizeOptional(value: string): string | null {
  return value.trim() || null
}

export async function getProjectBasics(projectId: string): Promise<ProjectBasics | null> {
  const id = projectId.trim()
  if (!id) return null

  const user = await getAuthenticatedUserOrNull()
  if (!user) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, location, start_date, end_date, company_id, companies(name)")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) return null

  const companyRaw = data.companies as { name: string } | { name: string }[] | null
  const companyName = companyRaw
    ? Array.isArray(companyRaw)
      ? (companyRaw[0]?.name ?? null)
      : companyRaw.name
    : null

  return {
    id: data.id,
    name: data.name ?? "",
    location: data.location ?? "",
    startDate: data.start_date ?? "",
    endDate: data.end_date ?? "",
    companyId: data.company_id ?? null,
    companyName,
  }
}

export async function updateProjectBasics(
  input: UpdateProjectBasicsInput,
): Promise<UpdateProjectBasicsResult> {
  const id = input.projectId.trim()
  if (!id) {
    return { ok: false, error: "Proyecto inválido." }
  }

  const name = input.name.trim()
  if (!name) {
    return { ok: false, error: "El nombre del proyecto es obligatorio." }
  }

  await requireAuthenticatedUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from("projects")
    .update({
      name,
      location: normalizeOptional(input.location),
      start_date: normalizeOptional(input.startDate),
      end_date: normalizeOptional(input.endDate),
    })
    .eq("id", id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath(`/${id}/configuracion`)
  return { ok: true }
}

export async function getProjectStructure(projectId: string): Promise<FloorData[]> {
  const id = projectId.trim()
  if (!id) return []

  const supabase = await createClient()
  const { data: floors, error } = await supabase
    .from("project_floors")
    .select("id, name, level, sort_order")
    .eq("project_id", id)
    .order("sort_order", { ascending: true })

  if (error || !floors) return []
  return floors as FloorData[]
}

export async function getProjectUnits(projectId: string): Promise<UnitData[]> {
  const id = projectId.trim()
  if (!id) return []

  const supabase = await createClient()
  const { data: units, error } = await supabase
    .from("project_units")
    .select("id, floor_id, code, name, unit_type, room_count, square_meters, sort_order")
    .eq("project_id", id)
    .order("sort_order", { ascending: true })

  if (error || !units) return []
  return units.map((u: any) => ({
    id: u.id,
    floor_id: u.floor_id,
    code: u.code,
    name: u.name,
    unit_type: u.unit_type,
    rooms: u.room_count,
    area_m2: u.square_meters,
    sort_order: u.sort_order,
  }))
}

export async function getProjectRubroGroups(projectId: string): Promise<RubroGroupData[]> {
  const id = projectId.trim()
  if (!id) return []

  const supabase = await createClient()
  const { data: groups, error } = await supabase
    .from("rubro_groups")
    .select(
      `
      id, name, sort_order,
      rubros (
        id, name, tracking_scope, sort_order,
        rubro_tasks (id, name, description, sort_order, weight_percent)
      )
    `
    )
    .eq("project_id", id)
    .order("sort_order", { ascending: true })

  if (error || !groups) return []

  return groups.map((g: any) => ({
    id: g.id,
    name: g.name,
    sort_order: g.sort_order,
    rubros: ((g.rubros as any[]) || [])
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        description: null,
        tracking_scope: r.tracking_scope,
        sort_order: r.sort_order,
        tasks: ((r.rubro_tasks as any[]) || [])
          .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description ?? null,
            sort_order: t.sort_order,
            default_weight: t.weight_percent ?? null,
          })),
      })),
  }))
}

export async function saveProjectStructure(
  projectId: string,
  floors: StructureFloorSaveInput[],
): Promise<UpdateProjectBasicsResult> {
  const id = projectId.trim()
  if (!id) return { ok: false, error: "Proyecto inválido." }

  await requireAuthenticatedUser()
  const supabase = await createClient()

  const result = await syncProjectStructure(supabase, id, floors)
  if (!result.ok) return result

  revalidatePath(`/${id}/configuracion`)
  return { ok: true }
}

export async function saveProjectRubros(
  projectId: string,
  groups: RubroGroupSaveInput[],
): Promise<UpdateProjectBasicsResult> {
  const id = projectId.trim()
  if (!id) return { ok: false, error: "Proyecto inválido." }

  await requireAuthenticatedUser()
  const supabase = await createClient()

  const result = await syncProjectRubros(supabase, id, groups)
  if (!result.ok) return result

  revalidatePath(`/${id}/configuracion`)
  return { ok: true }
}
