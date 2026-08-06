import {
  getBackofficeProjects,
  type BackofficeProjectsResult,
} from "@/app/backoffice/proyectos/actions"
import { ProyectosView } from "@/app/backoffice/proyectos/ProyectosView"
import {
  BACKOFFICE_PROYECTOS_PAGE_SIZE,
  parseBackofficeProyectosPage,
  parseBackofficeProyectosPlanSlugFilters,
  parseBackofficeProyectosStatusFilters,
} from "@/lib/backoffice/proyectosQuery"

type BackofficeProyectosPageProps = {
  searchParams: Promise<{
    page?: string
    q?: string
    planSlug?: string
    status?: string
  }>
}

export default async function BackofficeProyectosPage({
  searchParams,
}: BackofficeProyectosPageProps) {
  const params = await searchParams
  const page = parseBackofficeProyectosPage(params.page)
  const search = params.q?.trim() ?? ""
  const planSlugs = parseBackofficeProyectosPlanSlugFilters(params.planSlug)
  const statuses = parseBackofficeProyectosStatusFilters(params.status)

  const result: BackofficeProjectsResult = await getBackofficeProjects({
    page,
    pageSize: BACKOFFICE_PROYECTOS_PAGE_SIZE,
    search,
    planSlugs,
    statuses,
  })

  return (
    <ProyectosView
      result={result}
      initialSearch={search}
      initialPlanSlugs={planSlugs}
      initialStatuses={statuses}
    />
  )
}
