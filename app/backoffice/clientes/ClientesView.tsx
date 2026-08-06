"use client"

import { useEffect, useState, useTransition } from "react"
import { Building2, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import {
  type BackofficeClienteRow,
  type BackofficeClientesResult,
} from "@/app/backoffice/clientes/actions"
import { UserAvatar } from "@/components/user/UserAvatar"
import {
  formatClienteStatusBreakdown,
  formatClienteUsd,
} from "@/lib/backoffice/clientesBilling"
import { cn } from "@/lib/utils"

type ClientesViewProps = {
  result: BackofficeClientesResult
  initialSearch: string
}

const TABLE_GRID =
  "grid w-full grid-cols-[minmax(220px,1.25fr)_minmax(140px,1fr)_88px_minmax(200px,1.35fr)_minmax(160px,1fr)_minmax(128px,auto)_minmax(108px,auto)]"

const TABLE_CELL = "min-w-0 px-3"
const TABLE_HEADER_CELL = "text-xs font-medium leading-4 text-[#777b84]"
const TABLE_BODY_EMPHASIS =
  "truncate text-sm font-medium leading-5 text-[#18191b]"
const TABLE_BODY_TEXT = "text-sm leading-5 text-[#363a3f]"
const TABLE_BODY_MUTED = "truncate text-xs leading-4 text-[#777b84]"

const TABLE_HEADER_ROW = cn(
  TABLE_GRID,
  "h-[35px] shrink-0 items-center border-b border-[#f4f5f6] px-4",
)

const TABLE_BODY_ROW = cn(
  TABLE_GRID,
  "items-start border-b border-[#edeef0] px-4 py-3 last:border-b-0",
)

function buildClientesQueryString(options: { page?: number; q?: string }) {
  const params = new URLSearchParams()

  if (options.page && options.page > 1) {
    params.set("page", String(options.page))
  }

  if (options.q?.trim()) {
    params.set("q", options.q.trim())
  }

  const query = params.toString()
  return query ? `?${query}` : ""
}

function ClienteRow({ client }: { client: BackofficeClienteRow }) {
  return (
    <>
      <div className={cn(TABLE_CELL, "flex min-w-0 items-start gap-3")}>
        {client.owner ? (
          <UserAvatar
            firstName={client.owner.firstName}
            lastName={client.owner.lastName}
            email={client.owner.email}
            avatarUrl={client.owner.avatarUrl}
            size={28}
            bgClassName="bg-[#edeef0]"
            textClassName="text-[11px] font-semibold text-[#5a6169]"
          />
        ) : (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#edeef0] text-[#5a6169]">
            <Building2 className="size-3.5" strokeWidth={1.75} />
          </div>
        )}
        <div className="min-w-0 pt-0.5">
          <p className={TABLE_BODY_EMPHASIS}>
            {client.owner?.name ?? "Sin owner"}
          </p>
          {client.owner ? (
            <p className={cn(TABLE_BODY_MUTED, "pt-0.5")}>{client.owner.email}</p>
          ) : null}
        </div>
      </div>

      <div className={cn(TABLE_CELL, "min-w-0 pt-0.5")}>
        <p className={TABLE_BODY_EMPHASIS}>{client.companyName}</p>
      </div>

      <div className={cn(TABLE_CELL, "pt-0.5 text-right")}>
        <p className={cn(TABLE_BODY_TEXT, "tabular-nums")}>{client.projectCount}</p>
      </div>

      <div className={cn(TABLE_CELL, "min-w-0 pt-0.5")}>
        {client.planBreakdown.length === 0 ? (
          <p className={TABLE_BODY_TEXT}>Sin planes</p>
        ) : (
          <div className="flex flex-col gap-1">
            {client.planBreakdown.map((item) => (
              <p
                key={item.label}
                className="whitespace-nowrap text-sm leading-5 text-[#363a3f]"
              >
                {item.label} · {item.count}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className={cn(TABLE_CELL, "min-w-0 pt-0.5")}>
        <p className="whitespace-normal text-sm leading-5 text-[#363a3f]">
          {formatClienteStatusBreakdown(client.statusBreakdown)}
        </p>
      </div>

      <div className={cn(TABLE_CELL, "pt-0.5 text-right")}>
        <p className="whitespace-nowrap text-sm leading-5 tabular-nums text-[#363a3f]">
          {formatClienteUsd(client.monthlyPaymentUsd)}
          {client.monthlyPaymentUsd > 0 ? (
            <span className="text-[#777b84]"> / mes</span>
          ) : null}
        </p>
      </div>

      <div className={cn(TABLE_CELL, "pt-0.5 text-right")}>
        <p
          className={cn(
            "whitespace-nowrap text-sm leading-5 tabular-nums",
            client.debtUsd > 0 ? "font-medium text-[#dc3e42]" : "text-[#363a3f]",
          )}
        >
          {formatClienteUsd(client.debtUsd)}
        </p>
      </div>
    </>
  )
}

function ClientesPageJump({
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

export function ClientesView({ result, initialSearch }: ClientesViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [searchInput, setSearchInput] = useState(initialSearch)

  useEffect(() => {
    setSearchInput(initialSearch)
  }, [initialSearch])

  const navigate = (options: { page?: number; q?: string }) => {
    const href = `${pathname}${buildClientesQueryString({
      page: options.page,
      q: options.q ?? searchInput,
    })}`

    startTransition(() => {
      router.push(href)
    })
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (searchInput.trim() === initialSearch.trim()) return

      startTransition(() => {
        router.push(
          `${pathname}${buildClientesQueryString({
            page: 1,
            q: searchInput,
          })}`,
        )
      })
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [searchInput, initialSearch, pathname, router])

  const rangeStart =
    result.totalCount === 0 ? 0 : (result.page - 1) * result.pageSize + 1
  const rangeEnd = Math.min(result.page * result.pageSize, result.totalCount)

  return (
    <div className="min-w-0 px-6 py-10 lg:px-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-recoleta text-[28px] leading-[1.05] text-[#272a2d]">
            Clientes
          </h1>
          <p className="pt-1 text-sm leading-5 text-[#777b84]">
            Empresas con su owner, proyectos, planes y facturación consolidada.
          </p>
        </div>
      </div>

      <div className="pt-6">
        <div
          className={cn(
            "overflow-hidden rounded-[14px] border border-[#edeef0] bg-white shadow-[0_0_5px_rgba(243,103,31,0.08)] transition-opacity",
            isPending && "opacity-70",
          )}
        >
          <div className="flex flex-wrap items-center gap-3 border-b border-[#f4f5f6] px-4 py-3">
            <div className="ml-auto flex shrink-0 items-center gap-3">
              <label className="relative block w-full min-w-[220px] max-w-[320px]">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#696e77]"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Buscar por cliente, empresa o proyecto..."
                  className="h-10 w-full rounded-xl border border-[#edeef0] bg-white py-2 pl-10 pr-3 text-sm leading-5 text-[#18191b] placeholder:text-[#777b84] focus-visible:border-[#ff7433] focus-visible:outline-none"
                />
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[1080px]">
              <div className={TABLE_HEADER_ROW}>
                <div className={cn(TABLE_CELL, "flex min-w-0 items-center gap-3")}>
                  <span className="size-7 shrink-0" aria-hidden />
                  <p className={TABLE_HEADER_CELL}>Cliente</p>
                </div>
                <p className={cn(TABLE_CELL, TABLE_HEADER_CELL)}>Empresa</p>
                <p className={cn(TABLE_CELL, TABLE_HEADER_CELL, "text-right")}>
                  Proyectos
                </p>
                <p className={cn(TABLE_CELL, TABLE_HEADER_CELL)}>Planes</p>
                <p className={cn(TABLE_CELL, TABLE_HEADER_CELL)}>Estado</p>
                <p className={cn(TABLE_CELL, TABLE_HEADER_CELL, "text-right")}>
                  Pago mensual
                </p>
                <p className={cn(TABLE_CELL, TABLE_HEADER_CELL, "text-right")}>
                  Deuda
                </p>
              </div>

              {result.clients.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm leading-5 text-[#696e77]">
                  No hay clientes que coincidan con la búsqueda.
                </div>
              ) : (
                result.clients.map((client) => (
                  <div key={client.companyId} className={TABLE_BODY_ROW}>
                    <ClienteRow client={client} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f4f5f6] px-4 py-3">
            <p className="text-xs leading-4 text-[#777b84]">
              {result.totalCount === 0 ? (
                <>0 clientes</>
              ) : (
                <>
                  Mostrando {rangeStart}–{rangeEnd} de {result.totalCount}{" "}
                  {result.totalCount === 1 ? "cliente" : "clientes"}
                  {result.totalMonthlyPaymentUsd > 0 || result.totalDebtUsd > 0 ? (
                    <>
                      {" "}
                      · {formatClienteUsd(result.totalMonthlyPaymentUsd)} / mes en
                      página
                      {result.totalDebtUsd > 0 ? (
                        <>
                          {" "}
                          · {formatClienteUsd(result.totalDebtUsd)} deuda en página
                        </>
                      ) : null}
                    </>
                  ) : null}
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

                <ClientesPageJump
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
