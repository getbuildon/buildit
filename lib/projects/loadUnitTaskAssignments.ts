import type { SupabaseClient } from "@supabase/supabase-js"

export async function loadUnitTaskAssignmentsByUnit(
  supabase: SupabaseClient,
  projectId: string,
): Promise<Record<string, string[]>> {
  const { data, error } = await supabase
    .from("unit_task_assignments")
    .select("unit_id, rubro_task_id")
    .eq("project_id", projectId)

  if (error || !data) return {}

  const byUnit: Record<string, string[]> = {}
  for (const row of data) {
    if (!byUnit[row.unit_id]) byUnit[row.unit_id] = []
    byUnit[row.unit_id].push(row.rubro_task_id)
  }

  return byUnit
}
