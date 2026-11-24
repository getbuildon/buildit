import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "../../lib/cn"
import { Icon } from "../../atoms/icon/Icon"
import { Progress, type ProgressTone } from "../../atoms/progress/Progress"

export type MetricCardProps = {
  label: string
  /** El dato ya formateado: «45,5%», «$ 1.284.000», «48». */
  value: string
  icon?: LucideIcon
  /** Cambio respecto del período anterior. good dice si subir es bueno o malo. */
  delta?: { value: string; direction: "up" | "down"; good: boolean; label?: string }
  /** Barra de avance debajo del dato (0–100). */
  progress?: { value: number; tone?: ProgressTone }
  /** Aclaración corta: «sobre 48 unidades». */
  hint?: ReactNode
  /**
   * default: label arriba, dato grande y extras.
   * tile: el de hoy en el resumen de la obra: ícono en un cuadrado de color al lado del
   * dato, y abajo el label y la aclaración.
   */
  variant?: "default" | "tile"
  /** Color del cuadrado del ícono en tile. */
  tone?: MetricTone
  className?: string
}

export type MetricTone = "info" | "ok" | "caution" | "danger" | "action"

const toneSquare: Record<MetricTone, string> = {
  info: "bg-fn-info-canvas text-fn-info",
  ok: "bg-fn-ok-canvas text-fn-ok",
  caution: "bg-fn-caution-canvas text-fn-caution",
  danger: "bg-fn-danger-canvas text-fn-danger",
  action: "bg-action-soft text-action-text",
}

/**
 * Un indicador: avance de obra, unidades certificadas, facturación del mes.
 * El cambio dice con flecha y palabra si es bueno o malo: no depende del color.
 */
export function MetricCard({ label, value, icon, delta, progress, hint, variant = "default", tone = "info", className }: MetricCardProps) {
  if (variant === "tile") {
    return (
      <div
        className={cn(
          "flex min-w-0 flex-col gap-group rounded-surface border border-line bg-canvas-raised p-snug shadow-hint sm:gap-block sm:px-group sm:py-4.25",
          className,
        )}
      >
        <div className="flex items-center gap-snug">
          {icon ? (
            <span className={cn("flex size-7.75 shrink-0 items-center justify-center rounded-control", toneSquare[tone])}>
              <Icon icon={icon} />
            </span>
          ) : null}
          <p className="text-metric-compact text-ink">{value}</p>
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-meta text-ink">{label}</p>
          {hint ? <p className="text-meta text-ink-muted">{hint}</p> : null}
        </div>
      </div>
    )
  }
  return (
    <div className={cn("flex flex-col gap-snug rounded-surface border border-line bg-canvas-raised p-group", className)}>
      <div className="flex items-center gap-compact text-meta text-ink-muted">
        {icon ? <Icon icon={icon} /> : null}
        <p>{label}</p>
      </div>
      <div className="flex flex-wrap items-end gap-x-snug gap-y-related">
        <p className="text-metric">{value}</p>
        {delta ? (
          <p className={cn("mb-related inline-flex items-center gap-related text-meta font-medium", delta.good ? "text-fn-ok" : "text-fn-danger")}>
            <Icon icon={delta.direction === "up" ? ArrowUpRight : ArrowDownRight} size="xs" />
            {delta.value}
            <span className="sr-only">{delta.good ? " (mejor)" : " (peor)"}</span>
            {delta.label ? <span className="font-regular text-ink-muted">{delta.label}</span> : null}
          </p>
        ) : null}
      </div>
      {progress ? <Progress value={progress.value} label={label} tone={progress.tone} /> : null}
      {hint ? <p className="text-meta text-ink-muted">{hint}</p> : null}
    </div>
  )
}

/** Fila de indicadores: 1 columna en el celular, 2 en tablet, hasta 4 en escritorio. */
export function MetricStrip({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-group sm:grid-cols-2 lg:grid-cols-4", className)}>{children}</div>
}
