import type { CreateProjectDraft } from "@/lib/projects/createProjectDraft"

export type StructureIdMaps = {
  floorIdByDraftId: Record<string, string>
  unitIdByDraftId: Record<string, string>
}

export type RubrosIdMaps = {
  groupIdByDraftId: Record<string, string>
  rubroIdByDraftId: Record<string, string>
  taskIdByDraftId: Record<string, string>
}

export type UnitAssetRefresh = {
  planUrl?: string | null
  renderUrl?: string | null
  clearPlan?: boolean
  clearRender?: boolean
}

function remapId(id: string, map: Record<string, string>): string {
  return map[id] ?? id
}

export function remapExclusionIds(
  exclusions: Record<string, string[]>,
  unitMap: Record<string, string>,
  taskMap: Record<string, string>,
): Record<string, string[]> {
  const remapped: Record<string, string[]> = {}

  for (const [unitId, excludedTaskIds] of Object.entries(exclusions)) {
    const newUnitId = remapId(unitId, unitMap)
    const newExcluded = [
      ...new Set(excludedTaskIds.map((taskId) => remapId(taskId, taskMap))),
    ]

    if (newExcluded.length > 0) {
      remapped[newUnitId] = newExcluded
    }
  }

  return remapped
}

export function refreshConfigDraftAfterSave(
  draft: CreateProjectDraft,
  input: {
    projectName: string
    location: string
    structureMaps?: StructureIdMaps
    rubrosMaps?: RubrosIdMaps
    unitAssets?: Record<string, UnitAssetRefresh>
  },
): CreateProjectDraft {
  const floorMap = input.structureMaps?.floorIdByDraftId ?? {}
  const unitMap = input.structureMaps?.unitIdByDraftId ?? {}
  const groupMap = input.rubrosMaps?.groupIdByDraftId ?? {}
  const rubroMap = input.rubrosMaps?.rubroIdByDraftId ?? {}
  const taskMap = input.rubrosMaps?.taskIdByDraftId ?? {}

  const floors = draft.floors.map((floor) => ({
    ...floor,
    id: remapId(floor.id, floorMap),
    units: floor.units.map((unit) => {
      const assets = input.unitAssets?.[unit.id]

      return {
        ...unit,
        id: remapId(unit.id, unitMap),
        planUrl: assets?.clearPlan ? null : assets?.planUrl !== undefined ? assets.planUrl : unit.planUrl,
        planImage: assets?.planUrl !== undefined || assets?.clearPlan ? null : unit.planImage,
        planRemoved: assets?.clearPlan ? false : unit.planRemoved,
        renderUrl:
          assets?.clearRender ? null : assets?.renderUrl !== undefined ? assets.renderUrl : unit.renderUrl,
        renderImage:
          assets?.renderUrl !== undefined || assets?.clearRender ? null : unit.renderImage,
        renderRemoved: assets?.clearRender ? false : unit.renderRemoved,
      }
    }),
  }))

  const groups = draft.groups.map((group) => ({
    ...group,
    id: remapId(group.id, groupMap),
    rubros: group.rubros.map((rubro) => ({
      ...rubro,
      id: remapId(rubro.id, rubroMap),
      tasks: rubro.tasks.map((task) => ({
        ...task,
        id: remapId(task.id, taskMap),
      })),
    })),
  }))

  return {
    ...draft,
    projectName: input.projectName,
    location: input.location,
    floors,
    groups,
    unitTaskExclusions: remapExclusionIds(draft.unitTaskExclusions, unitMap, taskMap),
  }
}

export function collectStructureIdMaps(
  floorIdByDraftId: Record<string, string>,
  unitIdByDraftId: Record<string, string>,
): StructureIdMaps {
  return { floorIdByDraftId, unitIdByDraftId }
}

export function emptyRubrosIdMaps(): RubrosIdMaps {
  return {
    groupIdByDraftId: {},
    rubroIdByDraftId: {},
    taskIdByDraftId: {},
  }
}
