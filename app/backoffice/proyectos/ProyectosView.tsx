"use client"

import { useEffect, useState, useTransition } from "react"
import {
  ChevronLeft,
  ChevronRight,
  HardHat,
  MoreHorizontal,
  Search,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import {
  cancelBackofficeProjectSubscription,
  deleteBackofficeProject,
  type BackofficeProjectRow,
  type BackofficeProjectsResult,
} from "@/app/backoffice/proyectos/actions"
import {
  NuevoProyectoButton,
  ProyectoFormDialog,
} from "@/app/backoffice/proyectos/ProyectoFormDialog"
import { ProjectBillingDialog } from "@/app/backoffice/proyectos/ProjectBillingDialog"
import {
  ProyectosAppliedFilters,
  ProyectosFiltersButton,
  ProyectosFiltersDialog,
  type ProyectosFiltersValue,
} from "@/app/backoffice/proyectos/ProyectosFiltersDialog"
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatArgentinaTableDate } from "@/lib/datetime/argentinaDateTime"
import type { BackofficeProjectStatusKind } from "@/lib/backoffice/proyectosQuery"
import {
  hasActiveProyectosFilters,
  serializeBackofficeProyectosPlanSlugFilters,
  serializeBackofficeProyectosStatusFilters,
} from "@/lib/backoffice/proyectosQuery"
import {
  formatBillingDebtUsd,
  formatBillingUsd,
} from "@/lib/backoffice/subscriptionBilling"
import { formatBillingIntervalLabel } from "@/lib/backoffice/projectSubscriptionForm"
import { getBackofficeStatusFilterLabel } from "@/lib/backoffice/proyectosFilters"
import { cn } from "@/lib/utils"

type ProyectosViewProps = {
  result: BackofficeProjectsResult
  initialSearch: string
  initialPlanSlugs: string[]
  initialStatuses: BackofficeProjectStatusKind[]
}

const TABLE_GRID =
  "grid grid-cols-[minmax(160px,1fr)_minmax(140px,1fr)_minmax(140px,1fr)_100px_minmax(180px,1fr)_minmax(112px,0.8fr)_minmax(108px,0.8fr)_minmax(96px,auto)_72px_minmax(112px,auto)_56px] items-start"

const TABLE_CELL = "min-w-0 px-3"
const TABLE_HEADER_CELL = "text-xs font-medium leading-4 text-[#777b84]"
const TABLE_BODY_EMPHASIS =
  "truncate text-sm font-medium leading-5 text-[#18191b]"
const TABLE_BODY_TEXT = "truncate text-sm leading-5 text-[#363a3f]"
const TABLE_BODY_DATE =
  "whitespace-nowrap text-sm leading-5 text-[#363a3f] tabular-nums"

const TABLE_HEADER_ROW = cn(
  TABLE_GRID,
  "h-[35px] shrink-0 items-center border-b border-[#f4f5f6] px-4",
)

const TABLE_BODY_ROW = cn(
  TABLE_GRID,
  "items-start border-b border-[#edeef0] px-4 py-3 last:border-b-0",
)

const TABLE_HEADERS = [
  "Empresa",
  "Ubicación",
  "Superficie",
  "Plan",
  "Importe",
  "Por cobrar",
  "Deuda",
  "Miembros",
  "Alta",
] as const

const SUBSCRIPTION_STATUS_STYLES: Record<
  BackofficeProjectStatusKind,
  { container: string; dot: string }
> = {
  active: {
    container: "border-[#acdec8] bg-[#f4fbf7] text-[#208368]",
    dot: "bg-[#208368]",
  },
  inactive: {
    container: "border-[#edeef0] bg-[#f4f5f6] text-[#696e77]",
    dot: "bg-[#afb3ba]",
  },
  expired: {
    container: "border-[#ffd0a6] bg-[#fff7ed] text-[#c2410c]",
    dot: "bg-[#ea580c]",
  },
  disabled: {
    container: "border-[#f5c2c7] bg-[#fff5f5] text-[#c92a2a]",
    dot: "bg-[#e03131]",
  },
}

