import type {
  CreateProjectDraft,
  RubroGroupDraft,
  StructureFloorDraft,
} from "@/lib/projects/createProjectDraft"

export type ConfigBasicsState = {
  name: string
  location: string
  totalSurface: string
  startDate: string
  endDate: string
}

export type ConfigSavedSnapshot = {
  basics: ConfigBasicsState
  floors: string
  groups: string
  exclusions: string
}

function serializeFloors(floors: StructureFloorDraft[]): string {
  return JSON.stringify(
    floors.map((floor) => ({
      id: floor.id,
      name: floor.name,
      identifier: floor.identifier,
      level: floor.level,
      units: floor.units.map((unit) => ({
        id: unit.id,
        code: unit.code,
        type: unit.type,
        squareMeters: unit.squareMeters,
        roomCount: unit.roomCount,
        officeSize: unit.officeSize,
        planUrl: unit.planUrl,
        planRemoved: unit.planRemoved,
        planPending: unit.planImage?.fileName ?? null,
        renderUrl: unit.renderUrl,
        renderRemoved: unit.renderRemoved,
        renderPending: unit.renderImage?.fileName ?? null,
      })),
    })),
  )
}

function serializeGroups(groups: RubroGroupDraft[]): string {
  return JSON.stringify(
    groups.map((group) => ({
      id: group.id,
      name: group.name,
      rubros: group.rubros.map((rubro) => ({
        id: rubro.id,
        name: rubro.name,
        weightPercent: rubro.weightPercent,
        trackingType: rubro.trackingType,
        tasks: rubro.tasks.map((task) => ({
          id: task.id,
          name: task.name,
          weightPercent: task.weightPercent,
        })),
      })),
    })),
  )
}

function serializeExclusions(exclusions: Record<string, string[]>): string {
  const sortedKeys = Object.keys(exclusions).sort()
  const normalized: Record<string, string[]> = {}
  for (const key of sortedKeys) {
    normalized[key] = [...exclusions[key]].sort()
  }
  return JSON.stringify(normalized)
}

export function buildConfigSnapshot(
  basics: ConfigBasicsState,
  draft: CreateProjectDraft,
): ConfigSavedSnapshot {
  return {
    basics: { ...basics },
    floors: serializeFloors(draft.floors),
    groups: serializeGroups(draft.groups),
    exclusions: serializeExclusions(draft.unitTaskExclusions),
  }
}

export function isConfigDirty(
  basics: ConfigBasicsState,
  draft: CreateProjectDraft | null,
  snapshot: ConfigSavedSnapshot | null,
): boolean {
  if (!draft || !snapshot) return false

  const current = buildConfigSnapshot(basics, draft)

  return (
    current.basics.name !== snapshot.basics.name ||
    current.basics.location !== snapshot.basics.location ||
    current.basics.totalSurface !== snapshot.basics.totalSurface ||
    current.basics.startDate !== snapshot.basics.startDate ||
    current.basics.endDate !== snapshot.basics.endDate ||
    current.floors !== snapshot.floors ||
    current.groups !== snapshot.groups ||
    current.exclusions !== snapshot.exclusions
  )
}

export function getConfigSaveConfirmMessage(
  basics: ConfigBasicsState,
  draft: CreateProjectDraft | null,
  snapshot: ConfigSavedSnapshot | null,
): string {
  if (!draft || !snapshot) {
    return "Se guardará la configuración del proyecto. ¿Deseás continuar?"
  }

  const current = buildConfigSnapshot(basics, draft)
  const basicsChanged =
    current.basics.name !== snapshot.basics.name ||
    current.basics.location !== snapshot.basics.location ||
    current.basics.totalSurface !== snapshot.basics.totalSurface ||
    current.basics.startDate !== snapshot.basics.startDate ||
    current.basics.endDate !== snapshot.basics.endDate
  const floorsChanged = current.floors !== snapshot.floors
  const groupsChanged = current.groups !== snapshot.groups
  const exclusionsChanged = current.exclusions !== snapshot.exclusions

  if (exclusionsChanged) {
    return "Los cambios se verán reflejados en todas las unidades funcionales. ¿Deseás continuar?"
  }

  if (floorsChanged && groupsChanged) {
    return "Se actualizará la estructura del edificio y los rubros del proyecto. ¿Deseás continuar?"
  }

  if (floorsChanged) {
    return "Se actualizará la estructura del edificio, pisos y unidades. ¿Deseás continuar?"
  }

  if (groupsChanged) {
    return "Se actualizarán los rubros y tareas del proyecto. ¿Deseás continuar?"
  }

  if (basicsChanged) {
    return "Se actualizarán los datos básicos del proyecto. ¿Deseás continuar?"
  }

  return "Se guardará la configuración del proyecto. ¿Deseás continuar?"
}
