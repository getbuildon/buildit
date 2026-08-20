"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { requireAuthenticatedUser } from "@/lib/authHelpers"
import { checkProjectPermission } from "@/lib/project/projectAccess"
import { getFloorDisplayLabel } from "@/lib/projects/floorLabels"
import type { MiUnidadAssignedUnit } from "@/lib/projects/miUnidadTypes"
import { displayNameFromEmail } from "@/lib/projects/mockProjects"
import { fetchProjectWeather, resolveWeatherLocation } from "@/lib/weather/openMeteo"
import type { ProjectWeatherSnapshot } from "@/lib/weather/openMeteo"
import type {
  PortalClientesData,
  PortalMilestoneItem,
  PortalMilestoneStatus,
  PortalNewsItem,
  SavePortalClientesInput,
  SavePortalClientesResult,
} from "@/lib/projects/portalClientesTypes"
import { validatePortalClientesContent } from "@/lib/projects/portalClientesValidation"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isPersistedId(id: string): boolean {
  return UUID_PATTERN.test(id)
}

function mapNewsRow(row: {
  id: string
  title: string
  description: string
  image_url: string | null
  sort_order: number
}): PortalNewsItem {
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
}): PortalMilestoneItem {
  return {
    id: row.id,
    name: row.name,
    estimatedDate: row.estimated_date,
    status: row.status as PortalMilestoneStatus,
    sortOrder: row.sort_order,
  }
}

export type PortalClientesPreviewContext = {
  greetingName: string
  projectName: string
  projectEndDate: string | null
  weather: ProjectWeatherSnapshot | null
  units: MiUnidadAssignedUnit[]
}

export async function getPortalClientesPreviewContext(
  projectId: string,
): Promise<PortalClientesPreviewContext> {
  const permission = await checkProjectPermission(projectId, "configureProject")
  if (!permission.ok) {
    throw new Error(permission.error)
  }

  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

  const [profileResult, projectResult, unitsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("projects")
      .select("name, location, weather_city, end_date, companies(country)")
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("project_units")
      .select(
        "id, code, name, unit_type, room_count, square_meters, render_url, sort_order, floor:project_floors(name, identifier)",
      )
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true })
      .limit(4),
  ])

  if (profileResult.error) {
    throw new Error(profileResult.error.message)
  }
  if (projectResult.error) {
    throw new Error(projectResult.error.message)
  }
  if (unitsResult.error) {
    throw new Error(unitsResult.error.message)
  }

  const firstName = profileResult.data?.first_name?.trim() ?? ""
  const lastName = profileResult.data?.last_name?.trim() ?? ""
  const email = profileResult.data?.email ?? ""
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    displayNameFromEmail(email)
  const greetingName = firstName || fullName.split(" ")[0] || "Cliente"

  const company = Array.isArray(projectResult.data?.companies)
    ? projectResult.data.companies[0]
    : projectResult.data?.companies

  const weather = await fetchProjectWeather({
    location: resolveWeatherLocation(
      projectResult.data?.weather_city,
      projectResult.data?.location,
    ),
    country: company?.country ?? null,
  })

  const units: MiUnidadAssignedUnit[] = (unitsResult.data ?? []).map((row) => {
    const floor = Array.isArray(row.floor) ? row.floor[0] : row.floor

    return {
      id: row.id,
      code: row.code?.trim() || "Sin código",
      name: row.name,
      unitType: row.unit_type,
      roomCount: row.room_count,
      squareMeters:
        row.square_meters == null || !Number.isFinite(Number(row.square_meters))
          ? null
          : Number(row.square_meters),
      renderUrl: row.render_url,
      floorLabel: floor
        ? getFloorDisplayLabel({
            name: floor.name,
            identifier: floor.identifier,
          })
        : null,
    }
  })

  return {
    greetingName,
    projectName: projectResult.data?.name?.trim() || "Proyecto",
    projectEndDate: projectResult.data?.end_date ?? null,
    weather,
    units,
  }
}

export async function getPortalClientesData(
  projectId: string,
): Promise<PortalClientesData> {
  const supabase = await createClient()

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

export async function savePortalClientesContent(
  input: SavePortalClientesInput,
): Promise<SavePortalClientesResult> {
  const permission = await checkProjectPermission(input.projectId, "configureProject")
  if (!permission.ok) {
    return { ok: false, error: permission.error }
  }

  const supabase = await createClient()

  const persistedRemovedNewsIds = input.removedNewsIds.filter(isPersistedId)
  const persistedRemovedMilestoneIds = input.removedMilestoneIds.filter(isPersistedId)

  if (persistedRemovedNewsIds.length > 0) {
    const { error } = await supabase
      .from("project_portal_news")
      .delete()
      .eq("project_id", input.projectId)
      .in("id", persistedRemovedNewsIds)

    if (error) {
      return { ok: false, error: `No se pudieron eliminar novedades: ${error.message}` }
    }
  }

  if (persistedRemovedMilestoneIds.length > 0) {
    const { error } = await supabase
      .from("project_portal_milestones")
      .delete()
      .eq("project_id", input.projectId)
      .in("id", persistedRemovedMilestoneIds)

    if (error) {
      return { ok: false, error: `No se pudieron eliminar hitos: ${error.message}` }
    }
  }

  const validation = validatePortalClientesContent(input.news, input.milestones)
  if (!validation.ok) {
    return { ok: false, error: validation.error }
  }

  const { error: weatherCityError } = await supabase
    .from("projects")
    .update({
      weather_city: input.weatherCity.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.projectId)

  if (weatherCityError) {
    return {
      ok: false,
      error: `No se pudo guardar la ciudad del clima: ${weatherCityError.message}`,
    }
  }

  for (const item of input.news) {
    const payload = {
      id: item.id,
      project_id: input.projectId,
      title: item.title.trim(),
      description: item.description.trim(),
      image_url: item.imageUrl,
      sort_order: item.sortOrder,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from("project_portal_news")
      .upsert(payload, { onConflict: "id" })

    if (error) {
      return { ok: false, error: `No se pudo guardar una novedad: ${error.message}` }
    }
  }

  for (const item of input.milestones) {
    const payload = {
      id: item.id,
      project_id: input.projectId,
      name: item.name.trim(),
      estimated_date: item.estimatedDate,
      status: item.status,
      sort_order: item.sortOrder,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from("project_portal_milestones")
      .upsert(payload, { onConflict: "id" })

    if (error) {
      return { ok: false, error: `No se pudo guardar un hito: ${error.message}` }
    }
  }

  revalidatePath(`/${input.projectId}/portal-clientes`)
  revalidatePath(`/${input.projectId}/mi-unidad`)

  const data = await getPortalClientesData(input.projectId)
  return { ok: true, data }
}
