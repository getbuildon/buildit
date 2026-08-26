"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

type BackofficeNavigationContextValue = {
  isNavigating: boolean
  pendingHref: string | null
  navigate: (href: string) => void
}

const BackofficeNavigationContext =
  createContext<BackofficeNavigationContextValue | null>(null)

function normalizeBackofficePath(path: string) {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1)
  }

  return path
}

export function matchesBackofficeNavHref(a: string, b: string) {
  return normalizeBackofficePath(a) === normalizeBackofficePath(b)
}

function isSameBackofficeRoute(pathname: string, href: string) {
  const current = normalizeBackofficePath(pathname.split("?")[0] ?? pathname)
  const target = normalizeBackofficePath(href.split("?")[0] ?? href)
  return current === target || current.startsWith(`${target}/`)
}

export function BackofficeNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  const navigate = useCallback(
    (href: string) => {
      const targetPath = href.split("?")[0] ?? href
      if (isSameBackofficeRoute(pathname, targetPath)) return

      setPendingHref(href)
      router.push(href)
    },
    [pathname, router],
  )

  useEffect(() => {
    if (!pendingHref) return

    const targetPath = pendingHref.split("?")[0] ?? pendingHref
    if (isSameBackofficeRoute(pathname, targetPath)) {
      setPendingHref(null)
    }
  }, [pathname, pendingHref])

  const isNavigating = pendingHref !== null

  return (
    <BackofficeNavigationContext.Provider
      value={{ isNavigating, pendingHref, navigate }}
    >
      {children}
    </BackofficeNavigationContext.Provider>
  )
}

export function useBackofficeSearchParams() {
  const { pendingHref } = useBackofficeNavigation()
  const searchParams = useSearchParams()

  return useMemo(() => {
    if (!pendingHref) return searchParams
    const queryIndex = pendingHref.indexOf("?")
    const query = queryIndex >= 0 ? pendingHref.slice(queryIndex + 1) : ""
    return new URLSearchParams(query)
  }, [pendingHref, searchParams])
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
