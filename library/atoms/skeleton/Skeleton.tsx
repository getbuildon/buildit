import { cn } from "../../lib/cn"

export type SkeletonProps = {
  className?: string
  /** Forma: línea de texto, bloque o círculo (avatar). */
  shape?: "text" | "block" | "circle"
}

/**
 * Lugar de algo que todavía carga. Toma el color del modo (ya no hace falta elegir
 * tono claro u oscuro como hoy). Con reduced-motion no brilla.
 * Va dentro de un contenedor con aria-busy="true"; el skeleton en sí es decorativo.
 */
export function Skeleton({ className, shape = "block" }: SkeletonProps) {
  return (
    <span
      aria-hidden
      data-slot="skeleton"
      className={cn(
        "relative block overflow-hidden bg-skeleton",
        shape === "text" && "h-[1em] rounded-compact",
        shape === "block" && "rounded-control",
        shape === "circle" && "rounded-pill",
        "after:absolute after:inset-0 after:animate-shimmer after:bg-linear-to-r after:from-transparent after:via-canvas-raised/40 after:to-transparent after:content-['']",
        "motion-reduce:after:hidden",
        className,
      )}
    />
  )
}
