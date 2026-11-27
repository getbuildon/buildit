"use client"

import type { QueryClient } from "@tanstack/react-query"
import {
  invalidateHomeProgress,
  invalidateHomeProjects,
} from "@/lib/home/invalidateHomeQueries"
import { PROJECT_QUERY_ROOT, projectQueryKeys } from "@/lib/project/projectQueryKeys"

/**
 * Las lecturas del servidor de datos de esta obra (claves ["api", persona, "obras", obra, …])
 * y el avance del inicio. Se vuelven a pedir con la versión guardada: si nada cambió, el
 * servidor contesta «sin cambios».
 */
function invalidateApiDeObra(queryClient: QueryClient, projectId: string) {
  return queryClient.invalidateQueries({
    predicate: ({ queryKey }) =>
      queryKey[0] === "api" &&
      ((queryKey[2] === "obras" && queryKey[3] === projectId) || queryKey[2] === "inicio"),
  })
}

export function invalidateProjectProgress(
  queryClient: QueryClient,
  projectId: string,
) {
  void invalidateHomeProgress(queryClient)
  void invalidateApiDeObra(queryClient, projectId)
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
  void invalidateApiDeObra(queryClient, projectId)
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
