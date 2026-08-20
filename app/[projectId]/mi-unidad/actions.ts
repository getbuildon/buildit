"use server"

import { createClient } from "@/utils/supabase/server"
import { requireAuthenticatedUser } from "@/lib/authHelpers"
import {
  getClientAssignedUnitIds,
  getProjectAccessContext,
} from "@/lib/project/projectAccess"
import { getFloorDisplayLabel } from "@/lib/projects/floorLabels"
import type { MiUnidadAssignedUnit, MiUnidadPageData } from "@/lib/projects/miUnidadTypes"
import { fetchProjectWeather, resolveWeatherLocation } from "@/lib/weather/openMeteo"
import { getPortalClientesData } from "@/app/[projectId]/portal-clientes/actions"

function resolveMiUnidadUnitIds(
  clientUnitIds: string[],
  assignedUnitIds: string[] | null,
): string[] {
  if (clientUnitIds.length > 0) return clientUnitIds
  return assignedUnitIds ?? []
}

export async function getMiUnidadPageData(
  projectId: string,
): Promise<MiUnidadPageData | null> {
  const user = await requireAuthenticatedUser()
  const accessContext = await getProjectAccessContext(projectId)
  if (!accessContext || accessContext.permissions.clientPortal !== true) {
    return null
  }

  const supabase = await createClient()
  const clientUnitIds = await getClientAssignedUnitIds(supabase, projectId, user.id)
  const unitIds = resolveMiUnidadUnitIds(
    clientUnitIds,
    accessContext.assignedUnitIds,
  )

  const [portalData, projectResult] = await Promise.all([
    getPortalClientesData(projectId),
    supabase
      .from("projects")
      .select("name, location, weather_city, end_date, companies(country)")
      .eq("id", projectId)
      .maybeSingle(),
  ])

  if (projectResult.error) {
    throw new Error(projectResult.error.message)
  }

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

  const assignedUnitIds = unitIds
  let units: MiUnidadAssignedUnit[] = []

  if (assignedUnitIds.length > 0) {
    const { data: unitRows, error: unitsError } = await supabase
      .from("project_units")
      .select(
        "id, code, name, unit_type, room_count, square_meters, render_url, sort_order, floor:project_floors(name, identifier)",
      )
      .eq("project_id", projectId)
      .in("id", assignedUnitIds)
      .order("sort_order", { ascending: true })

    if (unitsError) {
      throw new Error(unitsError.message)
    }

    units = (unitRows ?? []).map((row) => {
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
  }

  return {
    ...portalData,
    projectName: projectResult.data?.name?.trim() || "Proyecto",
    projectLocation: projectResult.data?.location?.trim() ?? "",
    projectEndDate: projectResult.data?.end_date ?? null,
    weather,
    units,
  }
}
