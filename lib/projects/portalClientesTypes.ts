export type PortalMilestoneStatus = "not_started" | "in_progress" | "completed"

export type PortalNewsItem = {
  id: string
  title: string
  description: string
  imageUrl: string | null
  sortOrder: number
}

export type PortalMilestoneItem = {
  id: string
  name: string
  estimatedDate: string | null
  status: PortalMilestoneStatus
  sortOrder: number
}

export type PortalClientesData = {
  news: PortalNewsItem[]
  milestones: PortalMilestoneItem[]
  weatherCity: string
}

export const PORTAL_MILESTONE_STATUS_LABELS: Record<PortalMilestoneStatus, string> = {
  not_started: "Sin iniciar",
  in_progress: "En proceso",
  completed: "Completado",
}

export const PORTAL_MILESTONE_STATUS_OPTIONS: PortalMilestoneStatus[] = [
  "not_started",
  "in_progress",
  "completed",
]

export type PortalNewsSaveInput = {
  id: string
  title: string
  description: string
  imageUrl: string | null
  sortOrder: number
}

export type PortalMilestoneSaveInput = {
  id: string
  name: string
  estimatedDate: string | null
  status: PortalMilestoneStatus
  sortOrder: number
}

export type SavePortalClientesInput = {
  projectId: string
  weatherCity: string
  news: PortalNewsSaveInput[]
  milestones: PortalMilestoneSaveInput[]
  removedNewsIds: string[]
  removedMilestoneIds: string[]
}

export type SavePortalClientesResult =
  | { ok: true; data: PortalClientesData }
  | { ok: false; error: string }
