"use client"

import { createContext, useContext, type ReactNode } from "react"

export type ProjectMeta = {
  id: string
  name: string
}

const ProjectMetaContext = createContext<ProjectMeta | null>(null)

export function ProjectMetaProvider({
  value,
  children,
}: {
  value: ProjectMeta
  children: ReactNode
}) {
  return (
    <ProjectMetaContext.Provider value={value}>{children}</ProjectMetaContext.Provider>
  )
}

export function useProjectMeta(): ProjectMeta {
  const context = useContext(ProjectMetaContext)
  if (!context) {
    throw new Error("useProjectMeta debe usarse dentro de ProjectMetaProvider")
  }
  return context
}
