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
  navigate: (href: string) => void
}

const ProjectNavigationContext =
  createContext<ProjectNavigationContextValue | null>(null)

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1)
  }

  return path
}

function isSameProjectRoute(pathname: string, href: string) {
  const current = normalizePath(pathname)
  const target = normalizePath(href)

  return current === target || current.startsWith(`${target}/`)
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
    <ProjectNavigationContext.Provider value={{ isNavigating, navigate }}>
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
