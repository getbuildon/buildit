import type { ReactNode } from "react"
import { cn } from "../../lib/cn"

export type TopbarProps = {
  /** A la izquierda: el botón de menú (celular) o la marca. */
  start?: ReactNode
  /** El título de la pantalla o la obra actual. */
  title?: ReactNode
  /** A la derecha: notificaciones, el usuario. */
  end?: ReactNode
  className?: string
}

/**
 * Barra superior: el inicio (marca y usuario) y la obra en el celular (menú, nombre y
 * usuario). 56 px de alto, fija arriba al scrollear, con el lienzo semitransparente.
 */
export function Topbar({ start, title, end, className }: TopbarProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-(--z-sticky) flex h-14 shrink-0 items-center gap-snug border-b border-line bg-canvas/90 px-(--layout-margin) backdrop-blur-sm",
        className,
      )}
    >
      {start ? <div className="flex shrink-0 items-center gap-compact">{start}</div> : null}
      {title ? <div className="min-w-0 flex-1 truncate text-label">{title}</div> : <div className="flex-1" />}
      {end ? <div className="flex shrink-0 items-center gap-compact">{end}</div> : null}
    </div>
  )
}
