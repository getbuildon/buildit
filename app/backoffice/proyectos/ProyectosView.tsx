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
  deleteBackofficeProject,
  type BackofficeProjectRow,
  type BackofficeProjectsResult,
} from "@/app/backoffice/proyectos/actions"
import {
  NuevoProyectoButton,
  ProyectoFormDialog,
} from "@/app/backoffice/proyectos/ProyectoFormDialog"
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatArgentinaTaskDate } from "@/lib/datetime/argentinaDateTime"
import type {
  BackofficeProjectsPlanFilter,
  BackofficeProjectsStatusFilter,
} from "@/lib/backoffice/proyectosQuery"
import { cn } from "@/lib/utils"

type ProyectosViewProps = {
  result: BackofficeProjectsResult
  initialSearch: string
  initialPlan: BackofficeProjectsPlanFilter
  initialStatus: BackofficeProjectsStatusFilter
}

const TABLE_GRID =
  "grid grid-cols-[minmax(160px,1fr)_minmax(140px,1fr)_minmax(140px,1fr)_100px_100px_120px_72px_100px_56px] items-start"

const TABLE_CELL = "min-w-0 px-3"
const TABLE_HEADER_CELL = "text-xs font-medium leading-4 text-[#777b84]"
const TABLE_BODY_EMPHASIS =
  "truncate text-sm font-medium leading-5 text-[#18191b]"
const TABLE_BODY_TEXT = "truncate text-sm leading-5 text-[#363a3f]"

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
  "Estado",
  "Superficie",
  "Plan",
  "Miembros",
  "Alta",
] as const

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  active: "Activo",
  paused: "Pausado",
  completed: "Completado",
  archived: "Archivado",
}

function formatSurface(value: number | null): string {
  if (value == null) return "—"
  return `${new Intl.NumberFormat("es-AR").format(value)} m²`
}

function formatStatus(status: string): string {
  return STATUS_LABELS[status] ?? status
}

function buildProyectosQueryString(options: {
  page?: number
  q?: string
  plan?: BackofficeProjectsPlanFilter
  status?: BackofficeProjectsStatusFilter
}) {
  const params = new URLSearchParams()

  if (options.page && options.page > 1) {
    params.set("page", String(options.page))
  }

  if (options.q?.trim()) {
    params.set("q", options.q.trim())
  }

  if (options.plan && options.plan !== "all") {
    params.set("plan", options.plan)
  }

  if (options.status && options.status !== "all") {
    params.set("status", options.status)
  }

  const query = params.toString()
  return query ? `?${query}` : ""
}

function FilterTabs<T extends string>({
  value,
  onChange,
  disabled,
  tabs,
  ariaLabel,
}: {
  value: T
  onChange: (value: T) => void
  disabled?: boolean
  tabs: { id: T; label: string }[]
  ariaLabel: string
}) {
  return (
    <div className="flex items-center gap-1.5" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const selected = value === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              "rounded-[7px] px-2.5 py-1.5 text-xs font-medium leading-4 transition-colors disabled:opacity-60",
              selected
                ? "bg-[#111113] text-white"
                : "text-[#777b84] hover:text-[#363a3f]",
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

const PLAN_FILTER_TABS: { id: BackofficeProjectsPlanFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "compacto", label: "Compacto" },
  { id: "gran-escala", label: "Gran Escala" },
  { id: "multiobra", label: "Multiobra" },
]

const STATUS_FILTER_TABS: { id: BackofficeProjectsStatusFilter; label: string }[] =
  [
    { id: "all", label: "Todos" },
    { id: "active", label: "Activo" },
    { id: "inactive", label: "Inactivo" },
  ]

function ProjectRowActions({
  project,
  disabled,
  onEdit,
}: {
  project: BackofficeProjectRow
  disabled?: boolean
  onEdit: () => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isDeleting, startDelete] = useTransition()

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

  return (
    <>
      <div className="flex shrink-0 items-start justify-center px-2 pt-0.5">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled || isDeleting}
              className="grid size-8 place-items-center rounded-lg text-[#777b84] transition-colors hover:bg-[#f4f5f6] hover:text-[#363a3f] disabled:opacity-50"
              aria-label={`Acciones para ${project.name}`}
            >
              <MoreHorizontal className="size-4" strokeWidth={1.75} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={6}
            className="w-44 border-[#edeef0] p-1 shadow-[0_0_10px_rgba(243,103,31,0.08)]"
          >
            <button
              type="button"
              disabled={isDeleting}
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
              disabled={isDeleting}
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
  initialPlan,
  initialStatus,
}: ProyectosViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [formOpen, setFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<BackofficeProjectRow | null>(
    null,
  )

  useEffect(() => {
    setSearchInput(initialSearch)
  }, [initialSearch])

  const navigate = (options: {
    page?: number
    q?: string
    plan?: BackofficeProjectsPlanFilter
    status?: BackofficeProjectsStatusFilter
  }) => {
    const href = `${pathname}${buildProyectosQueryString({
      page: options.page,
      q: options.q ?? searchInput,
      plan: options.plan ?? initialPlan,
      status: options.status ?? initialStatus,
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
          `${pathname}${buildProyectosQueryString({
            page: 1,
            q: searchInput,
            plan: initialPlan,
            status: initialStatus,
          })}`,
        )
      })
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [searchInput, initialSearch, initialPlan, initialStatus, pathname, router])

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

      <div className="pt-6">
        <div
          className={cn(
            "overflow-hidden rounded-[14px] border border-[#edeef0] bg-white shadow-[0_0_5px_rgba(243,103,31,0.08)] transition-opacity",
            isPending && "opacity-70",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f4f5f6] px-4 py-3">
            <div className="flex flex-wrap items-center gap-4">
              <FilterTabs
                value={initialPlan}
                disabled={isPending}
                tabs={PLAN_FILTER_TABS}
                ariaLabel="Filtrar por tipo de plan"
                onChange={(plan) => navigate({ page: 1, plan })}
              />
              <FilterTabs
                value={initialStatus}
                disabled={isPending}
                tabs={STATUS_FILTER_TABS}
                ariaLabel="Filtrar por estado"
                onChange={(status) => navigate({ page: 1, status })}
              />
            </div>

            <label className="relative block w-full max-w-[300px]">
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

          <div className="overflow-x-auto">
            <div className="min-w-[1080px]">
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
                      </div>
                    </div>

                    <p className={cn(TABLE_CELL, TABLE_BODY_TEXT)}>
                      {project.company?.name ?? "—"}
                    </p>

                    <p className={cn(TABLE_CELL, TABLE_BODY_TEXT)}>
                      {project.location?.trim() || "—"}
                    </p>

                    <p className={cn(TABLE_CELL, TABLE_BODY_TEXT)}>
                      {formatStatus(project.status)}
                    </p>

                    <p className={cn(TABLE_CELL, TABLE_BODY_TEXT, "tabular-nums")}>
                      {formatSurface(project.totalSurfaceM2)}
                    </p>

                    <p className={cn(TABLE_CELL, TABLE_BODY_TEXT)}>
                      {project.planName ?? "Sin plan"}
                    </p>

                    <p className={cn(TABLE_CELL, TABLE_BODY_TEXT, "tabular-nums")}>
                      {project.memberCount}
                    </p>

                    <p className={cn(TABLE_CELL, TABLE_BODY_TEXT, "tabular-nums")}>
                      {formatArgentinaTaskDate(project.createdAt)}
                    </p>

                    <ProjectRowActions
                      project={project}
                      disabled={isPending}
                      onEdit={() => openEdit(project)}
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
