export type UserProjectListItem = {
  projectId: string
  company_id: string
  organizationName: string
  companyLogoUrl: string | null
  name: string
  address: string
  floors: number
  units: number
  status: "draft" | "active" | "paused" | "completed" | "archived"
  /** Progreso general del proyecto (promedio de unidades). */
  generalProgressPercent: number
  /** Variación del progreso respecto a hace 7 días. */
  weeklyProgressDelta: number
}

/** Card de Home: identidad de la obra, sin progreso. */
export type HomeProjectListItem = {
  projectId: string
  name: string
  address: string
  floors: number
  status: UserProjectListItem["status"]
  companyLogoUrl: string | null
}
