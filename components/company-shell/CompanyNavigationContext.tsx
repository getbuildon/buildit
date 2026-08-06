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

type CompanyNavigationContextValue = {
  isNavigating: boolean
  pendingHref: string | null
  navigate: (href: string) => void
}

const CompanyNavigationContext =
  createContext<CompanyNavigationContextValue | null>(null)

export function normalizeCompanyPath(path: string) {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1)
  }

  return path
}

export function hasReachedCompanyNavHref(pathname: string, href: string) {
  return normalizeCompanyPath(pathname) === normalizeCompanyPath(href)
}

export function matchesCompanyNavHref(a: string, b: string) {
  return normalizeCompanyPath(a) === normalizeCompanyPath(b)
}

export function CompanyNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const navigate = useCallback(
    (href: string) => {
      if (hasReachedCompanyNavHref(pathname, href)) return

      setPendingHref(href)
      startTransition(() => {
        router.push(href)
      })
    },
    [pathname, router],
  )

  useEffect(() => {
    if (!pendingHref) return

    if (hasReachedCompanyNavHref(pathname, pendingHref) && !isPending) {
      setPendingHref(null)
    }
  }, [pathname, pendingHref, isPending])

  const isNavigating = pendingHref !== null

  return (
    <CompanyNavigationContext.Provider
      value={{ isNavigating, pendingHref, navigate }}
    >
      {children}
    </CompanyNavigationContext.Provider>
  )
}

export function useCompanyNavigation() {
  const context = useContext(CompanyNavigationContext)

  if (!context) {
    throw new Error(
      "useCompanyNavigation must be used within CompanyNavigationProvider",
    )
  }

  return context
}
