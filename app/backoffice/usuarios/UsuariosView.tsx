"use client"

import { useEffect, useState, useTransition } from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal, Search } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import {
  confirmBackofficeUser,
  deleteBackofficeUser,
  type BackofficeUserRow,
  type BackofficeUsersResult,
} from "@/app/backoffice/usuarios/actions"
import {
  NuevoUsuarioButton,
  NuevoUsuarioDialog,
} from "@/app/backoffice/usuarios/NuevoUsuarioDialog"
import {
  UsuariosAppliedFilters,
  UsuariosFiltersButton,
  UsuariosFiltersDialog,
  type UsuariosFiltersValue,
} from "@/app/backoffice/usuarios/UsuariosFiltersDialog"
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { UserAvatar } from "@/components/user/UserAvatar"
import { formatArgentinaTableDate } from "@/lib/datetime/argentinaDateTime"
import { formatCollaborationProjectCount } from "@/lib/backoffice/collaborationProjectCounts"
import type { BackofficeUsersStatusKind } from "@/lib/backoffice/usuariosQuery"
import {
  hasActiveUsuariosFilters,
  serializeBackofficeUsersStatusFilters,
} from "@/lib/backoffice/usuariosQuery"
import { displayNameFromEmail } from "@/lib/projects/mockProjects"
import { cn } from "@/lib/utils"

type UsuariosViewProps = {
  result: BackofficeUsersResult
  initialSearch: string
  initialStatuses: BackofficeUsersStatusKind[]
}

const TABLE_GRID =
  "grid w-full grid-cols-[minmax(200px,1.4fr)_minmax(180px,1.2fr)_minmax(120px,0.8fr)_minmax(160px,1fr)_minmax(108px,auto)_minmax(112px,auto)_56px] items-start"

const TABLE_CELL = "min-w-0 px-3"
const TABLE_HEADER_CELL =
  "text-xs font-medium leading-4 text-[#777b84]"
const TABLE_BODY_EMPHASIS =
  "truncate text-sm font-medium leading-5 text-[#18191b]"
const TABLE_BODY_TEXT = "truncate text-sm leading-5 text-[#363a3f]"
const TABLE_BODY_DATE =
  "whitespace-nowrap text-sm leading-5 text-[#363a3f] tabular-nums"
const TABLE_BODY_MUTED = "truncate text-xs leading-4 text-[#777b84]"

const TABLE_HEADER_ROW = cn(
  TABLE_GRID,
  "h-[35px] shrink-0 items-center border-b border-[#f4f5f6] px-4",
)

const TABLE_BODY_ROW = cn(
  TABLE_GRID,
  "items-start border-b border-[#edeef0] px-4 py-3 last:border-b-0",
)

const TABLE_HEADERS = ["Mail", "Teléfono", "Empresa", "Colaborador", "Alta"] as const

function fullName(user: BackofficeUserRow) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  return name || displayNameFromEmail(user.email)
}

function primaryCompanyLabel(user: BackofficeUserRow) {
  if (user.memberships.length === 0) return "Sin empresa"
  if (user.memberships.length === 1) return user.memberships[0].companyName
  return `${user.memberships[0].companyName} +${user.memberships.length - 1}`
}

function buildUsuariosQueryString(options: {
  page?: number
  q?: string
  statuses?: BackofficeUsersStatusKind[]
}) {
  const params = new URLSearchParams()

  if (options.page && options.page > 1) {
    params.set("page", String(options.page))
  }

  if (options.q?.trim()) {
    params.set("q", options.q.trim())
  }

  const statusParam = serializeBackofficeUsersStatusFilters(options.statuses ?? [])
  if (statusParam) {
    params.set("status", statusParam)
  }

  const query = params.toString()
  return query ? `?${query}` : ""
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium leading-4",
        active
          ? "border-[#acdec8] bg-[#f4fbf7] text-[#208368]"
          : "border-[#edeef0] bg-[#f4f5f6] text-[#696e77]",
      )}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          active ? "bg-[#208368]" : "bg-[#afb3ba]",
        )}
      />
      {active ? "Activo" : "Inactivo"}
    </span>
  )
}

