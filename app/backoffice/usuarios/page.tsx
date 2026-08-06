import {
  getBackofficeUsers,
  type BackofficeUsersResult,
} from "@/app/backoffice/usuarios/actions"
import { UsuariosView } from "@/app/backoffice/usuarios/UsuariosView"
import {
  BACKOFFICE_USERS_PAGE_SIZE,
  parseBackofficeUsersPage,
  parseBackofficeUsersStatusFilter,
} from "@/lib/backoffice/usuariosQuery"

type BackofficeUsuariosPageProps = {
  searchParams: Promise<{
    page?: string
    q?: string
    status?: string
  }>
}

export default async function BackofficeUsuariosPage({
  searchParams,
}: BackofficeUsuariosPageProps) {
  const params = await searchParams
  const page = parseBackofficeUsersPage(params.page)
  const search = params.q?.trim() ?? ""
  const status = parseBackofficeUsersStatusFilter(params.status)

  const result: BackofficeUsersResult = await getBackofficeUsers({
    page,
    pageSize: BACKOFFICE_USERS_PAGE_SIZE,
    search,
    status,
  })

  return (
    <UsuariosView
      result={result}
      initialSearch={search}
      initialStatus={status}
    />
  )
}
