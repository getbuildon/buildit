"use server"

import { loadProjectPlanSurfaceLimit } from "@/lib/company/projectSubscriptionLimits"
import { checkProjectPermission } from "@/lib/project/projectAccess"
import { assertDraftProjectAccess, requireAuthenticatedUserId } from "@/lib/projects/persistProjectFromDraft"
import { createClient } from "@/utils/supabase/server"

export async function getProjectPlanSurfaceLimit(
  projectId: string,
): Promise<number | null> {
  const userId = await requireAuthenticatedUserId()
  const supabase = await createClient()
  const trimmedProjectId = projectId.trim()

  if (!trimmedProjectId) return null

  const draftAccess = await assertDraftProjectAccess(supabase, userId, trimmedProjectId)
  if (!draftAccess.ok) {
    const permission = await checkProjectPermission(trimmedProjectId, "configureProject")
    if (!permission.ok) return null
  }

  const limit = await loadProjectPlanSurfaceLimit(supabase, trimmedProjectId)
  return limit?.surfaceMaxM2 ?? null
}
