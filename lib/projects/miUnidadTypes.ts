import type { PortalClientesData } from "@/lib/projects/portalClientesTypes"
import type { ProjectWeatherSnapshot } from "@/lib/weather/openMeteo"

export type MiUnidadAssignedUnit = {
  id: string
  code: string
  name: string | null
  unitType: string | null
  roomCount: number | null
  renderUrl: string | null
  floorLabel: string | null
}

export type MiUnidadPageData = PortalClientesData & {
  projectName: string
  projectLocation: string
  projectEndDate: string | null
  weather: ProjectWeatherSnapshot | null
  units: MiUnidadAssignedUnit[]
}

export const MI_UNIDAD_MILESTONE_LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
