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

type ProjectNavigationContextValue = {
  isNavigating: boolean
  pendingHref: string | null
  navigate: (href: string) => void
}

const ProjectNavigationContext =
  createContext<ProjectNavigationContextValue | null>(null)

export function normalizeProjectPath(path: string) {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1)
  }

  return path
}

function isSameProjectRoute(pathname: string, href: string) {
  const current = normalizeProjectPath(pathname)
  const target = normalizeProjectPath(href)

  return current === target || current.startsWith(`${target}/`)
}

export function matchesProjectNavHref(a: string, b: string) {
  return normalizeProjectPath(a) === normalizeProjectPath(b)
}

export function ProjectNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const navigate = useCallback(
    (href: string) => {
      if (isSameProjectRoute(pathname, href)) return

      setPendingHref(href)
      startTransition(() => {
        router.push(href)
      })
    },
    [pathname, router],
  )

  useEffect(() => {
    if (!pendingHref) return

    if (isSameProjectRoute(pathname, pendingHref) && !isPending) {
      setPendingHref(null)
    }
  }, [pathname, pendingHref, isPending])

  const isNavigating = pendingHref !== null

  return (
    <ProjectNavigationContext.Provider
      value={{ isNavigating, pendingHref, navigate }}
    >
      {children}
    </ProjectNavigationContext.Provider>
  )
}

export function useProjectNavigation() {
  const context = useContext(ProjectNavigationContext)

  if (!context) {
    throw new Error(
      "useProjectNavigation must be used within ProjectNavigationProvider",
    )
  }

  return context
}
