"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type ProjectMobileMenuContextValue = {
  isOpen: boolean
  setOpen: (open: boolean) => void
}

const ProjectMobileMenuContext =
  createContext<ProjectMobileMenuContextValue | null>(null)

export function ProjectMobileMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const value = useMemo(() => ({ isOpen, setOpen }), [isOpen])

  return (
    <ProjectMobileMenuContext.Provider value={value}>
      {children}
    </ProjectMobileMenuContext.Provider>
  )
}

export function useProjectMobileMenu() {
  const context = useContext(ProjectMobileMenuContext)

  if (!context) {
    throw new Error(
      "useProjectMobileMenu must be used within ProjectMobileMenuProvider",
    )
  }

  return context
}

export function useProjectMobileMenuOpen() {
  return useContext(ProjectMobileMenuContext)?.isOpen ?? false
}
