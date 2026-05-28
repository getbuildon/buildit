export type UserProjectListItem = {
  projectId: string
  organizationName: string
  name: string
  address: string
  floors: number
  units: number
  progressPercent: number
  generalProgressPercent?: number
}
