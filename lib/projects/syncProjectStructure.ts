import type { SupabaseClient } from "@supabase/supabase-js"
import { normalizeUnitType } from "@/lib/projects/unitTypes"

export type StructureUnitSaveInput = {
  id?: string
  code: string
  name: string | null
  unit_type: string | null
  room_count: number | null
  area_m2: number | null
}

export type StructureFloorSaveInput = {
  id?: string
  name: string
  level: string | null
  units: StructureUnitSaveInput[]
}

type ExistingStructureState = {
  floorIds: Set<string>
  unitIds: Set<string>
  unitLabels: Map<string, string>
  floorNames: Map<string, string>
}

type IncomingStructureIds = {
  floorIds: Set<string>
  unitIds: Set<string>
}

function isPersistedId(id: string | undefined, knownIds: Set<string>): id is string {
  return !!id && knownIds.has(id)
}

function mapSupabaseError(err: unknown, fallback: string): string {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: string }).code)
      : null

  if (code === "23505") {
    return "Ya existe otra unidad con ese código en el proyecto."
  }

  if (err instanceof Error && err.message) return err.message
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message?: string }).message)
  }

  return fallback
}

async function loadExistingStructureState(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ExistingStructureState> {
  const [{ data: floors, error: floorsError }, { data: units, error: unitsError }] =
    await Promise.all([
      supabase.from("project_floors").select("id, name").eq("project_id", projectId),
      supabase
        .from("project_units")
        .select("id, code, name")
        .eq("project_id", projectId),
    ])

  if (floorsError) throw floorsError
  if (unitsError) throw unitsError

  const floorIds = new Set<string>()
  const floorNames = new Map<string, string>()
  for (const floor of floors ?? []) {
    floorIds.add(floor.id)
    floorNames.set(floor.id, floor.name)
  }

  const unitIds = new Set<string>()
  const unitLabels = new Map<string, string>()
  for (const unit of units ?? []) {
    unitIds.add(unit.id)
    unitLabels.set(unit.id, unit.code || unit.name || unit.id.slice(0, 8))
  }

  return { floorIds, unitIds, unitLabels, floorNames }
}

function collectIncomingStructureIds(
  floors: StructureFloorSaveInput[],
  existing: ExistingStructureState,
): { incoming: IncomingStructureIds; emptyFloorIdsToDelete: string[] } {
  const incoming: IncomingStructureIds = {
    floorIds: new Set<string>(),
    unitIds: new Set<string>(),
  }
  const emptyFloorIdsToDelete: string[] = []

  for (const floor of floors) {
    if (floor.units.length === 0) {
      if (isPersistedId(floor.id, existing.floorIds)) {
        emptyFloorIdsToDelete.push(floor.id)
      }
      continue
    }

    if (isPersistedId(floor.id, existing.floorIds)) {
      incoming.floorIds.add(floor.id)
    }

    for (const unit of floor.units) {
      if (isPersistedId(unit.id, existing.unitIds)) {
        incoming.unitIds.add(unit.id)
      }
    }
  }

  return { incoming, emptyFloorIdsToDelete }
}

async function assertRemovableUnits(
  supabase: SupabaseClient,
  projectId: string,
  unitIdsToRemove: string[],
  unitLabels: Map<string, string>,
): Promise<string | null> {
  if (unitIdsToRemove.length === 0) return null

  const { data: blocked, error } = await supabase
    .from("progress_entries")
    .select("unit_id")
    .eq("project_id", projectId)
    .in("unit_id", unitIdsToRemove)

  if (error) throw error
  if (!blocked || blocked.length === 0) return null

  const blockedLabels = [
    ...new Set(
      blocked
        .map((row) => (row.unit_id ? unitLabels.get(row.unit_id) : null))
        .filter((label): label is string => !!label),
    ),
  ]

  if (blockedLabels.length === 1) {
    return `No se puede eliminar la unidad "${blockedLabels[0]}" porque ya tiene avances registrados.`
  }

  return `No se pueden eliminar estas unidades porque ya tienen avances registrados: ${blockedLabels.join(", ")}.`
}

async function assertRemovableFloors(
  supabase: SupabaseClient,
  projectId: string,
  floorIdsToRemove: string[],
  floorNames: Map<string, string>,
): Promise<string | null> {
  if (floorIdsToRemove.length === 0) return null

  const { data: blocked, error } = await supabase
    .from("progress_entries")
    .select("floor_id")
    .eq("project_id", projectId)
    .in("floor_id", floorIdsToRemove)

  if (error) throw error
  if (!blocked || blocked.length === 0) return null

  const blockedNames = [
    ...new Set(
      blocked
        .map((row) => (row.floor_id ? floorNames.get(row.floor_id) : null))
        .filter((name): name is string => !!name),
    ),
  ]

  if (blockedNames.length === 1) {
    return `No se puede eliminar el piso "${blockedNames[0]}" porque ya tiene avances registrados.`
  }

  return `No se pueden eliminar estos pisos porque ya tienen avances registrados: ${blockedNames.join(", ")}.`
}

async function assignAllTasksToNewUnits(
  supabase: SupabaseClient,
  projectId: string,
  newUnitIds: string[],
): Promise<void> {
  if (newUnitIds.length === 0) return

  const { data: currentTasks, error: tasksError } = await supabase
    .from("rubro_tasks")
    .select("id")
    .eq("project_id", projectId)

  if (tasksError) throw tasksError
  if (!currentTasks || currentTasks.length === 0) return

  const assignmentRows = newUnitIds.flatMap((unitId) =>
    currentTasks.map((task) => ({
      project_id: projectId,
      unit_id: unitId,
      rubro_task_id: task.id,
    })),
  )

  const { error: assignError } = await supabase.from("unit_task_assignments").insert(assignmentRows)
  if (assignError) throw assignError
}

function resolveUnitTypeId(
  unitType: string | null,
  unitTypeMap: Map<string, string>,
): string {
  const normalized = normalizeUnitType(unitType) ?? "Otro"
  const unitTypeId =
    unitTypeMap.get(normalized) ??
    unitTypeMap.get("Otro") ??
    unitTypeMap.get("Departamento")
  if (!unitTypeId) {
    throw new Error(`Tipo de unidad "${normalized}" no encontrado`)
  }
  return unitTypeId
}

export async function syncProjectStructure(
  supabase: SupabaseClient,
  projectId: string,
  floors: StructureFloorSaveInput[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const [{ data: unitTypes, error: unitTypesError }, existing] = await Promise.all([
      supabase.from("unit_types").select("id, label"),
      loadExistingStructureState(supabase, projectId),
    ])

    if (unitTypesError) throw unitTypesError
    if (!unitTypes || unitTypes.length === 0) {
      return { ok: false, error: "No se encontraron tipos de unidades en la BD" }
    }

    const unitTypeMap = new Map(unitTypes.map((ut) => [ut.label, ut.id]))
    const { incoming, emptyFloorIdsToDelete } = collectIncomingStructureIds(floors, existing)

    const unitsToDelete = [...existing.unitIds].filter((id) => !incoming.unitIds.has(id))
    const floorsToDelete = [
      ...[...existing.floorIds].filter((id) => !incoming.floorIds.has(id)),
      ...emptyFloorIdsToDelete,
    ]

    const unitRemovalError = await assertRemovableUnits(
      supabase,
      projectId,
      unitsToDelete,
      existing.unitLabels,
    )
    if (unitRemovalError) return { ok: false, error: unitRemovalError }

    const floorRemovalError = await assertRemovableFloors(
      supabase,
      projectId,
      floorsToDelete,
      existing.floorNames,
    )
    if (floorRemovalError) return { ok: false, error: floorRemovalError }

    const newUnitIds: string[] = []

    for (let floorIndex = 0; floorIndex < floors.length; floorIndex++) {
      const floor = floors[floorIndex]
      if (floor.units.length === 0) continue

      let floorId: string
      if (isPersistedId(floor.id, existing.floorIds)) {
        floorId = floor.id
        const { error: floorUpdateError } = await supabase
          .from("project_floors")
          .update({
            name: floor.name,
            level: floor.level,
            sort_order: floorIndex,
          })
          .eq("id", floorId)
          .eq("project_id", projectId)
        if (floorUpdateError) throw floorUpdateError
      } else {
        const { data: insertedFloor, error: floorInsertError } = await supabase
          .from("project_floors")
          .insert({
            project_id: projectId,
            name: floor.name,
            level: floor.level,
            sort_order: floorIndex,
          })
          .select("id")
          .single()
        if (floorInsertError || !insertedFloor) {
          throw floorInsertError ?? new Error(`Error al crear piso "${floor.name}"`)
        }
        floorId = insertedFloor.id
      }

      for (let unitIndex = 0; unitIndex < floor.units.length; unitIndex++) {
        const unit = floor.units[unitIndex]
        const unitTypeId = resolveUnitTypeId(unit.unit_type, unitTypeMap)

        if (isPersistedId(unit.id, existing.unitIds)) {
          const { error: unitUpdateError } = await supabase
            .from("project_units")
            .update({
              floor_id: floorId,
              code: unit.code,
              name: unit.name,
              unit_type_id: unitTypeId,
              unit_type: unit.unit_type,
              room_count: unit.room_count,
              square_meters: unit.area_m2,
              sort_order: unitIndex,
            })
            .eq("id", unit.id)
            .eq("project_id", projectId)
          if (unitUpdateError) throw unitUpdateError
        } else {
          const { data: insertedUnit, error: unitInsertError } = await supabase
            .from("project_units")
            .insert({
              project_id: projectId,
              floor_id: floorId,
              code: unit.code,
              name: unit.name,
              unit_type_id: unitTypeId,
              unit_type: unit.unit_type,
              room_count: unit.room_count,
              square_meters: unit.area_m2,
              sort_order: unitIndex,
            })
            .select("id")
            .single()
          if (unitInsertError || !insertedUnit) {
            throw unitInsertError ?? new Error(`Error al crear unidad "${unit.code}"`)
          }
          newUnitIds.push(insertedUnit.id)
        }
      }
    }

    if (unitsToDelete.length > 0) {
      const { error: deleteUnitsError } = await supabase
        .from("project_units")
        .delete()
        .eq("project_id", projectId)
        .in("id", unitsToDelete)
      if (deleteUnitsError) throw deleteUnitsError
    }

    if (floorsToDelete.length > 0) {
      const { error: deleteFloorsError } = await supabase
        .from("project_floors")
        .delete()
        .eq("project_id", projectId)
        .in("id", floorsToDelete)
      if (deleteFloorsError) throw deleteFloorsError
    }

    await assignAllTasksToNewUnits(supabase, projectId, newUnitIds)

    return { ok: true }
  } catch (err) {
    return { ok: false, error: mapSupabaseError(err, "Error al guardar estructura") }
  }
}
