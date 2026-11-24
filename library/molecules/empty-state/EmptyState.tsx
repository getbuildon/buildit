import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "../../lib/cn"
import { Icon } from "../../atoms/icon/Icon"

export type EmptyStateProps = {
  icon?: LucideIcon
  /** Qué no hay: «Todavía no hay unidades». */
  title: string
  /** Por qué y qué hacer: «Cargá las unidades para empezar a seguir el avance». */
  description?: ReactNode
  /** La acción que lo resuelve. Una principal como mucho. */
  action?: ReactNode
  size?: "compact" | "default"
  className?: string
}

/**
 * Cuando no hay nada para mostrar. Dice qué falta y cómo resolverlo, en vez de una
 * tabla vacía. Hoy hay ~64 mensajes de «No hay…» escritos cada uno a su manera.
 */
export function EmptyState({ icon, title, description, action, size = "default", className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-snug text-center",
        size === "compact" ? "px-group py-block" : "px-block py-chapter",
        className,
      )}
    >
      {icon ? (
        <span className="mb-related inline-flex size-avatar-lg items-center justify-center rounded-pill bg-canvas-sunken text-ink-muted">
          <Icon icon={icon} size="lg" />
        </span>
      ) : null}
      <p className={size === "compact" ? "text-section" : "text-heading"}>{title}</p>
      {description ? <p className="max-w-reading text-body text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-compact flex flex-wrap justify-center gap-snug">{action}</div> : null}
    </div>
  )
}
