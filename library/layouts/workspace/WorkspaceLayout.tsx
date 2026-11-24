import type { ReactNode } from "react"
import { cn } from "../../lib/cn"
import { MAIN_ID, SkipLink } from "../skip-link"

export type WorkspaceLayoutProps = {
  /** El menú lateral (Sidebar). Se ve desde 1024 px; abajo de eso va en el topbar con un Sheet. */
  sidebar?: ReactNode
  /** Barra superior del celular y la tablet (Topbar con el botón de menú). Se oculta desde 1024 px. */
  topbar?: ReactNode
  /** Encabezado de la pantalla (PageHeader). */
  header?: ReactNode
  /** Barra de la lista (ListToolbar), entre el encabezado y el contenido. */
  toolbar?: ReactNode
  /** Columna lateral derecha (detalle, resumen). Desde 1024 px al costado; abajo, debajo del contenido. */
  aside?: ReactNode
  /** Ancho del contenido: page (1280) o reading (720, formularios y configuración). */
  width?: "page" | "reading"
  children: ReactNode
  className?: string
}

/**
 * Estructura de trabajo: la obra, el backoffice y la empresa. Menú a la izquierda,
 * contenido con encabezado y barra, columna opcional a la derecha.
 *
 * Solo ubica: no trae componentes adentro (regla de Rootsy). La pantalla pone el
 * Sidebar, el Topbar, el PageHeader y lo demás en sus lugares.
 * Trae «Saltar al contenido» y un <main> con id para que el salto funcione.
 */
export function WorkspaceLayout({ sidebar, topbar, header, toolbar, aside, width = "page", children, className }: WorkspaceLayoutProps) {
  return (
    <div className={cn("flex h-dvh overflow-hidden bg-canvas text-ink", className)}>
      <SkipLink />
      {sidebar ? <div className="hidden h-full lg:flex">{sidebar}</div> : null}
      <div className="flex min-w-0 flex-1 flex-col">
        {topbar ? <div className="lg:hidden">{topbar}</div> : null}
        {/* relative: los textos solo para lector de pantalla (sr-only, posición absoluta)
            quedan dentro de la zona que scrollea. Sin esto estiraban la página y aparecía
            un segundo scroll. */}
        <main id={MAIN_ID} tabIndex={-1} className="relative min-h-0 flex-1 overflow-y-auto outline-none">
          <div className={cn("mx-auto flex flex-col gap-block px-(--layout-margin) py-block", width === "page" ? "max-w-page" : "max-w-reading")}>
            {header}
            {toolbar}
            {aside ? (
              <div className="grid gap-block lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="flex min-w-0 flex-col gap-block">{children}</div>
                <aside className="flex flex-col gap-group">{aside}</aside>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
