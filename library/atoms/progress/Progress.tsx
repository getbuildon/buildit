import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "../../lib/cn"
import { formatPercent } from "../../foundations/format/format"

export const progressTones = ["action", "ok", "caution", "danger", "stage", "stage-neutral"] as const
export type ProgressTone = (typeof progressTones)[number]

const toneClass: Record<Exclude<ProgressTone, "stage" | "stage-neutral">, string> = {
  action: "bg-action",
  ok: "bg-fn-ok-solid",
  caution: "bg-fn-caution-solid",
  danger: "bg-fn-danger-solid",
}

/** La regla de hoy del resumen de la obra: el color cambia según la etapa del avance. */
function stageClass(value: number): string {
  const rounded = Math.round(value)
  if (rounded === 100) return "bg-stage-done"
  if (rounded > 75) return "bg-stage-top"
  if (rounded > 50) return "bg-stage-high"
  if (rounded > 25) return "bg-stage-mid"
  if (rounded > 10) return "bg-stage-low"
  return "bg-stage-start"
}

/** Las unidades: grises que oscurecen con el avance. */
function stageNeutralClass(value: number): string {
  const rounded = Math.round(value)
  if (rounded === 100) return "bg-stage-neutral-6"
  if (rounded >= 90) return "bg-stage-neutral-5"
  if (rounded >= 70) return "bg-stage-neutral-4"
  if (rounded >= 45) return "bg-stage-neutral-3"
  if (rounded >= 20) return "bg-stage-neutral-2"
  return "bg-stage-neutral-1"
}

/** La clase de color del relleno, para barras armadas a mano (el plano por piso). */
export function progressFillClass(tone: ProgressTone, value: number): string {
  if (tone === "stage") return stageClass(value)
  if (tone === "stage-neutral") return stageNeutralClass(value)
  return toneClass[tone]
}

export type ProgressProps = {
  /** De 0 a 100. */
  value: number
  /** Qué mide. Lo lee el lector de pantalla: "Avance de obra". */
  label: string
  /** stage y stage-neutral: el color depende del avance (la regla del resumen de la obra). */
  tone?: ProgressTone
  size?: "thin" | "default"
  className?: string
}

/**
 * Barra de avance. El lector de pantalla anuncia el label y el porcentaje en
 * español ("45,5%"). Si hay avance real menor al 1%, se ve una franja mínima
 * (misma regla que hoy tiene la app).
 */
export function Progress({ value, label, tone = "action", size = "default", className }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const visible = clamped > 0 && clamped < 1 ? 1 : clamped
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={clamped}
      max={100}
      aria-label={label}
      getValueLabel={(current) => formatPercent(current)}
      className={cn("relative w-full overflow-hidden rounded-pill bg-canvas-track", size === "thin" ? "h-1" : "h-2", className)}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full rounded-pill transition-[width] duration-(--duration-slow) ease-emphasized", progressFillClass(tone, clamped))}
        style={{ width: `${visible}%` }}
      />
    </ProgressPrimitive.Root>
  )
}
