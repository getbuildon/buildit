"use server"

import { createClient } from "@/utils/supabase/server"
import { getAuthenticatedUserOrNull } from "@/lib/authHelpers"
import { isTaskAssignedToUnit } from "@/lib/projects/unitTaskAssignments"
import { getUnitTaskAssignments } from "../configuracion/actions"

export type TrabajoDiarioTaskStatus = "Completado" | "En Proceso" | "Bloqueado"

export type TrabajoDiarioTask = {
  id: string
  name: string
  category: string
  floorId: string
  floorName: string
  unitId: string
  unitCode: string
  unitName: string | null
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
  units: TrabajoDiarioUnit[]
}

export type TrabajoDiarioData = {
  floors: TrabajoDiarioFloor[]
  tasks: TrabajoDiarioTask[]
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

export async function getTrabajoDiarioData(
  projectId: string,
): Promise<TrabajoDiarioData | null> {
  const id = projectId.trim()
  if (!id) return null

  const user = await getAuthenticatedUserOrNull()
  if (!user) return null

  const supabase = await createClient()

  const [floorsResult, unitsResult, assignments, entriesResult] = await Promise.all([
    supabase
      .from("project_floors")
      .select("id, name, sort_order")
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("project_units")
      .select("id, floor_id, code, name, sort_order")
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),
    getUnitTaskAssignments(id),
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

  if (floorsResult.error || unitsResult.error || entriesResult.error) return null

  const floors = floorsResult.data ?? []
  const units = unitsResult.data ?? []
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
    units: units
      .filter((unit) => unit.floor_id === floor.id)
      .map((unit) => ({
        id: unit.id,
        code: unit.code,
        name: unit.name,
      })),
  }))

  const tasks: TrabajoDiarioTask[] = []

  for (const entry of entries) {
    if (!entry.unit_id || !entry.task_id) continue
    if (!isTaskAssignedToUnit(assignments.byUnit, entry.unit_id, entry.task_id)) continue

    const unit = unitById.get(entry.unit_id)
    if (!unit) continue

    const floorId = entry.floor_id ?? unit.floorId
    const floorName = floorId ? floorById.get(floorId) ?? "—" : "—"
    const rubro = entry.rubros as { name: string } | { name: string }[] | null
    const task = entry.rubro_tasks as { name: string } | { name: string }[] | null
    const rubroName = Array.isArray(rubro) ? rubro[0]?.name : rubro?.name
    const taskName = Array.isArray(task) ? task[0]?.name : task?.name

    tasks.push({
      id: entry.id,
      name: taskName ?? "Tarea",
      category: rubroName ?? "Rubro",
      floorId,
      floorName,
      unitId: entry.unit_id,
      unitCode: unit.code,
      unitName: unit.name,
      date: formatEntryDate(entry.submitted_at ?? entry.created_at),
      status: mapProgressStatus(entry.status, entry.progress_state),
    })
  }

  return { floors: trabajoFloors, tasks }
}
