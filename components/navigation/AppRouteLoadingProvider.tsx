"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react"
import { usePathname, useRouter } from "next/navigation"

import { BackofficeShellSkeleton } from "@/components/backoffice-shell/BackofficeShellSkeleton"
import { CompanyWorkspaceSkeleton } from "@/components/company-shell/CompanyWorkspaceSkeleton"
import { CreateProjectLoadingScreen } from "@/components/projects/new/CreateProjectLoadingScreen"
import { HomePageSkeleton } from "@/components/home/HomePageSkeleton"
import { PerfilPageSkeleton } from "@/components/profile/PerfilPageSkeleton"
import { ProjectWorkspaceSkeleton } from "@/components/project-shell/ProjectWorkspaceSkeleton"
import {
  getAppRouteLoadingType,
  hasReachedAppRoute,
  type AppRouteLoadingType,
} from "@/lib/navigation/appRouteLoading"

type AppRouteLoadingContextValue = {
  isLoading: boolean
  loadingType: AppRouteLoadingType | null
  navigate: (href: string) => void
}

const AppRouteLoadingContext = createContext<AppRouteLoadingContextValue | null>(
  null,
)

export function AppRouteLoadingProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const [loadingType, setLoadingType] = useState<AppRouteLoadingType | null>(null)
  const [isPending, startTransition] = useTransition()

  const navigate = useCallback(
    (href: string) => {
      const nextLoadingType = getAppRouteLoadingType(href)

      if (!nextLoadingType) {
        router.push(href)
        return
      }

      if (hasReachedAppRoute(pathname, href)) {
        return
      }

      setPendingHref(href)
      setLoadingType(nextLoadingType)
      startTransition(() => {
        router.push(href)
      })
    },
    [pathname, router],
  )

  useEffect(() => {
    if (!pendingHref) return

    if (hasReachedAppRoute(pathname, pendingHref) && !isPending) {
      setPendingHref(null)
      setLoadingType(null)
    }
  }, [pathname, pendingHref, isPending])

  const isLoading = loadingType !== null

  return (
    <AppRouteLoadingContext.Provider
      value={{ isLoading, loadingType, navigate }}
    >
      {children}
      {isLoading ? (
        <div className="fixed inset-0 z-[200]">
          {loadingType === "home" ? (
            <HomePageSkeleton />
          ) : loadingType === "backoffice" ? (
            <BackofficeShellSkeleton />
          ) : loadingType === "company" ? (
            <CompanyWorkspaceSkeleton />
          ) : loadingType === "perfil" ? (
            <PerfilPageSkeleton />
          ) : loadingType === "create-project" ? (
            <CreateProjectLoadingScreen />
          ) : (
            <ProjectWorkspaceSkeleton />
          )}
        </div>
      ) : null}
    </AppRouteLoadingContext.Provider>
  )
}

export function useAppRouteNavigation() {
  const context = useContext(AppRouteLoadingContext)

  if (!context) {
    throw new Error(
      "useAppRouteNavigation must be used within AppRouteLoadingProvider",
    )
  }

  return context
}
