export const HOME_QUERY_ROOT = ["home"] as const

export const HOME_SHELL_STALE_MS = 5 * 60 * 1000
export const HOME_PROJECTS_STALE_MS = 5 * 60 * 1000
export const HOME_PROGRESS_STALE_MS = 2 * 60 * 60 * 1000

export const homeQueryKeys = {
  all: HOME_QUERY_ROOT,
  shell: (userId: string) => [...HOME_QUERY_ROOT, "shell", userId] as const,
  projects: (userId: string) => [...HOME_QUERY_ROOT, "projects", userId] as const,
  progress: (userId: string, projectIdsKey: string) =>
    [...HOME_QUERY_ROOT, "progress", userId, projectIdsKey] as const,
}

export function homeProgressIdsKey(projectIds: string[]): string {
  return [...projectIds].sort().join(",")
}