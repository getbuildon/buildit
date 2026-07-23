"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { ProjectAccessContext } from "@/lib/project/projectAccess"
import {
  hasProjectPermission,
  type ProjectPermissionKey,
} from "@/lib/project/projectPermissions"

const ProjectAccessContextValue = createContext<ProjectAccessContext | null>(null)

type ProjectAccessProviderProps = {
  value: ProjectAccessContext
  children: ReactNode
}

export function ProjectAccessProvider({ value, children }: ProjectAccessProviderProps) {
  return (
    <ProjectAccessContextValue.Provider value={value}>
      {children}
    </ProjectAccessContextValue.Provider>
  )
}

export function useProjectAccess(): ProjectAccessContext {
  const context = useContext(ProjectAccessContextValue)
  if (!context) {
    throw new Error("useProjectAccess debe usarse dentro de ProjectAccessProvider")
  }
  return context
}

export function useProjectPermission(permission: ProjectPermissionKey): boolean {
  const { permissions } = useProjectAccess()
  return hasProjectPermission(permissions, permission)
}
