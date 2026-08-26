import type { SupabaseClient } from "@supabase/supabase-js"
import type { PortalClientesData } from "@/lib/projects/portalClientesTypes"

function mapNewsRow(row: {
  id: string
  title: string
  description: string
  image_url: string | null
  sort_order: number
}) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
  }
}

function mapMilestoneRow(row: {
  id: string
  name: string
  estimated_date: string | null
  status: string
  sort_order: number
}) {
  return {
    id: row.id,
    name: row.name,
    estimatedDate: row.estimated_date,
    status: row.status as PortalClientesData["milestones"][number]["status"],
    sortOrder: row.sort_order,
  }
}

export async function loadPortalClientesData(
  supabase: SupabaseClient,
  projectId: string,
): Promise<PortalClientesData> {
  const [newsResult, milestonesResult, projectResult] = await Promise.all([
    supabase
      .from("project_portal_news")
      .select("id, title, description, image_url, sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("project_portal_milestones")
      .select("id, name, estimated_date, status, sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("projects")
      .select("weather_city, location")
      .eq("id", projectId)
      .maybeSingle(),
  ])

  if (newsResult.error) {
    throw new Error(newsResult.error.message)
  }
  if (milestonesResult.error) {
    throw new Error(milestonesResult.error.message)
  }
  if (projectResult.error) {
    throw new Error(projectResult.error.message)
  }

  return {
    news: (newsResult.data ?? []).map(mapNewsRow),
    milestones: (milestonesResult.data ?? []).map(mapMilestoneRow),
    weatherCity:
      projectResult.data?.weather_city?.trim() ||
      projectResult.data?.location?.trim() ||
      "",
  }
}
