import type { ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function GhostPage({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div
      className="min-w-0 px-6 py-10 lg:px-12"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      {children}
      <span className="sr-only">{label}</span>
    </div>
  )
}

function GhostCard({
  className,
  children,
}: {
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-[#edeef0] bg-white shadow-[0_0_5px_rgba(243,103,31,0.08)]",
        className,
      )}
      aria-hidden
    >
      {children}
    </div>
  )
}

function TableRowGhost({ columns }: { columns: number }) {
  return (
    <div className="flex items-center gap-3 border-b border-[#edeef0] px-4 py-3 last:border-b-0">
      {Array.from({ length: columns }, (_, index) => (
        <Skeleton
          key={index}
          className={cn(
            "h-4 rounded-[6px]",
            index === 0 ? "w-[22%]" : "flex-1",
          )}
        />
      ))}
    </div>
  )
}

function ListPageSkeleton({
  label,
  columns,
  hasAction = false,
}: {
  label: string
  columns: number
  hasAction?: boolean
}) {
  return (
    <GhostPage label={label}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-8 w-[160px] rounded-[10px]" />
        {hasAction ? (
          <Skeleton className="h-10 w-[160px] rounded-[10px]" />
        ) : null}
      </div>

      <GhostCard className="mt-6 overflow-hidden">
        <div className="flex items-center justify-end gap-3 border-b border-[#f4f5f6] px-4 py-3">
          <Skeleton className="h-9 w-[240px] rounded-[10px]" />
        </div>
        {Array.from({ length: 8 }, (_, index) => (
          <TableRowGhost key={index} columns={columns} />
        ))}
        <div className="flex items-center justify-end gap-2 px-4 py-3">
          <Skeleton className="h-8 w-8 rounded-[8px]" />
          <Skeleton className="h-8 w-16 rounded-[8px]" />
          <Skeleton className="h-8 w-8 rounded-[8px]" />
        </div>
      </GhostCard>
    </GhostPage>
  )
}

export function BackofficeDashboardSkeleton() {
  return (
    <GhostPage label="Cargando dashboard…">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[180px] rounded-[10px]" />
        <Skeleton className="h-5 w-[min(100%,420px)] rounded-[8px]" />
      </div>

      <GhostCard className="mt-6 h-[88px]" />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <GhostCard key={index} className="h-28" />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <GhostCard className="h-64" />
        <GhostCard className="h-64" />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <GhostCard className="h-64" />
        <GhostCard className="h-64" />
      </div>
    </GhostPage>
  )
}

export function BackofficeClientesSkeleton() {
  return <ListPageSkeleton label="Cargando clientes…" columns={6} />
}

export function BackofficeUsuariosSkeleton() {
  return <ListPageSkeleton label="Cargando usuarios…" columns={6} hasAction />
}

export function BackofficeEmpresasSkeleton() {
  return <ListPageSkeleton label="Cargando empresas…" columns={7} hasAction />
}

export function BackofficeProyectosSkeleton() {
  return <ListPageSkeleton label="Cargando proyectos…" columns={8} hasAction />
}
