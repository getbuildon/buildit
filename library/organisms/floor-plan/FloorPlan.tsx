import { Slot } from "@radix-ui/react-slot"
import type { ReactNode } from "react"
import { cn } from "../../lib/cn"
import { formatPercent } from "../../foundations/format/format"
import { progressFillClass } from "../../atoms/progress/Progress"

/** a-tiempo y atrasada necesitan un plan de obra; sin plan, en-curso y bloqueada. */
export type FloorUnitStatus = "sin-empezar" | "en-curso" | "a-tiempo" | "atrasada" | "bloqueada" | "terminada"

export type FloorUnit = {
  id: string
  /** Lo que se ve en la celda: «4B». */
  name: string
  /** Avance 0–100. */
  progress: number
  status: FloorUnitStatus
}

export type Floor = {
  id: string
  /** «Piso 4», «PB», «Subsuelo 1». */
  label: string
  units: readonly FloorUnit[]
}

export type FloorPlanProps = {
  /** De arriba hacia abajo, como se ve el edificio: el último piso primero. */
  floors: readonly Floor[]
  /** El link de cada unidad (un <a> o el Link de next/link) con su nombre adentro. */
  renderLink: (unit: FloorUnit) => ReactNode
  /** Unidad marcada (la que se está viendo al lado). */
  selectedId?: string
  /** Qué muestra el plano. Lo lee el lector de pantalla. */
  label: string
  className?: string
}

const statusStyle: Record<FloorUnitStatus, { label: string; cell: string; bar: string }> = {
  "sin-empezar": { label: "Sin empezar", cell: "border-line bg-canvas-raised", bar: "bg-ink-subtle" },
  // En curso: la barra va en los grises por etapa de hoy (se calcula según el avance).
  "en-curso": { label: "En curso", cell: "border-line bg-canvas-raised", bar: "" },
  "a-tiempo": { label: "A tiempo", cell: "border-fn-ok-line bg-fn-ok-canvas", bar: "bg-fn-ok-solid" },
  atrasada: { label: "Atrasada", cell: "border-fn-caution-line bg-fn-caution-canvas", bar: "bg-fn-caution-solid" },
  bloqueada: { label: "Bloqueada", cell: "border-fn-danger-line bg-fn-danger-canvas", bar: "bg-fn-danger-solid" },
  terminada: { label: "Terminada", cell: "border-line bg-canvas-sunken", bar: "bg-fn-ok-solid" },
}

/**
 * La obra piso por piso: cada unidad con su estado (color de fondo y palabra para el
 * lector de pantalla) y su avance (barra y número). Se lee el edificio de un vistazo:
 * qué pisos van atrasados, qué unidades ya están.
 *
 * Cada celda es un link a su unidad, con nombre completo para el lector de pantalla:
 * «Unidad 4B, 45% de avance, a tiempo». En pantallas chicas, los pisos scrollean de costado.
 */
export function FloorPlan({ floors, renderLink, selectedId, label, className }: FloorPlanProps) {
  // Las referencias muestran solo los estados que aparecen en el plano.
  const present = new Set(floors.flatMap((floor) => floor.units.map((unit) => unit.status)))
  const statuses = (Object.keys(statusStyle) as FloorUnitStatus[]).filter((status) => present.has(status))
  return (
    <section aria-label={label} className={cn("flex flex-col gap-group", className)}>
      <ul aria-label="Referencias" className="flex flex-wrap gap-x-group gap-y-related text-meta text-ink-muted">
        {statuses.map((status) => (
          <li key={status} className="flex items-center gap-compact">
            <span aria-hidden className={cn("size-3 rounded-box border", statusStyle[status].cell)} />
            {statusStyle[status].label}
          </li>
        ))}
      </ul>
      <div className="overflow-x-auto rounded-surface border border-line bg-canvas-raised p-group">
        <ol className="flex min-w-max flex-col gap-compact">
          {floors.map((floor) => (
            <li key={floor.id} className="flex items-stretch gap-snug">
              <p className="flex w-20 shrink-0 items-center text-meta font-medium text-ink-muted">{floor.label}</p>
              <ul className="flex gap-compact" aria-label={floor.label}>
                {floor.units.map((unit) => {
                  const style = statusStyle[unit.status]
                  return (
                    <li key={unit.id}>
                      <Slot
                        aria-label={`Unidad ${unit.name}, ${formatPercent(unit.progress)} de avance, ${style.label.toLowerCase()}`}
                        aria-current={selectedId === unit.id ? "true" : undefined}
                        className={cn(
                          "focus-ring motion-color relative flex h-14 w-16 flex-col justify-between overflow-hidden rounded-control border px-compact pt-related pb-compact text-left",
                          "hover:border-line-strong hover:shadow-near",
                          style.cell,
                          selectedId === unit.id && "border-2 border-action",
                        )}
                      >
                        {renderLink(unit)}
                      </Slot>
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/**
 * Lo de adentro de cada celda. Va dentro del link que arma quien usa el plano:
 * renderLink={(u) => <a href={`/unidades/${u.id}`}><FloorPlanCell unit={u} /></a>}
 */
export function FloorPlanCell({ unit }: { unit: FloorUnit }) {
  const style = statusStyle[unit.status]
  const visible = unit.progress > 0 && unit.progress < 4 ? 4 : unit.progress
  return (
    <>
      <span className="text-label">{unit.name}</span>
      <span className="text-micro tabular-nums text-ink-muted">{formatPercent(unit.progress, 0)}</span>
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-canvas-track">
        <span className={cn("block h-full", unit.status === "en-curso" ? progressFillClass("stage-neutral", unit.progress) : style.bar)} style={{ width: `${visible}%` }} />
      </span>
    </>
  )
}
