"use client"

import { useParams } from "next/navigation"
import { ProjectTenantApp } from "../ProjectTenantApp"

function sectionFromParams(section: string | string[] | undefined): string[] | undefined {
  if (section == null) return undefined
  return Array.isArray(section) ? section : [section]
}

export default function ProjectTenantPage() {
  const params = useParams<{ projectId: string; section?: string | string[] }>()
  const projectId = params.projectId
  if (!projectId) return null

  return (
    <ProjectTenantApp
      projectId={projectId}
      section={sectionFromParams(params.section)}
    />
  )
}
