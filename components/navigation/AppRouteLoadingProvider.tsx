"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react"
import { usePathname, useRouter } from "next/navigation"
import { esLaMismaObra, irDentroDeLaObra } from "@/lib/project/navegacionEnObra"

import { BackofficeShellSkeleton } from "@/components/backoffice-shell/BackofficeShellSkeleton"
import { CompanyWorkspaceSkeleton } from "@/components/company-shell/CompanyWorkspaceSkeleton"
import { CreateProjectLoadingScreen } from "@/components/projects/new/CreateProjectLoadingScreen"
import { EsqueletoDeInicio } from "@/components/inicio/PantallaDeInicio"
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

/** Si el cambio de pantalla tarda más que esto, se muestra el esqueleto del destino. */
const DEMORA_DE_LA_CARGA_MS = 300

export function AppRouteLoadingProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const [loadingType, setLoadingType] = useState<AppRouteLoadingType | null>(null)
  const [isPending, startTransition] = useTransition()
  // La pantalla de carga solo aparece si el cambio tarda: si la página de destino ya está
  // lista (precargada, con sus datos guardados), se pasa directo sin el esqueleto en el medio.
  const [cargaVisible, setCargaVisible] = useState(false)
  const reloj = useRef<number | null>(null)

  const navigate = useCallback(
    (href: string) => {
      // Dentro de la misma obra (p. ej. Mi Perfil desde el menú): sin ir al servidor.
      if (esLaMismaObra(pathname, href)) {
        irDentroDeLaObra(href)
        return
      }

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
      if (reloj.current) window.clearTimeout(reloj.current)
      reloj.current = window.setTimeout(() => setCargaVisible(true), DEMORA_DE_LA_CARGA_MS)
      startTransition(() => {
        router.push(href)
      })
    },
    [pathname, router],
  )

  useEffect(() => {
    if (!pendingHref) return

    if (hasReachedAppRoute(pathname, pendingHref) && !isPending) {
      if (reloj.current) window.clearTimeout(reloj.current)
      reloj.current = null
      setPendingHref(null)
      setLoadingType(null)
      setCargaVisible(false)
    }
  }, [pathname, pendingHref, isPending])

  const isLoading = loadingType !== null && cargaVisible

  return (
    <AppRouteLoadingContext.Provider
      value={{ isLoading, loadingType, navigate }}
    >
      {children}
      {isLoading ? (
        <div className="fixed inset-0 z-[200]">
          {loadingType === "home" ? (
            <EsqueletoDeInicio />
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
