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
  identifier: string | null
  level: string | null
  units: StructureUnitSaveInput[]
}

export type SyncProjectStructureResult =
  | {
      ok: true
      floorIdByDraftId: Record<string, string>
      unitIdByDraftId: Record<string, string>
    }
  | { ok: false; error: string }

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

type PlannedUnit = {
  draftId?: string
  unitId?: string
  code: string
  name: string | null
  unit_type: string | null
  room_count: number | null
  area_m2: number | null
  sortOrder: number
}

type PlannedFloor = {
  floorIndex: number
  draftId?: string
  floorId?: string
  name: string
  identifier: string | null
  level: string | null
  units: PlannedUnit[]
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
): IncomingStructureIds {
  const incoming: IncomingStructureIds = {
    floorIds: new Set<string>(),
    unitIds: new Set<string>(),
  }

  for (const floor of floors) {
    if (isPersistedId(floor.id, existing.floorIds)) {
      incoming.floorIds.add(floor.id)
    }

    for (const unit of floor.units) {
      if (isPersistedId(unit.id, existing.unitIds)) {
        incoming.unitIds.add(unit.id)
      }
    }
  }

  return incoming
}

function buildPlannedFloors(
  floors: StructureFloorSaveInput[],
  existing: ExistingStructureState,
): PlannedFloor[] {
  return floors.map((floor, floorIndex) => ({
    floorIndex,
    draftId: floor.id,
    floorId: isPersistedId(floor.id, existing.floorIds) ? floor.id : undefined,
    name: floor.name,
    identifier: floor.identifier,
    level: floor.level,
    units: floor.units.map((unit, unitIndex) => ({
      draftId: unit.id,
      unitId: isPersistedId(unit.id, existing.unitIds) ? unit.id : undefined,
      code: unit.code,
      name: unit.name,
      unit_type: unit.unit_type,
      room_count: unit.room_count,
      area_m2: unit.area_m2,
      sortOrder: unitIndex,
    })),
  }))
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

async function upsertFloors(
  supabase: SupabaseClient,
  projectId: string,
  plannedFloors: PlannedFloor[],
): Promise<void> {
  const updates = plannedFloors
    .filter((floor): floor is PlannedFloor & { floorId: string } => !!floor.floorId)
    .map((floor) => ({
      id: floor.floorId,
      project_id: projectId,
      name: floor.name,
      identifier: floor.identifier,
      level: floor.level,
      sort_order: floor.floorIndex,
    }))

  if (updates.length > 0) {
    const { error } = await supabase
      .from("project_floors")
      .upsert(updates, { onConflict: "id" })
    if (error) throw error
  }

  const inserts = plannedFloors.filter((floor) => !floor.floorId)
  if (inserts.length === 0) return

  const { data: insertedFloors, error: insertError } = await supabase
    .from("project_floors")
    .insert(
      inserts.map((floor) => ({
        project_id: projectId,
        name: floor.name,
        identifier: floor.identifier,
        level: floor.level,
        sort_order: floor.floorIndex,
      })),
    )
    .select("id")

  if (insertError || !insertedFloors) {
    throw insertError ?? new Error("Error al crear pisos")
  }

  if (insertedFloors.length !== inserts.length) {
    throw new Error("Error al crear pisos")
  }

  for (let index = 0; index < inserts.length; index++) {
    inserts[index].floorId = insertedFloors[index].id
  }
}

function collectFloorIdByDraftId(plannedFloors: PlannedFloor[]): Record<string, string> {
  const floorIdByDraftId: Record<string, string> = {}

  for (const floor of plannedFloors) {
    if (floor.draftId && floor.floorId) {
      floorIdByDraftId[floor.draftId] = floor.floorId
    }
  }

  return floorIdByDraftId
}

async function upsertUnits(
  supabase: SupabaseClient,
  projectId: string,
  plannedFloors: PlannedFloor[],
  unitTypeMap: Map<string, string>,
): Promise<{ unitIdByDraftId: Record<string, string>; newUnitIds: string[] }> {
  const unitIdByDraftId: Record<string, string> = {}
  const newUnitIds: string[] = []

  const updates: Array<{
    id: string
    project_id: string
    floor_id: string
    code: string
    name: string | null
    unit_type_id: string
    unit_type: string | null
    room_count: number | null
    square_meters: number | null
    sort_order: number
  }> = []

  const inserts: Array<{
    plannedUnit: PlannedUnit
    floorId: string
    unitTypeId: string
  }> = []

  for (const floor of plannedFloors) {
    if (!floor.floorId) {
      throw new Error("Piso sin ID persistido")
    }

    for (const unit of floor.units) {
      const unitTypeId = resolveUnitTypeId(unit.unit_type, unitTypeMap)

      if (unit.unitId) {
        updates.push({
          id: unit.unitId,
          project_id: projectId,
          floor_id: floor.floorId,
          code: unit.code,
          name: unit.name,
          unit_type_id: unitTypeId,
          unit_type: unit.unit_type,
          room_count: unit.room_count,
          square_meters: unit.area_m2,
          sort_order: unit.sortOrder,
        })
        if (unit.draftId) {
          unitIdByDraftId[unit.draftId] = unit.unitId
        }
      } else {
        inserts.push({
          plannedUnit: unit,
          floorId: floor.floorId,
          unitTypeId,
        })
      }
    }
  }

  if (updates.length > 0) {
    const { error } = await supabase
      .from("project_units")
      .upsert(updates, { onConflict: "id" })
    if (error) throw error
  }

  if (inserts.length > 0) {
    const { data: insertedUnits, error: insertError } = await supabase
      .from("project_units")
      .insert(
        inserts.map(({ plannedUnit, floorId, unitTypeId }) => ({
          project_id: projectId,
          floor_id: floorId,
          code: plannedUnit.code,
          name: plannedUnit.name,
          unit_type_id: unitTypeId,
          unit_type: plannedUnit.unit_type,
          room_count: plannedUnit.room_count,
          square_meters: plannedUnit.area_m2,
          sort_order: plannedUnit.sortOrder,
        })),
      )
      .select("id")

    if (insertError || !insertedUnits) {
      throw insertError ?? new Error("Error al crear unidades")
    }

    if (insertedUnits.length !== inserts.length) {
      throw new Error("Error al crear unidades")
    }

    for (let index = 0; index < inserts.length; index++) {
      const insertedId = insertedUnits[index].id
      const { plannedUnit } = inserts[index]
      plannedUnit.unitId = insertedId
      newUnitIds.push(insertedId)
      if (plannedUnit.draftId) {
        unitIdByDraftId[plannedUnit.draftId] = insertedId
      }
    }
  }

  return { unitIdByDraftId, newUnitIds }
}

async function deleteRemovedStructure(
  supabase: SupabaseClient,
  projectId: string,
  unitsToDelete: string[],
  floorsToDelete: string[],
): Promise<void> {
  if (unitsToDelete.length > 0) {
    const { error } = await supabase
      .from("project_units")
      .delete()
      .eq("project_id", projectId)
      .in("id", unitsToDelete)
    if (error) throw error
  }

  if (floorsToDelete.length > 0) {
    const { error } = await supabase
      .from("project_floors")
      .delete()
      .eq("project_id", projectId)
      .in("id", floorsToDelete)
    if (error) throw error
  }
}

export async function syncProjectStructure(
  supabase: SupabaseClient,
  projectId: string,
  floors: StructureFloorSaveInput[],
): Promise<SyncProjectStructureResult> {
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
    const plannedFloors = buildPlannedFloors(floors, existing)
    const incoming = collectIncomingStructureIds(floors, existing)

    const unitsToDelete = [...existing.unitIds].filter((id) => !incoming.unitIds.has(id))
    const floorsToDelete = [...existing.floorIds].filter((id) => !incoming.floorIds.has(id))

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

    await upsertFloors(supabase, projectId, plannedFloors)
    const { unitIdByDraftId, newUnitIds } = await upsertUnits(
      supabase,
      projectId,
      plannedFloors,
      unitTypeMap,
    )

    await deleteRemovedStructure(supabase, projectId, unitsToDelete, floorsToDelete)
    await assignAllTasksToNewUnits(supabase, projectId, newUnitIds)

    return {
      ok: true,
      floorIdByDraftId: collectFloorIdByDraftId(plannedFloors),
      unitIdByDraftId,
    }
  } catch (err) {
    return { ok: false, error: mapSupabaseError(err, "Error al guardar estructura") }
  }
}
