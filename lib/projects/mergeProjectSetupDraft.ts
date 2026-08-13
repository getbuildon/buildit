import type { CreateProjectStepId } from "@/lib/projects/createProjectSteps"
import type { CreateProjectDraft } from "@/lib/projects/createProjectDraft"
import {
  deserializeSetupDraft,
  type StoredProjectSetupDraft,
} from "@/lib/projects/storedProjectSetupDraft"

export function mergeProjectSetupDraft(input: {
  setupDraft: StoredProjectSetupDraft | null
  dbDraft: CreateProjectDraft
  hasDbFloors: boolean
  hasDbRubros: boolean
  hasDbTeam: boolean
}): {
  draft: CreateProjectDraft
  phase: "stage" | "wizard"
  activeStepId: CreateProjectStepId
} {
  const stored = deserializeSetupDraft(input.setupDraft)
  const setupDraftPresent =
    input.setupDraft != null && input.setupDraft.version === 1

  if (!setupDraftPresent) {
    return {
      draft: input.dbDraft,
      phase: "wizard",
      activeStepId: "basic",
    }
  }

  const storedDraft = stored.draft

  const draft: CreateProjectDraft = {
    ...storedDraft,
    projectName: input.dbDraft.projectName,
    location: input.dbDraft.location,
    totalSurface: input.dbDraft.totalSurface,
    startDate: input.dbDraft.startDate,
    endDate: input.dbDraft.endDate,
    workStage: input.dbDraft.workStage,
    companyId: input.dbDraft.companyId ?? storedDraft.companyId,
    companyName: input.dbDraft.companyName || storedDraft.companyName,
    floors: input.hasDbFloors ? input.dbDraft.floors : storedDraft.floors,
    groups: input.hasDbRubros ? input.dbDraft.groups : storedDraft.groups,
    unitTaskExclusions:
      input.hasDbFloors && input.hasDbRubros
        ? input.dbDraft.unitTaskExclusions
        : storedDraft.unitTaskExclusions,
    teamMembers: input.hasDbTeam ? input.dbDraft.teamMembers : storedDraft.teamMembers,
    taskInitialStatuses: storedDraft.taskInitialStatuses,
  }

  return {
    draft,
    phase: "wizard",
    activeStepId: stored.activeStepId,
  }
}
