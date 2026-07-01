"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { getAuthenticatedUserOrNull, requireAuthenticatedUser } from "@/lib/authHelpers"

export type ProjectBasics = {
  id: string
  name: string
  location: string
  startDate: string
  endDate: string
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
    .select("id, name, location, start_date, end_date")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) return null

  return {
    id: data.id,
    name: data.name ?? "",
    location: data.location ?? "",
    startDate: data.start_date ?? "",
    endDate: data.end_date ?? "",
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
    .select("id, floor_id, code, name, unit_type, room_count, area_m2, sort_order")
    .eq("project_id", id)
    .order("sort_order", { ascending: true })

  if (error || !units) return []
  return units.map((u) => ({
    id: u.id,
    floor_id: u.floor_id,
    code: u.code,
    name: u.name,
    unit_type: u.unit_type,
    rooms: u.room_count,
    area_m2: u.area_m2,
    sort_order: u.sort_order,
  }))
}

export async function getProjectRubros(projectId: string): Promise<RubroData[]> {
  const id = projectId.trim()
  if (!id) return []

  const supabase = await createClient()
  const { data: rubros, error } = await supabase
    .from("rubros")
    .select(
      `
      id, name, description, tracking_scope, sort_order,
      rubro_tasks (id, name, description, sort_order, default_weight)
    `
    )
    .eq("project_id", id)
    .order("sort_order", { ascending: true })

  if (error || !rubros) return []

  return rubros.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    tracking_scope: r.tracking_scope,
    sort_order: r.sort_order,
    tasks: (r.rubro_tasks as TaskData[]) || [],
  }))
}

export async function saveProjectStructure(
  projectId: string,
  floors: Array<{
    name: string
    level: string | null
    units: Array<{ code: string; name: string | null; unit_type: string | null; room_count: number | null; area_m2: number | null }>
  }>,
): Promise<UpdateProjectBasicsResult> {
  const id = projectId.trim()
  if (!id) return { ok: false, error: "Proyecto inválido." }

  await requireAuthenticatedUser()
  const supabase = await createClient()

  try {
    // Eliminar pisos y unidades existentes (se cascadean)
    await supabase.from("project_floors").delete().eq("project_id", id)

    // Guardar nuevos pisos
    for (let i = 0; i < floors.length; i++) {
      const floor = floors[i]
      const { data: insertedFloor, error: floorError } = await supabase
        .from("project_floors")
        .insert({ project_id: id, name: floor.name, level: floor.level, sort_order: i })
        .select("id")
        .single()

      if (floorError || !insertedFloor) throw floorError || new Error("Error al guardar piso")

      // Guardar unidades del piso
      if (floor.units.length > 0) {
        const unitRows = floor.units.map((u, idx) => ({
          project_id: id,
          floor_id: insertedFloor.id,
          code: u.code,
          name: u.name,
          unit_type: u.unit_type,
          room_count: u.room_count,
          area_m2: u.area_m2,
          sort_order: idx,
        }))

        const { error: unitError } = await supabase.from("project_units").insert(unitRows)
        if (unitError) throw unitError
      }
    }

    revalidatePath(`/${id}/configuracion`)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al guardar estructura"
    return { ok: false, error: message }
  }
}

export async function saveProjectRubros(
  projectId: string,
  rubros: Array<{
    name: string
    description: string | null
    tracking_scope: string
    tasks: Array<{ name: string; description: string | null; default_weight: number | null }>
  }>,
): Promise<UpdateProjectBasicsResult> {
  const id = projectId.trim()
  if (!id) return { ok: false, error: "Proyecto inválido." }

  await requireAuthenticatedUser()
  const supabase = await createClient()

  try {
    // Obtener el primer rubro_group del proyecto (requerido por FK)
    const { data: groups } = await supabase
      .from("rubro_groups")
      .select("id")
      .eq("project_id", id)
      .order("sort_order", { ascending: true })
      .limit(1)

    if (!groups || groups.length === 0) {
      return { ok: false, error: "El proyecto no tiene grupos de rubros configurados." }
    }
    const defaultGroupId = groups[0].id

    // Obtener el tracking type "porcentaje" (requerido por FK)
    const { data: trackingTypes } = await supabase
      .from("task_tracking_types")
      .select("id")
      .eq("slug", "porcentaje")
      .limit(1)

    if (!trackingTypes || trackingTypes.length === 0) {
      return { ok: false, error: "No se encontró el tipo de seguimiento predeterminado." }
    }
    const defaultTrackingTypeId = trackingTypes[0].id

    // Eliminar rubros existentes (se cascadean tareas)
    await supabase.from("rubros").delete().eq("project_id", id)

    // Guardar nuevos rubros
    for (let i = 0; i < rubros.length; i++) {
      const rubro = rubros[i]
      const { data: insertedRubro, error: rubroError } = await supabase
        .from("rubros")
        .insert({
          project_id: id,
          name: rubro.name,
          description: rubro.description,
          tracking_scope: rubro.tracking_scope,
          sort_order: i,
          group_id: defaultGroupId,
          tracking_type_id: defaultTrackingTypeId,
        })
        .select("id")
        .single()

      if (rubroError || !insertedRubro) throw rubroError || new Error("Error al guardar rubro")

      // Guardar tareas del rubro
      if (rubro.tasks.length > 0) {
        const taskRows = rubro.tasks.map((t, idx) => ({
          project_id: id,
          rubro_id: insertedRubro.id,
          name: t.name,
          description: t.description,
          default_weight: t.default_weight,
          sort_order: idx,
        }))

        const { error: taskError } = await supabase.from("rubro_tasks").insert(taskRows)
        if (taskError) throw taskError
      }
    }

    revalidatePath(`/${id}/configuracion`)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al guardar rubros"
    return { ok: false, error: message }
  }
}
