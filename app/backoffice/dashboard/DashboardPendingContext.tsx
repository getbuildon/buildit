"use client"

import {
  createContext,
  useContext,
  useTransition,
  type ReactNode,
} from "react"

type DashboardPendingContextValue = {
  isPending: boolean
  startTransition: (callback: () => void) => void
}

const DashboardPendingContext =
  createContext<DashboardPendingContextValue | null>(null)

export function DashboardPendingProvider({ children }: { children: ReactNode }) {
  const [isPending, startTransition] = useTransition()

  return (
    <DashboardPendingContext.Provider value={{ isPending, startTransition }}>
      {children}
    </DashboardPendingContext.Provider>
  )
}

export function useDashboardPending() {
  const context = useContext(DashboardPendingContext)

  if (!context) {
    throw new Error(
      "useDashboardPending must be used within DashboardPendingProvider",
    )
  }

  return context
}
