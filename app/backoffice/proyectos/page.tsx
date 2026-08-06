import {
  getBackofficeProjects,
  type BackofficeProjectsResult,
} from "@/app/backoffice/proyectos/actions"
import { ProyectosView } from "@/app/backoffice/proyectos/ProyectosView"
import {
  BACKOFFICE_PROYECTOS_PAGE_SIZE,
  parseBackofficeProyectosPage,
  parseBackofficeProyectosPlanFilter,
  parseBackofficeProyectosStatusFilter,
} from "@/lib/backoffice/proyectosQuery"

type BackofficeProyectosPageProps = {
  searchParams: Promise<{
    page?: string
    q?: string
    plan?: string
    status?: string
  }>
}

export default async function BackofficeProyectosPage({
  searchParams,
}: BackofficeProyectosPageProps) {
  const params = await searchParams
  const page = parseBackofficeProyectosPage(params.page)
  const search = params.q?.trim() ?? ""
  const plan = parseBackofficeProyectosPlanFilter(params.plan)
  const status = parseBackofficeProyectosStatusFilter(params.status)

  const result: BackofficeProjectsResult = await getBackofficeProjects({
    page,
    pageSize: BACKOFFICE_PROYECTOS_PAGE_SIZE,
    search,
    plan,
    status,
  })

  return (
    <ProyectosView
      result={result}
      initialSearch={search}
      initialPlan={plan}
      initialStatus={status}
    />
  )
}
