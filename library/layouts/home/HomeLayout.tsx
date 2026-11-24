import type { ReactNode } from "react"
import { cn } from "../../lib/cn"
import { MAIN_ID, SkipLink } from "../skip-link"

export type HomeLayoutProps = {
  /** Barra de arriba, a la derecha: Portal Clientes, la empresa, el usuario. */
  header?: ReactNode
  /** Barra de abajo, fija: el aviso del backoffice. */
  footer?: ReactNode
  /** Saludo y obras, centrados. */
  children: ReactNode
  /** Mientras carga: lo anuncia el lector de pantalla. */
  busy?: boolean
  className?: string
}

/**
 * El inicio, con el diseño de hoy: fondo tierra (degradé marrón), barra fija arriba
 * con los botones a la derecha, contenido centrado de hasta 1280 px y barra fija abajo.
 * El texto sobre la tierra es blanco.
 */
export function HomeLayout({ header, footer, children, busy, className }: HomeLayoutProps) {
  return (
    <div className={cn("relative flex min-h-dvh flex-col bg-linear-135 from-earth to-earth-deep text-on-earth", className)}>
      <SkipLink />
      {header ? (
        <header className="sticky top-0 z-(--z-sticky) w-full shrink-0 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-page flex-nowrap items-center justify-end gap-compact px-snug py-snug sm:gap-block sm:px-block sm:py-group lg:px-chapter">
            {header}
          </div>
        </header>
      ) : null}
      <main
        id={MAIN_ID}
        tabIndex={-1}
        aria-busy={busy || undefined}
        className="mx-auto flex w-full max-w-page flex-1 flex-col items-center justify-center px-group py-6 outline-none sm:px-block sm:py-chapter lg:px-chapter"
      >
        {children}
      </main>
      {footer ? (
        <div className="sticky bottom-0 z-(--z-sticky) w-full shrink-0 bg-earth-deep/90 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-page items-center justify-center px-group py-snug sm:px-block sm:py-group lg:px-chapter">{footer}</div>
        </div>
      ) : null}
    </div>
  )
}
