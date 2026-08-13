import type { CreateProjectDraft, StructureFloorDraft } from "@/lib/projects/createProjectDraft"
import { extractTotalSurfaceDigits } from "@/lib/projects/totalSurfaceInput"

export function formatSquareMeters(value: number): string {
  return `${new Intl.NumberFormat("es-AR").format(Math.round(value))} m²`
}

export function parseTotalSurfaceM2(value: string): number | null {
  const digits = extractTotalSurfaceDigits(value)
  if (!digits) return null

  const parsed = Number(digits)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function parseUnitSquareMeters(value: string): number {
  const trimmed = value.trim()
  if (!trimmed) return 0

  const parsed = Number(trimmed.replace(",", "."))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export function sumStructureUnitsSquareMeters(floors: StructureFloorDraft[]): number {
  return floors.reduce(
    (total, floor) =>
      total +
      floor.units.reduce(
        (floorTotal, unit) => floorTotal + parseUnitSquareMeters(unit.squareMeters),
        0,
      ),
    0,
  )
}

export type StructureSurfaceLimitState = {
  isOverLimit: boolean
  planSurfaceMaxM2: number | null
  unitsSurfaceM2: number
  hasPlanLimit: boolean
}

export function getStructureSurfaceLimitState(
  floors: StructureFloorDraft[],
  planSurfaceMaxM2: number | null | undefined,
): StructureSurfaceLimitState {
  const unitsSurfaceM2 = sumStructureUnitsSquareMeters(floors)
  const hasPlanLimit = planSurfaceMaxM2 != null && planSurfaceMaxM2 > 0

  return {
    isOverLimit: hasPlanLimit && unitsSurfaceM2 > planSurfaceMaxM2,
    planSurfaceMaxM2: hasPlanLimit ? planSurfaceMaxM2 : null,
    unitsSurfaceM2,
    hasPlanLimit,
  }
}

export const PLAN_SURFACE_OVER_LIMIT_MESSAGE =
  "Superaste la superficie permitida por el plan."

/** @deprecated Use PLAN_SURFACE_OVER_LIMIT_MESSAGE */
export const STRUCTURE_SURFACE_OVER_LIMIT_MESSAGE = PLAN_SURFACE_OVER_LIMIT_MESSAGE

export function isTotalSurfaceOverPlanLimit(
  totalSurface: string,
  planSurfaceMaxM2: number | null | undefined,
): boolean {
  const enteredSurfaceM2 = parseTotalSurfaceM2(totalSurface)
  const hasPlanLimit = planSurfaceMaxM2 != null && planSurfaceMaxM2 > 0
  return hasPlanLimit && enteredSurfaceM2 != null && enteredSurfaceM2 > planSurfaceMaxM2
}

export function getStructureSurfaceLimitError(
  floors: StructureFloorDraft[],
  planSurfaceMaxM2: number | null | undefined,
): string | null {
  const state = getStructureSurfaceLimitState(floors, planSurfaceMaxM2)
  return state.isOverLimit ? PLAN_SURFACE_OVER_LIMIT_MESSAGE : null
}

export function getProjectPlanSurfaceLimitError(
  draft: CreateProjectDraft,
  planSurfaceMaxM2: number | null | undefined,
): string | null {
  if (isTotalSurfaceOverPlanLimit(draft.totalSurface, planSurfaceMaxM2)) {
    return PLAN_SURFACE_OVER_LIMIT_MESSAGE
  }

  return getStructureSurfaceLimitError(draft.floors, planSurfaceMaxM2)
}

export function getProjectPlanSurfaceLimitState(
  draft: CreateProjectDraft,
  planSurfaceMaxM2: number | null | undefined,
): {
  isOverLimit: boolean
  planSurfaceMaxM2: number | null
  reportedSurfaceM2: number
} {
  const hasPlanLimit = planSurfaceMaxM2 != null && planSurfaceMaxM2 > 0
  const enteredSurfaceM2 = parseTotalSurfaceM2(draft.totalSurface)
  const unitsSurfaceM2 = sumStructureUnitsSquareMeters(draft.floors)

  if (!hasPlanLimit) {
    return { isOverLimit: false, planSurfaceMaxM2: null, reportedSurfaceM2: 0 }
  }

  if (enteredSurfaceM2 != null && enteredSurfaceM2 > planSurfaceMaxM2) {
    return {
      isOverLimit: true,
      planSurfaceMaxM2,
      reportedSurfaceM2: enteredSurfaceM2,
    }
  }

  if (unitsSurfaceM2 > planSurfaceMaxM2) {
    return {
      isOverLimit: true,
      planSurfaceMaxM2,
      reportedSurfaceM2: unitsSurfaceM2,
    }
  }

  return { isOverLimit: false, planSurfaceMaxM2, reportedSurfaceM2: unitsSurfaceM2 }
}

export const STRUCTURE_SURFACE_LIMIT_BANNER_SELECTOR =
  "[data-structure-surface-limit-banner]"

export function scrollToStructureSurfaceLimitBanner(options?: { delayMs?: number }) {
  const scroll = () => {
    document
      .querySelector(STRUCTURE_SURFACE_LIMIT_BANNER_SELECTOR)
      ?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  if (options?.delayMs != null) {
    window.setTimeout(scroll, options.delayMs)
    return
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(scroll)
  })
}

export function getStructureSurfaceLimitStateFromDraft(
  draft: CreateProjectDraft,
  planSurfaceMaxM2: number | null | undefined,
): StructureSurfaceLimitState {
  return getStructureSurfaceLimitState(draft.floors, planSurfaceMaxM2)
}

export function getStructureSurfaceLimitErrorFromDraft(
  draft: CreateProjectDraft,
  planSurfaceMaxM2: number | null | undefined,
): string | null {
  return getStructureSurfaceLimitError(draft.floors, planSurfaceMaxM2)
}

export function getProjectPlanSurfaceLimitErrorFromDraft(
  draft: CreateProjectDraft,
  planSurfaceMaxM2: number | null | undefined,
): string | null {
  return getProjectPlanSurfaceLimitError(draft, planSurfaceMaxM2)
}
