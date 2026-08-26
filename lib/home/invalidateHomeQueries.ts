"use client"

import type { QueryClient } from "@tanstack/react-query"
import { HOME_QUERY_ROOT } from "@/lib/home/homeQueryKeys"

export function invalidateHomeProgress(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: [...HOME_QUERY_ROOT, "progress"] })
}

export function invalidateHomeProjects(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: [...HOME_QUERY_ROOT, "projects"] })
}