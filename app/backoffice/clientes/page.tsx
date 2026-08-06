import {
  getBackofficeClientes,
  type BackofficeClientesResult,
} from "@/app/backoffice/clientes/actions"
import { ClientesView } from "@/app/backoffice/clientes/ClientesView"
import {
  BACKOFFICE_CLIENTES_PAGE_SIZE,
  parseBackofficeClientesPage,
} from "@/lib/backoffice/clientesQuery"

type BackofficeClientesPageProps = {
  searchParams: Promise<{
    page?: string
    q?: string
  }>
}

export default async function BackofficeClientesPage({
  searchParams,
}: BackofficeClientesPageProps) {
  const params = await searchParams
  const page = parseBackofficeClientesPage(params.page)
  const search = params.q?.trim() ?? ""

  const result: BackofficeClientesResult = await getBackofficeClientes({
    page,
    pageSize: BACKOFFICE_CLIENTES_PAGE_SIZE,
    search,
  })

  return <ClientesView result={result} initialSearch={search} />
}
