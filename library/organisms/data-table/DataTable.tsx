import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { useMemo, useState, type ReactNode } from "react"
import { cn } from "../../lib/cn"
import { Checkbox } from "../../atoms/checkbox/Checkbox"
import { Icon } from "../../atoms/icon/Icon"
import { Skeleton } from "../../atoms/skeleton/Skeleton"

export type SortDirection = "asc" | "desc"
export type SortState = { key: string; direction: SortDirection }

export type DataTableColumn<Row> = {
  key: string
  header: ReactNode
  /** Qué se muestra en la celda. */
  cell: (row: Row) => ReactNode
  /** Si se puede ordenar, el valor por el que se ordena. */
  sortValue?: (row: Row) => string | number | Date | null | undefined
  align?: "start" | "end"
  /** Ancho fijo de la columna (CSS): "8rem", "20%". */
  width?: string
  /** Se oculta debajo de ese ancho de pantalla. */
  hideBelow?: "sm" | "md" | "lg"
}

export type DataTableProps<Row> = {
  columns: readonly DataTableColumn<Row>[]
  rows: readonly Row[]
  getRowId: (row: Row) => string
  /** Qué muestra la tabla. Lo lee el lector de pantalla (no se ve). */
  caption: string
  /** Orden controlado. Sin esto, la tabla ordena sola en memoria. */
  sort?: SortState
  onSortChange?: (sort: SortState | undefined) => void
  defaultSort?: SortState
  /** Selección con casillas. */
  selectedIds?: ReadonlySet<string>
  onSelectionChange?: (ids: Set<string>) => void
  /** Acciones de cada fila (un Menu). Columna fija a la derecha. */
  rowActions?: (row: Row) => ReactNode
  loading?: boolean
  /** Lo que se muestra sin filas (un EmptyState). */
  empty?: ReactNode
  density?: "compact" | "default"
  className?: string
}

const hideClass = { sm: "max-sm:hidden", md: "max-md:hidden", lg: "max-lg:hidden" } as const

const collator = new Intl.Collator("es-AR", { numeric: true, sensitivity: "base" })

function compare(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime()
  if (typeof a === "number" && typeof b === "number") return a - b
  return collator.compare(String(a), String(b))
}

/**
 * Tabla de datos: unidades, tareas, clientes, obras del backoffice. Hoy la app tiene
 * una sola <table>; el resto son filas de divs que el lector de pantalla no puede
 * recorrer como tabla.
 *
 * - Tabla de verdad: encabezados asociados, aria-sort en la columna ordenada.
 * - Ordena por columna (1A, 2A, 10A en orden natural; con tildes en español).
 * - Selección con casillas y «seleccionar todo» con estado intermedio.
 * - Encabezado fijo al scrollear; en pantallas chicas scrollea de costado.
 */
export function DataTable<Row>({
  columns,
  rows,
  getRowId,
  caption,
  sort: controlledSort,
  onSortChange,
  defaultSort,
  selectedIds,
  onSelectionChange,
  rowActions,
  loading = false,
  empty,
  density = "default",
  className,
}: DataTableProps<Row>) {
  const [internalSort, setInternalSort] = useState<SortState | undefined>(defaultSort)
  const sort = controlledSort ?? internalSort
  const selectable = Boolean(onSelectionChange)
  const selected = selectedIds ?? new Set<string>()

  const sortedRows = useMemo(() => {
    if (!sort || controlledSort) return rows
    const column = columns.find((item) => item.key === sort.key)
    if (!column?.sortValue) return rows
    const factor = sort.direction === "asc" ? 1 : -1
    return [...rows].sort((a, b) => factor * compare(column.sortValue!(a), column.sortValue!(b)))
  }, [rows, columns, sort, controlledSort])

  const toggleSort = (key: string) => {
    const next: SortState | undefined =
      sort?.key !== key ? { key, direction: "asc" } : sort.direction === "asc" ? { key, direction: "desc" } : undefined
    setInternalSort(next)
    onSortChange?.(next)
  }

  const allIds = sortedRows.map(getRowId)
  const selectedCount = allIds.filter((id) => selected.has(id)).length
  const headerState = selectedCount === 0 ? false : selectedCount === allIds.length ? true : "indeterminate"

  const cellPad = density === "compact" ? "px-snug py-compact" : "px-snug py-snug"
  const span = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)

  return (
    <div className={cn("overflow-x-auto rounded-surface border border-line bg-canvas-raised", className)}>
      <table className="w-full border-collapse text-left text-body" aria-busy={loading || undefined}>
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 z-(--z-raised) bg-canvas-raised">
          <tr className="border-b border-line">
            {selectable ? (
              <th scope="col" className="w-10 pl-group">
                <Checkbox
                  aria-label="Seleccionar todas las filas"
                  checked={headerState}
                  disabled={loading || allIds.length === 0}
                  onCheckedChange={(value) => onSelectionChange?.(value === true ? new Set(allIds) : new Set())}
                />
              </th>
            ) : null}
            {columns.map((column) => {
              const active = sort?.key === column.key
              return (
                <th
                  key={column.key}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                  aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : column.sortValue ? "none" : undefined}
                  className={cn(cellPad, "text-meta font-medium whitespace-nowrap text-ink-muted", column.align === "end" && "text-right", column.hideBelow && hideClass[column.hideBelow])}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className={cn(
                        "focus-ring group/sort -mx-related inline-flex items-center gap-related rounded-box px-related hover:text-ink",
                        active && "text-ink",
                        column.align === "end" && "flex-row-reverse",
                      )}
                    >
                      {column.header}
                      <Icon
                        icon={active ? (sort.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown}
                        size="xs"
                        className={active ? undefined : "opacity-0 group-hover/sort:opacity-100 group-focus-visible/sort:opacity-100"}
                      />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              )
            })}
            {rowActions ? (
              <th scope="col" className="w-12">
                <span className="sr-only">Acciones</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {loading
            ? Array.from({ length: 5 }, (_, index) => (
                <tr key={`skeleton-${index}`}>
                  <td colSpan={span} className={cellPad}>
                    <Skeleton shape="text" className="w-full" />
                  </td>
                </tr>
              ))
            : sortedRows.map((row) => {
                const id = getRowId(row)
                const isSelected = selected.has(id)
                return (
                  <tr key={id} data-selected={isSelected || undefined} className="motion-color hover:bg-surface-hover data-selected:bg-surface-selected">
                    {selectable ? (
                      <td className="w-10 pl-group">
                        <Checkbox
                          aria-label="Seleccionar fila"
                          aria-describedby={`${id}-primary`}
                          checked={isSelected}
                          onCheckedChange={(value) => {
                            const next = new Set(selected)
                            if (value === true) next.add(id)
                            else next.delete(id)
                            onSelectionChange?.(next)
                          }}
                        />
                      </td>
                    ) : null}
                    {columns.map((column, index) => (
                      <td
                        key={column.key}
                        id={index === 0 ? `${id}-primary` : undefined}
                        className={cn(cellPad, column.align === "end" && "text-right tabular-nums", column.hideBelow && hideClass[column.hideBelow])}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                    {rowActions ? <td className="w-12 pr-compact text-right">{rowActions(row)}</td> : null}
                  </tr>
                )
              })}
          {!loading && sortedRows.length === 0 ? (
            <tr>
              <td colSpan={span}>{empty ?? <p className="p-block text-center text-body text-ink-muted">No hay filas para mostrar.</p>}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}