function UserRowActions({
  user,
  disabled,
}: {
  user: BackofficeUserRow
  disabled?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isActivating, startActivate] = useTransition()
  const [isDeleting, startDelete] = useTransition()

  const userName = fullName(user)
  const showActivate = !user.isActive

  const handleActivate = () => {
    setActionError(null)

    startActivate(async () => {
      const result = await confirmBackofficeUser(user.id)

      if (!result.ok) {
        setActionError(result.error)
        return
      }

      setOpen(false)
      router.refresh()
    })
  }

  const handleDelete = () => {
    setActionError(null)

    startDelete(async () => {
      const result = await deleteBackofficeUser(user.id)

      if (!result.ok) {
        setActionError(result.error)
        return
      }

      setDeleteOpen(false)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex shrink-0 items-start justify-center px-2 pt-0.5">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled || isActivating || isDeleting}
              className="grid size-8 place-items-center rounded-lg text-[#777b84] transition-colors hover:bg-[#f4f5f6] hover:text-[#363a3f] disabled:opacity-50"
              aria-label={`Acciones para ${userName}`}
            >
              <MoreHorizontal className="size-4" strokeWidth={1.75} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={6}
            className="w-44 border-[#edeef0] p-1 shadow-[0_0_10px_rgba(243,103,31,0.08)]"
          >
            {showActivate ? (
              <button
                type="button"
                disabled={isActivating || isDeleting}
                onClick={handleActivate}
                className="flex h-9 w-full items-center rounded-md px-3 text-left text-sm text-[#363a3f] transition-colors hover:bg-[#f4f5f6] disabled:opacity-50"
              >
                {isActivating ? "Activando..." : "Activar"}
              </button>
            ) : null}
            <button
              type="button"
              disabled={isActivating || isDeleting}
              onClick={() => {
                setActionError(null)
                setDeleteOpen(true)
              }}
              className="flex h-9 w-full items-center rounded-md px-3 text-left text-sm text-[#dc3e42] transition-colors hover:bg-[#fff7f7] disabled:opacity-50"
            >
              Eliminar
            </button>
            {actionError ? (
              <p className="px-3 py-2 text-xs leading-[1.4] text-[#dc3e42]">
                {actionError}
              </p>
            ) : null}
          </PopoverContent>
        </Popover>
      </div>

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar usuario"
        description={`¿Eliminar la cuenta de ${userName}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={isDeleting}
        loadingLabel="Eliminando..."
        onConfirm={handleDelete}
      />
    </>
  )
}

function UsuariosPageJump({
  page,
  totalPages,
  disabled,
  onNavigate,
}: {
  page: number
  totalPages: number
  disabled?: boolean
  onNavigate: (page: number) => void
}) {
  const [value, setValue] = useState(String(page))

  useEffect(() => {
    setValue(String(page))
  }, [page])

  const commit = () => {
    const parsed = Number.parseInt(value, 10)
    if (!Number.isFinite(parsed)) {
      setValue(String(page))
      return
    }

    const nextPage = Math.min(totalPages, Math.max(1, parsed))
    setValue(String(nextPage))

    if (nextPage !== page) {
      onNavigate(nextPage)
    }
  }

  return (
    <div className="flex items-center gap-1.5 tabular-nums text-[#696e77]">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        disabled={disabled}
        onChange={(event) =>
          setValue(event.target.value.replace(/\D/g, "").slice(0, 4))
        }
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            commit()
          }
        }}
        aria-label="Ir a página"
        className="h-7 w-10 rounded-md border border-[#edeef0] bg-white text-center text-xs text-[#43484e] focus-visible:border-[#ff7433] focus-visible:outline-none disabled:opacity-50"
      />
      <span>/ {totalPages}</span>
    </div>
  )
}

export function UsuariosView({
  result,
  initialSearch,
  initialStatuses,
}: UsuariosViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filtersValue: UsuariosFiltersValue = { statuses: initialStatuses }
  const hasActiveFilters = hasActiveUsuariosFilters(initialStatuses)

  useEffect(() => {
    setSearchInput(initialSearch)
  }, [initialSearch])

  const navigate = (options: {
    page?: number
    q?: string
    statuses?: BackofficeUsersStatusKind[]
  }) => {
    const href = `${pathname}${buildUsuariosQueryString({
      page: options.page,
      q: options.q ?? searchInput,
      statuses: options.statuses ?? initialStatuses,
    })}`

    startTransition(() => {
      router.push(href)
    })
  }

  const applyFilters = (value: UsuariosFiltersValue) => {
    navigate({
      page: 1,
      statuses: value.statuses,
    })
  }

  const removeStatus = (status: BackofficeUsersStatusKind) => {
    navigate({
      page: 1,
      statuses: initialStatuses.filter((item) => item !== status),
    })
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (searchInput.trim() === initialSearch.trim()) return

      startTransition(() => {
        router.push(
          `${pathname}${buildUsuariosQueryString({
            page: 1,
            q: searchInput,
            statuses: initialStatuses,
          })}`,
        )
      })
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [searchInput, initialSearch, initialStatuses, pathname, router])

  const rangeStart =
    result.totalCount === 0 ? 0 : (result.page - 1) * result.pageSize + 1
  const rangeEnd = Math.min(result.page * result.pageSize, result.totalCount)

  return (
    <div className="min-w-0 px-6 py-10 lg:px-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-recoleta text-[28px] leading-[1.05] text-[#272a2d]">
          Usuarios
        </h1>
        <NuevoUsuarioButton
          disabled={isPending}
          onClick={() => setCreateUserOpen(true)}
        />
      </div>

      <NuevoUsuarioDialog
        open={createUserOpen}
        onOpenChange={setCreateUserOpen}
      />

      <UsuariosFiltersDialog
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={filtersValue}
        onApply={applyFilters}
      />

      <div className="pt-6">
        <div
          className={cn(
            "overflow-hidden rounded-[14px] border border-[#edeef0] bg-white shadow-[0_0_5px_rgba(243,103,31,0.08)] transition-opacity",
            isPending && "opacity-70",
          )}
        >
          <div className="flex flex-wrap items-center gap-3 border-b border-[#f4f5f6] px-4 py-3">
            <UsuariosAppliedFilters
              statuses={initialStatuses}
              disabled={isPending}
              onRemoveStatus={removeStatus}
            />

            <div className="ml-auto flex shrink-0 items-center gap-3">
              <UsuariosFiltersButton
                hasActiveFilters={hasActiveFilters}
                disabled={isPending}
                onClick={() => setFiltersOpen(true)}
              />

              <label className="relative block w-full min-w-[220px] max-w-[300px]">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#696e77]"
                strokeWidth={1.75}
                aria-hidden
              />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar por nombre, mail o empresa..."
                className="h-10 w-full rounded-xl border border-[#edeef0] bg-white py-2 pl-10 pr-3 text-sm leading-5 text-[#18191b] placeholder:text-[#777b84] focus-visible:border-[#ff7433] focus-visible:outline-none"
              />
            </label>
            </div>
          </div>

          <div className="min-w-0">
            <div className="w-full">
              <div className={TABLE_HEADER_ROW}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="size-[28px] shrink-0" aria-hidden />
                  <p className={TABLE_HEADER_CELL}>Usuario</p>
                </div>
                {TABLE_HEADERS.map((label) => (
                  <p key={label} className={cn(TABLE_CELL, TABLE_HEADER_CELL)}>
                    {label}
                  </p>
                ))}
                <span className="size-8 shrink-0 px-2" aria-hidden />
              </div>

              {result.users.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm leading-[1.4] text-[#696e77]">
                  No hay usuarios que coincidan con la búsqueda.
                </div>
              ) : (
                result.users.map((user) => (
                  <div key={user.id} className={TABLE_BODY_ROW}>
                    <div className="flex min-w-0 items-start gap-2.5">
                      <UserAvatar
                        firstName={user.firstName}
                        lastName={user.lastName}
                        email={user.email}
                        avatarUrl={user.avatarUrl}
                        size={28}
                        bgClassName="bg-[#edeef0]"
                        textClassName="text-[11px] font-semibold text-[#5a6169]"
                      />
                      <div className="min-w-0">
                        <p className={TABLE_BODY_EMPHASIS}>{fullName(user)}</p>
                        <div className="pt-1">
                          <StatusBadge active={user.isActive} />
                        </div>
                      </div>
                    </div>

                    <p className={cn(TABLE_CELL, TABLE_BODY_TEXT)}>{user.email}</p>

                    <p className={cn(TABLE_CELL, TABLE_BODY_TEXT)}>
                      {user.phone?.trim() || "—"}
                    </p>

                    <div className={cn(TABLE_CELL, "min-w-0")}>
                      <p className={TABLE_BODY_TEXT}>{primaryCompanyLabel(user)}</p>
                      {user.memberships.length > 0 ? (
                        <p className={cn(TABLE_BODY_MUTED, "pt-0.5")}>
                          {user.memberships.length}{" "}
                          {user.memberships.length === 1 ? "empresa" : "empresas"}
                        </p>
                      ) : null}
                    </div>

                    <p className={cn(TABLE_CELL, TABLE_BODY_TEXT)}>
                      {formatCollaborationProjectCount(user.collaborationProjectCount)}
                    </p>

                    <p className={cn(TABLE_CELL, TABLE_BODY_DATE)}>
                      {formatArgentinaTableDate(user.createdAt)}
                    </p>

                    <UserRowActions user={user} disabled={isPending} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f4f5f6] px-4 py-3">
            <p className="text-xs leading-4 text-[#777b84]">
              {result.totalCount === 0 ? (
                <>0 usuarios · {result.activeCount} confirmados en total</>
              ) : (
                <>
                  Mostrando {rangeStart}–{rangeEnd} de {result.totalCount}{" "}
                  {result.totalCount === 1 ? "usuario" : "usuarios"} ·{" "}
                  {result.activeCount} confirmados en total
                </>
              )}
            </p>

            {result.totalCount > 0 ? (
              <div className="flex items-center gap-3 text-xs leading-4 text-[#777b84]">
                <button
                  type="button"
                  onClick={() => navigate({ page: result.page - 1 })}
                  disabled={isPending || result.page <= 1}
                  className="inline-flex items-center gap-1 text-[#43484e] transition-colors hover:text-[#18191b] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="size-3.5" strokeWidth={1.75} />
                  Anterior
                </button>

                <UsuariosPageJump
                  page={result.page}
                  totalPages={result.totalPages}
                  disabled={isPending}
                  onNavigate={(page) => navigate({ page })}
                />

                <button
                  type="button"
                  onClick={() => navigate({ page: result.page + 1 })}
                  disabled={isPending || result.page >= result.totalPages}
                  className="inline-flex items-center gap-1 text-[#43484e] transition-colors hover:text-[#18191b] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                  <ChevronRight className="size-3.5" strokeWidth={1.75} />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
