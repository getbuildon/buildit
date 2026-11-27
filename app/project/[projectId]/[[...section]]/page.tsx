"use client"

import { useParams, usePathname } from "next/navigation"
import { parseProjectPath } from "@/lib/project/routes"
import { ProjectTenantApp } from "../ProjectTenantApp"

/**
 * La sección sale de la dirección actual (usePathname) y no de useParams: al cambiar de
 * sección dentro de la obra se usa history.pushState (lib/project/navegacionEnObra.ts),
 * que Next sincroniza con usePathname pero no con los parámetros de la ruta.
 */
function seccionDe(pathname: string): string[] | undefined {
  const resto = parseProjectPath(pathname)?.rest ?? ""
  const partes = resto.split("/").filter(Boolean).map(decodeURIComponent)
  return partes.length > 0 ? partes : undefined
}

export default function ProjectTenantPage() {
  const params = useParams<{ projectId: string }>()
  const pathname = usePathname()
  const projectId = params.projectId
  if (!projectId) return null

  return <ProjectTenantApp projectId={projectId} section={seccionDe(pathname)} />
}
