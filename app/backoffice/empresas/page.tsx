import {
  getBackofficeCompanies,
  type BackofficeCompaniesResult,
} from "@/app/backoffice/empresas/actions"
import { EmpresasView } from "@/app/backoffice/empresas/EmpresasView"
import {
  BACKOFFICE_EMPRESAS_PAGE_SIZE,
  parseBackofficeEmpresasPage,
} from "@/lib/backoffice/empresasQuery"

type BackofficeEmpresasPageProps = {
  searchParams: Promise<{
    page?: string
    q?: string
  }>
}

export default async function BackofficeEmpresasPage({
  searchParams,
}: BackofficeEmpresasPageProps) {
  const params = await searchParams
  const page = parseBackofficeEmpresasPage(params.page)
  const search = params.q?.trim() ?? ""

  const result: BackofficeCompaniesResult = await getBackofficeCompanies({
    page,
    pageSize: BACKOFFICE_EMPRESAS_PAGE_SIZE,
    search,
  })

  return <EmpresasView result={result} initialSearch={search} />
}
