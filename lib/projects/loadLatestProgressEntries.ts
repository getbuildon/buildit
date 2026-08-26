import type { SupabaseClient } from "@supabase/supabase-js"

export type LatestProgressEntry = {
  id: string
  project_id: string
  floor_id: string | null
  unit_id: string | null
  category_id: string
  task_id: string
  created_by: string
  status: string
  progress_state: string
  comment: string | null
  submitted_at: string | null
  created_at: string
}

export type LoadLatestProgressEntriesOptions = {
  unitId?: string | null
  statuses?: Array<"draft" | "submitted" | "approved" | "rejected">
}

export async function loadLatestProgressEntries(
  supabase: SupabaseClient,
  projectId: string,
  options: LoadLatestProgressEntriesOptions = {},
): Promise<LatestProgressEntry[]> {
  const { data, error } = await supabase.rpc("latest_progress_entries", {
    p_project_id: projectId,
    p_unit_id: options.unitId ?? null,
    p_statuses: options.statuses ?? null,
  })

  if (error || !data) return []
  return data as LatestProgressEntry[]
}
