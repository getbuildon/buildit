export const UNIT_PLANS_BUCKET = "unit-plans"

export function buildUnitPlanStoragePath(projectId: string, unitId: string): string {
  return `${projectId}/units/${unitId}/plan.webp`
}

export function buildUnitRenderStoragePath(projectId: string, unitId: string): string {
  return `${projectId}/units/${unitId}/render.webp`
}
