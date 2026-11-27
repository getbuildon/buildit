"use client"

import { useState, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

import { AppRouteLoadingProvider } from "@/components/navigation/AppRouteLoadingProvider"
import { TemaPorPantalla } from "@/components/providers/TemaPorPantalla"
import { VaciarColaDeEscrituras } from "@/components/providers/VaciarColaDeEscrituras"
import { RegistrarServiceWorker } from "@/components/providers/RegistrarServiceWorker"
import { ToastProvider } from "@/components/ui/toast"

type AppProvidersProps = {
  children: ReactNode
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  })
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <AppRouteLoadingProvider>
        <ToastProvider>{children}</ToastProvider>
      </AppRouteLoadingProvider>
      <RegistrarServiceWorker />
      <VaciarColaDeEscrituras />
      <TemaPorPantalla />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}