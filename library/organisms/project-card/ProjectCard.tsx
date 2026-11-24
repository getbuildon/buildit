import { Slot } from "@radix-ui/react-slot"
import { Building2, TrendingDown, TrendingUp } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "../../lib/cn"
import { Badge } from "../../atoms/badge/Badge"
import { Icon } from "../../atoms/icon/Icon"
import { Progress } from "../../atoms/progress/Progress"
import { Skeleton } from "../../atoms/skeleton/Skeleton"
import { Tooltip } from "../../atoms/tooltip/Tooltip"
import { formatPercent } from "../../foundations/format/format"

export type ProjectCardProps = {
  name: string
  address?: string
  /** Logo de la empresa. Sin logo: el edificio sobre naranja, como hoy. */
  logoUrl?: string | null
  /** Cantidad de niveles. */
  floors: number
  /** Avance general 0–100. undefined: todavía carga. */
  progress?: number
  /**
   * Cambio de avance respecto de la semana anterior, en puntos. undefined: todavía carga;
   * null: no hay dato.
   */
  weeklyDelta?: number | null
  /** Borrador: la obra todavía se está configurando. */
  draft?: boolean
  /** El link a la obra (<a> o el Link de next/link) con el nombre adentro. Toda la card se toca. */
  link: ReactNode
  className?: string
}

/**
 * La card de una obra en el inicio, con el diseño de hoy: 240 px, logo de 48, badge de
 * avance semanal (o «Borrador»), nombre, dirección, niveles y barra de progreso, sobre
 * el fondo tierra.
 *
 * Con estos arreglos:
 * - el link es el nombre (el lector de pantalla dice «Torre Alamo, link» y no todo el
 *   contenido de la card) y su área cubre la card entera, así se toca igual que hoy;
 * - el badge dice para el lector de pantalla qué es («Avance de la semana») y el tooltip
 *   es el de la librería;
 * - la barra de progreso anuncia su porcentaje.
 */
export function ProjectCard({ name, address, logoUrl, floors, progress, weeklyDelta, draft = false, link, className }: ProjectCardProps) {
  return (
    <article
      className={cn(
        "group/card relative flex min-h-61 w-full max-w-60 shrink-0 flex-col rounded-surface bg-canvas-raised p-block text-left text-ink shadow-float sm:w-60",
        "motion-color transition-transform duration-(--duration-base) ease-standard hover:-translate-y-0.5",
        "has-[a:focus-visible]:[box-shadow:var(--focus-ring),var(--elevation-float)]",
        className,
      )}
    >
      <div className="flex flex-col gap-group">
        <div className="flex h-12 items-start justify-between">
          <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-mark bg-action text-action-ink shadow-hint">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- la librería no depende de Next
              <img src={logoUrl} alt="" className="size-full object-cover" />
            ) : (
              <Icon icon={Building2} size="lg" />
            )}
          </span>
          {draft ? (
            <Badge tone="info" className="rounded-control">
              Borrador
            </Badge>
          ) : weeklyDelta === undefined ? (
            <Skeleton className="h-6 w-14" />
          ) : weeklyDelta === null ? null : (
            <Tooltip content="Porcentaje de avance respecto a la semana anterior.">
              <span className="relative z-(--z-raised)">
                <Badge tone={weeklyDelta >= 0 ? "ok" : "danger"} icon={weeklyDelta >= 0 ? TrendingUp : TrendingDown} className="rounded-control">
                  <span className="sr-only">Avance de la semana: </span>
                  {weeklyDelta > 0 ? "+" : ""}
                  {formatPercent(weeklyDelta)}
                </Badge>
              </span>
            </Tooltip>
          )}
        </div>
        <div className="flex flex-col">
          <h2 className="line-clamp-2 text-section">
            {/* El ::after del link cubre la card: un solo link, toda el área tocable. */}
            <Slot className="outline-none after:absolute after:inset-0 after:rounded-surface after:content-['']">{link}</Slot>
          </h2>
          {address ? <p className="line-clamp-2 text-meta text-ink-muted">{address}</p> : null}
        </div>
      </div>

      <div className="mt-auto flex items-start justify-between border-t border-line pt-compact pb-compact">
        <div className="flex flex-col">
          <p className="text-meta font-medium text-ink-muted">Niveles</p>
          <p className="text-label">{floors}</p>
        </div>
        <div className="flex w-16 flex-col gap-compact">
          <p className="text-meta font-medium text-ink-muted">Progreso</p>
          {draft ? (
            <span className="h-1.5 rounded-pill bg-canvas-track" aria-hidden />
          ) : progress === undefined ? (
            <Skeleton className="h-1.5 rounded-pill" />
          ) : (
            <Progress value={progress} label={`Avance de ${name}`} size="thin" className="h-1.5" />
          )}
        </div>
      </div>
    </article>
  )
}

/** La card de obra mientras carga el inicio. */
export function ProjectCardSkeleton() {
  return (
    <div aria-hidden className="flex min-h-61 w-full max-w-60 shrink-0 flex-col gap-group rounded-surface bg-canvas-raised p-block shadow-float sm:w-60">
      <div className="flex items-start justify-between">
        <Skeleton className="size-12 rounded-mark" />
        <Skeleton className="h-6 w-14" />
      </div>
      <Skeleton shape="text" className="w-3/4 text-section" />
      <Skeleton shape="text" className="w-1/2 text-meta" />
      <Skeleton className="mt-auto h-8" />
    </div>
  )
}
