import { Slot } from "@radix-ui/react-slot"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "../../lib/cn"

export type CardProps = ComponentProps<"div"> & {
  /** interactive: toda la card se toca (link a una obra). Va con asChild sobre un <a>. */
  variant?: "default" | "interactive" | "hint"
  /** Para que la card sea un link o un <article> sin un div de más. */
  asChild?: boolean
}

/**
 * Contenedor de un bloque: una obra, una unidad, un indicador. Reemplaza las 56
 * cards armadas a mano (radio 14 o 16, bordes y sombras distintas).
 * hint: con el halo naranja suave de las cards del backoffice.
 */
export function Card({ variant = "default", asChild = false, className, ...props }: CardProps) {
  const Comp = asChild ? Slot : "div"
  return (
    <Comp
      data-slot="card"
      className={cn(
        "flex flex-col rounded-surface border border-line bg-canvas-raised text-ink",
        variant === "hint" && "shadow-hint",
        variant === "interactive" && "focus-ring motion-color cursor-pointer hover:border-line-strong hover:shadow-near",
        className,
      )}
      {...props}
    />
  )
}

export type CardHeaderProps = {
  title: ReactNode
  description?: ReactNode
  /** Acción del encabezado: un menú, un link «Ver todo». */
  action?: ReactNode
  /** Nivel del título en la página. Por defecto h3. */
  as?: "h2" | "h3" | "h4"
  className?: string
}

export function CardHeader({ title, description, action, as: Heading = "h3", className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start gap-snug px-group pt-group", className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-related">
        <Heading className="text-section">{title}</Heading>
        {description ? <p className="text-meta text-ink-muted">{description}</p> : null}
      </div>
      {action ? <div className="-mt-related -mr-compact shrink-0">{action}</div> : null}
    </div>
  )
}

export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-snug p-group", className)} {...props} />
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex items-center gap-snug border-t border-line px-group py-snug", className)} {...props} />
}
