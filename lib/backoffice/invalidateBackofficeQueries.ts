"use client"

import { useCallback } from "react"
import { useQueryClient, type QueryClient } from "@tanstack/react-query"

import { backofficeQueryKeys } from "@/lib/backoffice/backofficeQueryKeys"

export function invalidateBackofficeQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: backofficeQueryKeys.all })
}

export function useInvalidateBackoffice() {
  const queryClient = useQueryClient()
  return useCallback(
    () => invalidateBackofficeQueries(queryClient),
    [queryClient],
  )
}
