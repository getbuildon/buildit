"use client"

import type { ReactNode } from "react"

import { AppRouteLoadingProvider } from "@/components/navigation/AppRouteLoadingProvider"
import { ToastProvider } from "@/components/ui/toast"

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AppRouteLoadingProvider>
      <ToastProvider>{children}</ToastProvider>
    </AppRouteLoadingProvider>
  )
}
