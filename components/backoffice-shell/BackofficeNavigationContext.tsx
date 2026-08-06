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

type BackofficeNavigationContextValue = {
  isNavigating: boolean
  navigate: (href: string) => void
}

const BackofficeNavigationContext =
  createContext<BackofficeNavigationContextValue | null>(null)

function isSameBackofficeRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function BackofficeNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const navigate = useCallback(
    (href: string) => {
      if (isSameBackofficeRoute(pathname, href)) return

      setPendingHref(href)
      startTransition(() => {
        router.push(href)
      })
    },
    [pathname, router],
  )

  useEffect(() => {
    if (!pendingHref) return

    if (isSameBackofficeRoute(pathname, pendingHref) && !isPending) {
      setPendingHref(null)
    }
  }, [pathname, pendingHref, isPending])

  const isNavigating = pendingHref !== null

  return (
    <BackofficeNavigationContext.Provider value={{ isNavigating, navigate }}>
      {children}
    </BackofficeNavigationContext.Provider>
  )
}

export function useBackofficeNavigation() {
  const context = useContext(BackofficeNavigationContext)

  if (!context) {
    throw new Error(
      "useBackofficeNavigation must be used within BackofficeNavigationProvider",
    )
  }

  return context
}
