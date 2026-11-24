import { Search } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "../../lib/cn"
import { InputGroup } from "../../molecules/input-group/InputGroup"

export type ListToolbarProps = {
  /** Búsqueda: valor y cambio. Sin esto no hay buscador. */
  search?: { value: string; onChange: (value: string) => void; placeholder?: string; label?: string }
  /** Filtros: un Segmented, un Select, un Popover de filtros. */
  filters?: ReactNode
  /** Cuántos resultados hay: «48 unidades». Se anuncia al cambiar. */
  count?: string
  /** Acciones de la lista: «Nueva unidad». */
  actions?: ReactNode
  /** Barra de acciones para la selección; reemplaza a filtros y acciones mientras hay filas elegidas. */
  selection?: { count: number; actions: ReactNode; onClear: () => void }
  className?: string
}

/**
 * La barra arriba de una lista o tabla: buscar, filtrar, contar y crear. Con filas
 * seleccionadas, se convierte en la barra de acciones sobre esas filas.
 */
export function ListToolbar({ search, filters, count, actions, selection, className }: ListToolbarProps) {
  if (selection && selection.count > 0) {
    return (
      // Barra oscura en los dos modos: es una isla con el tema oscuro, así los botones de adentro
      // toman sus colores solos.
      <div
        data-theme="oscuro"
        className={cn("flex min-h-control flex-wrap items-center gap-snug rounded-control border border-line bg-canvas-overlay px-group py-compact text-ink shadow-overlay", className)}
      >
        <p className="text-label" aria-live="polite">
          {selection.count === 1 ? "1 elegida" : `${selection.count} elegidas`}
        </p>
        <div className="flex flex-1 flex-wrap items-center gap-compact">
          {selection.actions}
        </div>
        <button type="button" onClick={selection.onClear} className="focus-ring rounded-box text-label underline-offset-4 hover:underline">
          Quitar selección
        </button>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-snug md:flex-row md:items-center", className)}>
      {search ? (
        <InputGroup
          type="search"
          aria-label={search.label ?? "Buscar"}
          placeholder={search.placeholder ?? "Buscar"}
          value={search.value}
          onChange={(event) => search.onChange(event.target.value)}
          onClear={() => search.onChange("")}
          start={<Search />}
          groupClassName="md:max-w-80"
        />
      ) : null}
      {filters ? <div className="flex flex-wrap items-center gap-compact">{filters}</div> : null}
      <div className="flex items-center gap-snug md:ml-auto">
        {count ? (
          <p className="text-meta whitespace-nowrap text-ink-muted" aria-live="polite">
            {count}
          </p>
        ) : null}
        {actions ? <div className="ml-auto flex gap-compact md:ml-0">{actions}</div> : null}
      </div>
    </div>
  )
}
