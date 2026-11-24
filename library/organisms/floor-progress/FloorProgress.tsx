import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { AlertTriangle, ChevronRight, type LucideIcon } from "lucide-react"
import { cloneElement, type ComponentProps, type ReactElement, type ReactNode } from "react"
import { cn } from "../../lib/cn"
import { Icon } from "../../atoms/icon/Icon"
import { Progress, type ProgressTone } from "../../atoms/progress/Progress"
import { Skeleton } from "../../atoms/skeleton/Skeleton"
import { formatPercent } from "../../foundations/format/format"

/**
 * El avance por piso del resumen de la obra: cada piso es una card que se abre y
 * muestra sus unidades.
 *
 * Arreglos respecto de hoy:
 * - el encabezado del piso dice si está abierto o cerrado (aria-expanded) y se maneja
 *   con el teclado, porque usa el Accordion de Radix en vez de un botón con estado a mano;
 * - las barras anuncian su porcentaje y el porcentaje va con coma («45,5%»);
 * - «2» al lado del triángulo rojo dice para el lector de pantalla «2 unidades con
 *   problemas», y en la unidad, «con tareas bloqueadas» (hoy el aviso está solo en un
 *   aria-label del ícono, que muchos lectores no leen).
 */
export function FloorList({ className, ...props }: ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root className={cn("flex flex-col gap-snug", className)} {...props} />
}

export type FloorItemProps = Omit<ComponentProps<typeof AccordionPrimitive.Item>, "children"> & {
  name: string
  /** Avance del piso, 0–100. */
  progress: number
  /** stage: el color por etapa de hoy. */
  progressTone?: ProgressTone
  unitCount: number
  /** Unidades con tareas bloqueadas. */
  blockedCount?: number
  /** scroll: las unidades en una fila que se desliza (hoy). grid: en grilla que baja. */
  layout?: "scroll" | "grid"
  /** Las UnitTile del piso. */
  children: ReactNode
}

export function FloorItem({
  name,
  progress,
  progressTone = "stage",
  unitCount,
  blockedCount = 0,
  layout = "scroll",
  className,
  children,
  ...props
}: FloorItemProps) {
  return (
    <AccordionPrimitive.Item
      className={cn("group/floor overflow-hidden rounded-surface border border-line bg-canvas-raised shadow-hint", className)}
      {...props}
    >
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger className="focus-ring state-veil flex w-full cursor-pointer flex-col gap-snug px-group py-snug text-left sm:flex-row sm:items-center sm:py-2.75">
          <span className="flex min-w-0 flex-1 flex-col gap-snug sm:flex-row sm:items-center sm:gap-block">
            <span className="flex shrink-0 items-center gap-related">
              <Icon
                icon={ChevronRight}
                className="text-ink-muted transition-transform duration-(--duration-base) ease-standard group-data-[state=open]/floor:rotate-90"
              />
              <span className="text-label font-semibold text-ink">{name}</span>
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-compact">
              {/* La barra es decorativa acá: el porcentaje va al lado en texto y es parte
                  del nombre del botón. */}
              <span aria-hidden className="min-w-0 flex-1">
                <Progress value={progress} label={`Avance de ${name}`} tone={progressTone} />
              </span>
              <span className="shrink-0 text-meta font-medium text-ink-muted tabular-nums">{formatPercent(progress)}</span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-compact text-meta text-ink-muted sm:justify-end">
            <span>
              {unitCount} {unitCount === 1 ? "unidad" : "unidades"}
            </span>
            {blockedCount > 0 ? (
              <span className="inline-flex items-center gap-related font-medium text-fn-danger">
                <Icon icon={AlertTriangle} size="xs" />
                {blockedCount}
                <span className="sr-only"> {blockedCount === 1 ? "unidad con problemas" : "unidades con problemas"}</span>
              </span>
            ) : null}
          </span>
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down motion-reduce:animate-none">
        <ul
          className={cn(
            "border-t border-line px-group py-snug",
            layout === "scroll" ? "flex gap-snug overflow-x-auto pb-4" : "grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-snug",
          )}
        >
          {children}
        </ul>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  )
}

export type UnitTileProps = {
  /** El código visible: «PB-01», «3B». */
  code: string
  /** «Dpto. 2 Amb.», «Oficina», «SUM». */
  type: string
  icon: LucideIcon
  progress: number
  progressTone?: ProgressTone
  blocked?: boolean
  /** El link a la unidad (<a> o el Link de next/link), vacío: la librería le pone las clases y el contenido. */
  link: ReactElement<{ className?: string; children?: ReactNode }>
  /** scroll: ancho fijo de 200 (hoy). fluid: ocupa la celda de la grilla. */
  width?: "fixed" | "fluid"
}

/** Una unidad dentro del piso: código, avance, tipo y si tiene tareas bloqueadas. */
export function UnitTile({ code, type, icon, progress, progressTone = "stage-neutral", blocked = false, link, width = "fixed" }: UnitTileProps) {
  return (
    <li className={cn("flex", width === "fixed" ? "w-50 shrink-0" : "min-w-0")}>
      {cloneElement(
        link,
        {
          className:
            "focus-ring motion-color flex w-full flex-col gap-compact rounded-control border border-line bg-canvas px-2.25 py-3.25 text-ink no-underline hover:border-action/40 hover:bg-canvas-raised",
        },
        <span className="flex flex-col gap-0.5">
          <span className="flex items-center justify-between text-micro font-regular">
            <span className="text-ink">{code}</span>
            <span className="text-ink-muted tabular-nums">{formatPercent(progress)}</span>
          </span>
          <span aria-hidden>
            <Progress value={progress} label={`Avance de ${code}`} tone={progressTone} size="thin" className="h-1.5" />
          </span>
        </span>,
        <span className="flex items-center justify-between gap-1.5">
          <span className="flex min-w-0 items-center gap-related">
            <Icon icon={icon} size="xs" className="text-ink" />
            <span className="truncate text-meta">{type}</span>
          </span>
          {blocked ? (
            <span className="shrink-0 text-fn-danger">
              <Icon icon={AlertTriangle} size="xs" />
              <span className="sr-only">, con tareas bloqueadas</span>
            </span>
          ) : null}
        </span>,
      )}
    </li>
  )
}

/** El avance por piso mientras carga. */
export function FloorListSkeleton({ floors = 3 }: { floors?: number }) {
  return (
    <div aria-hidden className="flex flex-col gap-snug">
      {Array.from({ length: floors }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-surface border border-line bg-canvas-raised shadow-hint">
          <div className="flex flex-col gap-snug px-group py-snug sm:flex-row sm:items-center sm:gap-block sm:py-2.75">
            <Skeleton className="h-4 w-22" />
            <div className="flex min-w-0 flex-1 items-center gap-compact">
              <Skeleton className="h-2 min-w-0 flex-1 rounded-pill" />
              <Skeleton className="h-3.5 w-8" />
            </div>
            <Skeleton className="h-3.5 w-23" />
          </div>
          {index < 2 ? (
            <div className="flex gap-snug overflow-hidden border-t border-line px-group py-snug">
              {Array.from({ length: index === 0 ? 3 : 4 }, (_, unitIndex) => (
                <div key={unitIndex} className="flex w-50 shrink-0 flex-col gap-compact rounded-control border border-line px-2.25 py-3.25">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-1.5 rounded-pill" />
                  <Skeleton className="h-3.5 w-[70%]" />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
