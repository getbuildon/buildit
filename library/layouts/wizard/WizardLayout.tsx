import type { ReactNode } from "react"
import { cn } from "../../lib/cn"
import { MAIN_ID, SkipLink } from "../skip-link"

export type WizardLayoutProps = {
  /** Barra superior: la marca y «Salir». */
  topbar?: ReactNode
  /** Los pasos (Stepper). A la izquierda desde 768 px; arriba en el celular. */
  steps: ReactNode
  /** El paso actual. */
  children: ReactNode
  /** Atrás y Siguiente (WizardFooter), fijos abajo. */
  footer: ReactNode
  className?: string
}

/**
 * Un proceso en pasos que ocupa la pantalla: crear una obra. Pasos al costado, el paso
 * actual al centro (hasta 720 px para que se lea cómodo) y los botones fijos abajo.
 */
export function WizardLayout({ topbar, steps, children, footer, className }: WizardLayoutProps) {
  return (
    <div className={cn("flex h-dvh flex-col overflow-hidden bg-canvas text-ink", className)}>
      <SkipLink />
      {topbar}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="shrink-0 border-b border-line bg-canvas-raised p-group md:w-72 md:overflow-y-auto md:border-r md:border-b-0">{steps}</div>
        <main id={MAIN_ID} tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto outline-none">
          <div className="mx-auto flex max-w-reading flex-col gap-block px-(--layout-margin) py-block">{children}</div>
        </main>
      </div>
      {footer}
    </div>
  )
}
