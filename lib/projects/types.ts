export type UserProjectListItem = {
  projectId: string
  company_id: string
  organizationName: string
  name: string
  address: string
  floors: number
  units: number
  /** Progreso general del proyecto (promedio de unidades). */
  generalProgressPercent: number
  /** Variación del progreso respecto a hace 7 días. */
  weeklyProgressDelta: number
}
