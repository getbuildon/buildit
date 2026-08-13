import type { SupabaseClient } from "@supabase/supabase-js"

function assignmentPairKey(unitId: string, taskId: string): string {
  return `${unitId}:${taskId}`
}

function assignmentPairs(byUnit: Record<string, string[]>): Set<string> {
  const pairs = new Set<string>()

  for (const [unitId, taskIds] of Object.entries(byUnit)) {
    for (const taskId of taskIds) {
      pairs.add(assignmentPairKey(unitId, taskId))
    }
  }

  return pairs
}

export type SyncUnitTaskAssignmentsStats = {
  inserted: number
  deleted: number
  unchanged: number
}

export async function syncUnitTaskAssignments(
  supabase: SupabaseClient,
  projectId: string,
  desired: Record<string, string[]>,
  previous: Record<string, string[]>,
): Promise<SyncUnitTaskAssignmentsStats> {
  const desiredPairs = assignmentPairs(desired)
  const previousPairs = assignmentPairs(previous)

  const toDeleteByUnit = new Map<string, string[]>()
  const toInsert: Array<{
    project_id: string
    unit_id: string
    rubro_task_id: string
  }> = []

  for (const key of previousPairs) {
    if (desiredPairs.has(key)) continue

    const separatorIndex = key.indexOf(":")
    const unitId = key.slice(0, separatorIndex)
    const taskId = key.slice(separatorIndex + 1)
    const taskIds = toDeleteByUnit.get(unitId) ?? []
    taskIds.push(taskId)
    toDeleteByUnit.set(unitId, taskIds)
  }

  for (const key of desiredPairs) {
    if (previousPairs.has(key)) continue

    const separatorIndex = key.indexOf(":")
    const unitId = key.slice(0, separatorIndex)
    const taskId = key.slice(separatorIndex + 1)
    toInsert.push({
      project_id: projectId,
      unit_id: unitId,
      rubro_task_id: taskId,
    })
  }

  for (const [unitId, taskIds] of toDeleteByUnit) {
    const { error } = await supabase
      .from("unit_task_assignments")
      .delete()
      .eq("project_id", projectId)
      .eq("unit_id", unitId)
      .in("rubro_task_id", taskIds)

    if (error) throw error
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("unit_task_assignments").insert(toInsert)
    if (error) throw error
  }

  return {
    inserted: toInsert.length,
    deleted: [...toDeleteByUnit.values()].reduce((sum, taskIds) => sum + taskIds.length, 0),
    unchanged: desiredPairs.size - toInsert.length,
  }
}
