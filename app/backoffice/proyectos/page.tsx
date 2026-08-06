import {
  getBackofficeProjects,
  type BackofficeProjectsResult,
} from "@/app/backoffice/proyectos/actions"
import { ProyectosView } from "@/app/backoffice/proyectos/ProyectosView"
import {
  BACKOFFICE_PROYECTOS_PAGE_SIZE,
  parseBackofficeProyectosPage,
} from "@/lib/backoffice/proyectosQuery"

type BackofficeProyectosPageProps = {
  searchParams: Promise<{
    page?: string
    q?: string
  }>
}

export default async function BackofficeProyectosPage({
  searchParams,
}: BackofficeProyectosPageProps) {
  const params = await searchParams
  const page = parseBackofficeProyectosPage(params.page)
  const search = params.q?.trim() ?? ""

  const result: BackofficeProjectsResult = await getBackofficeProjects({
    page,
    pageSize: BACKOFFICE_PROYECTOS_PAGE_SIZE,
    search,
  })

  return <ProyectosView result={result} initialSearch={search} />
}
