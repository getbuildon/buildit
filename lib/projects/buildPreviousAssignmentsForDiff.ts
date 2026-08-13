import type { CreateProjectDraft } from "@/lib/projects/createProjectDraft"
import {
  buildAssignmentDraftFromSnapshot,
  type ConfigBasicsState,
  type ConfigSavedSnapshot,
} from "@/lib/projects/configDirtyState"
import {
  exclusionsToAssignments,
  getAllTaskIds,
} from "@/lib/projects/unitTaskAssignments"

export function buildPreviousAssignmentsForDiff(
  snapshot: ConfigSavedSnapshot,
  seed: CreateProjectDraft,
  basics: ConfigBasicsState,
  refreshedDraft: CreateProjectDraft,
  options: {
    structureSynced: boolean
    rubrosSynced: boolean
  },
): Record<string, string[]> {
  const snapshotDraft = buildAssignmentDraftFromSnapshot(seed, snapshot, basics)
  const previous = exclusionsToAssignments(
    snapshotDraft.unitTaskExclusions,
    snapshotDraft,
  )

  const snapshotUnitIds = new Set(
    snapshotDraft.floors.flatMap((floor) => floor.units.map((unit) => unit.id)),
  )
  const snapshotTaskIds = new Set(getAllTaskIds(snapshotDraft))
  const allTaskIds = getAllTaskIds(refreshedDraft)

  if (options.structureSynced) {
    for (const floor of refreshedDraft.floors) {
      for (const unit of floor.units) {
        if (!snapshotUnitIds.has(unit.id)) {
          previous[unit.id] = allTaskIds
        }
      }
    }
  }

  if (options.rubrosSynced) {
    const newTaskIds = allTaskIds.filter((taskId) => !snapshotTaskIds.has(taskId))
    if (newTaskIds.length > 0) {
      for (const floor of refreshedDraft.floors) {
        for (const unit of floor.units) {
          previous[unit.id] = [...new Set([...(previous[unit.id] ?? []), ...newTaskIds])]
        }
      }
    }
  }

  return previous
}
