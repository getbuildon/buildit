"use client"

import type { QueryClient } from "@tanstack/react-query"
import {
  invalidateHomeProgress,
  invalidateHomeProjects,
} from "@/lib/home/invalidateHomeQueries"
import { PROJECT_QUERY_ROOT, projectQueryKeys } from "@/lib/project/projectQueryKeys"

export function invalidateProjectProgress(
  queryClient: QueryClient,
  projectId: string,
) {
  void invalidateHomeProgress(queryClient)
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: projectQueryKeys.dashboard(projectId) }),
    queryClient.invalidateQueries({
      queryKey: projectQueryKeys.trabajoDiario(projectId),
    }),
    queryClient.invalidateQueries({
      queryKey: projectQueryKeys.certificaciones(projectId),
    }),
    queryClient.invalidateQueries({
      queryKey: [...projectQueryKeys.all(projectId), "unit"],
    }),
  ])
}

export function invalidateProjectQueries(
  queryClient: QueryClient,
  projectId: string,
) {
  void invalidateHomeProgress(queryClient)
  void invalidateHomeProjects(queryClient)
  return queryClient.invalidateQueries({
    queryKey: [PROJECT_QUERY_ROOT, projectId],
  })
}

export function invalidateProjectSection(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
) {
  return queryClient.invalidateQueries({ queryKey })
}
