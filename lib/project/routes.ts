export function projectHref(projectId: string, segment?: string): string {
  const id = projectId.trim()
  if (!segment) return `/${id}`
  const path = segment.startsWith("/") ? segment.slice(1) : segment
  return `/${id}/${path}`
}

export function projectDashboardHref(projectId: string): string {
  return projectHref(projectId)
}
