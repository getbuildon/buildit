import type { CreateProjectStepId } from "@/lib/projects/createProjectSteps"
import {
  createEmptyProjectDraft,
  type CreateProjectDraft,
  type StructureUnitDraft,
} from "@/lib/projects/createProjectDraft"

export type StoredProjectSetupDraft = {
  version: 1
  phase: "stage" | "wizard"
  activeStepId: CreateProjectStepId
  draft: CreateProjectDraft
}

function stripUnitForStorage(unit: StructureUnitDraft): StructureUnitDraft {
  return {
    ...unit,
    planImage: null,
    renderImage: null,
  }
}

export function serializeSetupDraft(input: {
  draft: CreateProjectDraft
  phase: "stage" | "wizard"
  activeStepId: CreateProjectStepId
}): StoredProjectSetupDraft {
  return {
    version: 1,
    phase: input.phase,
    activeStepId: input.activeStepId,
    draft: {
      ...input.draft,
      floors: input.draft.floors.map((floor) => ({
        ...floor,
        units: floor.units.map(stripUnitForStorage),
      })),
    },
  }
}

export function deserializeSetupDraft(
  stored: StoredProjectSetupDraft | null | undefined,
): {
  draft: CreateProjectDraft
  phase: "stage" | "wizard"
  activeStepId: CreateProjectStepId
} {
  if (!stored || stored.version !== 1) {
    return {
      draft: createEmptyProjectDraft(),
      phase: "stage",
      activeStepId: "basic",
    }
  }

  return {
    draft: {
      ...stored.draft,
      floors: stored.draft.floors.map((floor) => ({
        ...floor,
        units: floor.units.map((unit) => ({
          ...unit,
          planImage: null,
          renderImage: null,
        })),
      })),
    },
    phase: stored.phase,
    activeStepId: stored.activeStepId,
  }
}