function SubscriptionStatusBadge({
  status,
}: {
  status: BackofficeProjectStatusKind
}) {
  const styles = SUBSCRIPTION_STATUS_STYLES[status]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium leading-4",
        styles.container,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", styles.dot)} />
      {getBackofficeStatusFilterLabel(status)}
    </span>
  )
}

function formatSurface(value: number | null): string {
  if (value == null) return "—"
  return `${new Intl.NumberFormat("es-AR").format(value)} m²`
}

function buildProyectosQueryString(options: {
  page?: number
  q?: string
  planSlugs?: string[]
  statuses?: BackofficeProjectStatusKind[]
}) {
  const params = new URLSearchParams()

  if (options.page && options.page > 1) {
    params.set("page", String(options.page))
  }

  if (options.q?.trim()) {
    params.set("q", options.q.trim())
  }

  const planSlugParam = serializeBackofficeProyectosPlanSlugFilters(
    options.planSlugs ?? [],
  )
  if (planSlugParam) {
    params.set("planSlug", planSlugParam)
  }

  const statusParam = serializeBackofficeProyectosStatusFilters(options.statuses ?? [])
  if (statusParam) {
    params.set("status", statusParam)
  }

  const query = params.toString()
  return query ? `?${query}` : ""
}

function ProjectRowActions({
  project,
  disabled,
  onEdit,
  onBilling,
}: {
  project: BackofficeProjectRow
  disabled?: boolean
  onEdit: () => void
  onBilling: () => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [cancelSubscriptionOpen, setCancelSubscriptionOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isDeleting, startDelete] = useTransition()
  const [isCancellingSubscription, startCancelSubscription] = useTransition()

  const canCancelSubscription =
    project.planName != null && project.subscriptionStatus !== "disabled"
  const isActionPending = isDeleting || isCancellingSubscription

  const handleDelete = () => {
    setActionError(null)

    startDelete(async () => {
      const result = await deleteBackofficeProject(project.id)

      if (!result.ok) {
        setActionError(result.error)
        return
      }

      setDeleteOpen(false)
      setOpen(false)
      router.refresh()
    })
  }

  const handleCancelSubscription = () => {
    setActionError(null)

    startCancelSubscription(async () => {
      const result = await cancelBackofficeProjectSubscription(project.id)

      if (!result.ok) {
        setActionError(result.error)
        return
      }

      setCancelSubscriptionOpen(false)
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
              disabled={disabled || isActionPending}
              className="grid size-8 place-items-center rounded-lg text-[#777b84] transition-colors hover:bg-[#f4f5f6] hover:text-[#363a3f] disabled:opacity-50"
              aria-label={`Acciones para ${project.name}`}
            >
              <MoreHorizontal className="size-4" strokeWidth={1.75} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={6}
            className="w-52 border-[#edeef0] p-1 shadow-[0_0_10px_rgba(243,103,31,0.08)]"
          >
            <button
              type="button"
              disabled={isActionPending}
              onClick={() => {
                setActionError(null)
                setOpen(false)
                onEdit()
              }}
              className="flex h-9 w-full items-center rounded-md px-3 text-left text-sm text-[#363a3f] transition-colors hover:bg-[#f4f5f6] disabled:opacity-50"
            >
              Editar
            </button>
            <button
              type="button"
              disabled={isActionPending}
              onClick={() => {
                setActionError(null)
                setOpen(false)
                onBilling()
              }}
              className="flex h-9 w-full items-center rounded-md px-3 text-left text-sm text-[#363a3f] transition-colors hover:bg-[#f4f5f6] disabled:opacity-50"
            >
              Facturación
            </button>
            <button
              type="button"
              disabled={isActionPending || !canCancelSubscription}
              onClick={() => {
                setActionError(null)
                setCancelSubscriptionOpen(true)
              }}
              className="flex h-9 w-full items-center rounded-md px-3 text-left text-sm text-[#363a3f] transition-colors hover:bg-[#f4f5f6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar subscripción
            </button>
            <button
              type="button"
              disabled={isActionPending}
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
        open={cancelSubscriptionOpen}
        onOpenChange={setCancelSubscriptionOpen}
        title="Cancelar subscripción"
        description={`¿Cancelar la subscripción de ${project.name}? El proyecto pasará a estado Cancelado.`}
        confirmLabel="Cancelar subscripción"
        loading={isCancellingSubscription}
        loadingLabel="Cancelando..."
        onConfirm={handleCancelSubscription}
      />

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar proyecto"
        description={`¿Eliminar ${project.name}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={isDeleting}
        loadingLabel="Eliminando..."
        onConfirm={handleDelete}
      />
    </>
  )
}

function ProyectosPageJump({
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

export function ProyectosView({
  result,
  initialSearch,
  initialPlanSlugs,
  initialStatuses,
}: ProyectosViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [formOpen, setFormOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<BackofficeProjectRow | null>(
    null,
  )
  const [billingProject, setBillingProject] = useState<BackofficeProjectRow | null>(
    null,
  )
  const [billingOpen, setBillingOpen] = useState(false)

  const filtersValue: ProyectosFiltersValue = {
    planSlugs: initialPlanSlugs,
    statuses: initialStatuses,
  }

  const hasActiveFilters = hasActiveProyectosFilters(
    initialPlanSlugs,
    initialStatuses,
  )

  useEffect(() => {
    setSearchInput(initialSearch)
  }, [initialSearch])

  const navigate = (options: {
    page?: number
    q?: string
    planSlugs?: string[]
    statuses?: BackofficeProjectStatusKind[]
  }) => {
    const href = `${pathname}${buildProyectosQueryString({
      page: options.page,
      q: options.q ?? searchInput,
      planSlugs: options.planSlugs ?? initialPlanSlugs,
      statuses: options.statuses ?? initialStatuses,
    })}`

    startTransition(() => {
      router.push(href)
    })
  }

  const applyFilters = (value: ProyectosFiltersValue) => {
    navigate({
      page: 1,
      planSlugs: value.planSlugs,
      statuses: value.statuses,
    })
  }

  const removePlanSlug = (slug: string) => {
    navigate({
      page: 1,
      planSlugs: initialPlanSlugs.filter((item) => item !== slug),
    })
  }

  const removeStatus = (status: BackofficeProjectStatusKind) => {
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
          `${pathname}${buildProyectosQueryString({
            page: 1,
            q: searchInput,
            planSlugs: initialPlanSlugs,
            statuses: initialStatuses,
          })}`,
        )
      })
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [
    searchInput,
    initialSearch,
    initialPlanSlugs,
    initialStatuses,
    pathname,
    router,
  ])

  const rangeStart =
    result.totalCount === 0 ? 0 : (result.page - 1) * result.pageSize + 1
  const rangeEnd = Math.min(result.page * result.pageSize, result.totalCount)

  const openCreate = () => {
    setEditingProject(null)
    setFormOpen(true)
  }

  const openEdit = (project: BackofficeProjectRow) => {
    setEditingProject(project)
    setFormOpen(true)
  }

  const openBilling = (project: BackofficeProjectRow) => {
    setBillingProject(project)
    setBillingOpen(true)
  }

  return (
    <div className="min-w-0 px-6 py-10 lg:px-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-recoleta text-[28px] leading-[1.05] text-[#272a2d]">
          Proyectos
        </h1>
        <NuevoProyectoButton disabled={isPending} onClick={openCreate} />
      </div>

      <ProyectoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editingProject}
      />

      <ProjectBillingDialog
        project={billingProject}
        open={billingOpen}
        onOpenChange={(open) => {
          setBillingOpen(open)
          if (!open) setBillingProject(null)
        }}
      />

      <ProyectosFiltersDialog
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
            <ProyectosAppliedFilters
              planSlugs={initialPlanSlugs}
              statuses={initialStatuses}
              disabled={isPending}
              onRemovePlanSlug={removePlanSlug}
              onRemoveStatus={removeStatus}
            />

            <div className="ml-auto flex shrink-0 items-center gap-3">
              <ProyectosFiltersButton
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
                placeholder="Buscar por nombre, empresa o ubicación..."
                className="h-10 w-full rounded-xl border border-[#edeef0] bg-white py-2 pl-10 pr-3 text-sm leading-5 text-[#18191b] placeholder:text-[#777b84] focus-visible:border-[#ff7433] focus-visible:outline-none"
              />
            </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              <div className={TABLE_HEADER_ROW}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="size-7 shrink-0" aria-hidden />
                  <p className={TABLE_HEADER_CELL}>Proyecto</p>
                </div>
                {TABLE_HEADERS.map((label) => (
                  <p key={label} className={cn(TABLE_CELL, TABLE_HEADER_CELL)}>
                    {label}
                  </p>
                ))}
                <span className="size-8 shrink-0 px-2" aria-hidden />
              </div>

              {result.projects.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm leading-5 text-[#696e77]">
                  No hay proyectos que coincidan con la búsqueda.
                </div>
              ) : (
                result.projects.map((project) => (
                  <div key={project.id} className={TABLE_BODY_ROW}>
                    <div className="flex min-w-0 items-start gap-2.5">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#edeef0] text-[#5a6169]">
                        <HardHat className="size-3.5" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <p className={TABLE_BODY_EMPHASIS}>{project.name}</p>
                        <div className="pt-1">
                          <SubscriptionStatusBadge
                            status={project.subscriptionStatus}
                          />
                        </div>
                      </div>
                    </div>

                    <p className={cn(TABLE_CELL, TABLE_BODY_TEXT)}>
                      {project.company?.name ?? "—"}
                    </p>

                    <p className={cn(TABLE_CELL, TABLE_BODY_TEXT)}>
                      {project.location?.trim() || "—"}
                    </p>

                    <p className={cn(TABLE_CELL, TABLE_BODY_TEXT, "tabular-nums")}>
                      {formatSurface(project.totalSurfaceM2)}
                    </p>

                    <div className={cn(TABLE_CELL, "min-w-0")}>
                      <p className={TABLE_BODY_TEXT}>
                        {project.planLabel ?? project.planName ?? "Sin plan"}
                      </p>
                      {formatBillingIntervalLabel(project.billingInterval) ? (
                        <p className="pt-0.5 text-xs leading-4 text-[#777b84]">
                          {formatBillingIntervalLabel(project.billingInterval)}
                        </p>
                      ) : null}
                    </div>

                    <p className={cn(TABLE_CELL, TABLE_BODY_TEXT, "tabular-nums")}>
                      {project.amountUsd && project.amountUsd > 0
                        ? `${formatBillingUsd(project.amountUsd)} / mes`
                        : "—"}
                    </p>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => openBilling(project)}
                      className={cn(
                        TABLE_CELL,
                        "text-left text-sm leading-5 tabular-nums transition-colors hover:text-[#ff7433] disabled:opacity-50",
                        project.porCobrarUsd > 0
                          ? "font-medium text-[#c2410c]"
                          : "text-[#696e77]",
                      )}
                      title="Ver facturación"
                    >
                      {formatBillingDebtUsd(project.porCobrarUsd)}
                    </button>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => openBilling(project)}
                      className={cn(
                        TABLE_CELL,
                        "text-left text-sm leading-5 tabular-nums transition-colors hover:text-[#ff7433] disabled:opacity-50",
                        project.debtUsd > 0
                          ? "font-medium text-[#dc3e42]"
                          : "text-[#696e77]",
                      )}
                      title="Ver facturación"
                    >
                      {formatBillingDebtUsd(project.debtUsd)}
                    </button>

                    <p className={cn(TABLE_CELL, TABLE_BODY_TEXT, "tabular-nums")}>
                      {project.memberCount}
                    </p>

                    <p className={cn(TABLE_CELL, TABLE_BODY_DATE)}>
                      {formatArgentinaTableDate(project.createdAt)}
                    </p>

                    <ProjectRowActions
                      project={project}
                      disabled={isPending}
                      onEdit={() => openEdit(project)}
                      onBilling={() => openBilling(project)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f4f5f6] px-4 py-3">
            <p className="text-xs leading-4 text-[#777b84]">
              {result.totalCount === 0 ? (
                <>0 proyectos</>
              ) : (
                <>
                  Mostrando {rangeStart}–{rangeEnd} de {result.totalCount}{" "}
                  {result.totalCount === 1 ? "proyecto" : "proyectos"}
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

                <ProyectosPageJump
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
