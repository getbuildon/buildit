import { Slot } from "@radix-ui/react-slot"
import type { LucideIcon } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "../../lib/cn"
import { Icon } from "../../atoms/icon/Icon"

export type SidebarProps = {
  /** Arriba: la marca, la obra actual o un selector. */
  header?: ReactNode
  /** Abajo: el usuario y su menú. */
  footer?: ReactNode
  /** Nombre del menú para el lector de pantalla: «Secciones de la obra». */
  label: string
  /**
   * default: claro (la obra). inverse: oscuro (el backoffice), sin colores aparte:
   * es el modo oscuro de la librería aplicado solo al menú.
   */
  tone?: "default" | "inverse"
  /**
   * flush: pegado al borde, 220 px, con línea divisoria.
   * floating: el de hoy en la obra, un panel de 254 px que flota con 12 px de aire,
   * radio 24 y sombra difusa.
   */
  variant?: "flush" | "floating"
  children: ReactNode
  className?: string
}

/**
 * Menú lateral de 220 px. Une el de la obra (claro, con estilos sueltos en el código)
 * y el del backoffice (oscuro, armado aparte): mismo componente, dos tonos.
 * En el celular va dentro de un Sheet.
 */
export function Sidebar({ header, footer, label, tone = "default", variant = "flush", children, className }: SidebarProps) {
  const floating = variant === "floating"
  // Es un div y no un <aside>: el landmark es el <nav> de adentro. Con <aside> quedaban
  // dos zonas «complementarias» sin nombre cuando la pantalla tiene columna lateral.
  const panel = (
    <div
      data-theme={tone === "inverse" ? "oscuro" : undefined}
      className={cn(
        "flex h-full shrink-0 flex-col text-ink",
        floating
          ? "w-(--layout-sidebar-floating) overflow-hidden rounded-panel bg-canvas-raised shadow-panel"
          : // Línea divisoria en los dos tonos: en modo oscuro, el menú inverso y el contenido
            // tienen el mismo fondo y sin la línea no se ve dónde termina el menú.
            "w-(--layout-sidebar) border-r border-line bg-canvas",
        className,
      )}
    >
      {header ? (
        <div className={cn("flex shrink-0 items-center gap-snug", floating ? "border-b border-line p-group" : "px-group pt-group pb-snug")}>{header}</div>
      ) : null}
      <nav
        aria-label={label}
        className={cn("flex min-h-0 flex-1 flex-col gap-group overflow-y-auto", floating ? "px-snug pt-group pb-snug" : "px-snug py-compact")}
      >
        {children}
      </nav>
      {footer ? <div className={cn("shrink-0 border-t border-line", floating ? "px-snug py-group" : "p-snug")}>{footer}</div> : null}
    </div>
  )
  return floating ? <div className="flex h-full shrink-0 py-snug pl-snug">{panel}</div> : panel
}

/** Grupo de ítems con título opcional («Obra», «Configuración»). */
export function SidebarSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-related">
      {title ? <p className="px-snug pb-related text-micro text-ink-muted uppercase">{title}</p> : null}
      <ul className="flex flex-col gap-related">{children}</ul>
    </div>
  )
}

export type SidebarItemProps = ComponentProps<"a"> & {
  icon?: LucideIcon
  /** La sección en la que se está. Marca aria-current="page". */
  active?: boolean
  /** Contador a la derecha: avances pendientes. */
  count?: number
  /** Para envolver el Link de next/link. */
  asChild?: boolean
}

/**
 * Ítem del menú. Activo: pastilla oscura con texto claro, como hoy (en el tono
 * inverse se invierte sola). 40 px de alto, radio 10.
 */
export function SidebarItem({ icon, active = false, count, asChild = false, className, children, ...props }: SidebarItemProps) {
  const Comp = asChild ? Slot : "a"
  return (
    <li>
      <Comp
        aria-current={active ? "page" : undefined}
        className={cn(
          "focus-ring motion-color motion-press flex min-h-10 items-center gap-snug rounded-control px-snug text-body",
          active ? "bg-canvas-inverse text-ink-inverse" : "state-veil text-ink",
          className,
        )}
        {...props}
      >
        {icon ? <Icon icon={icon} className={active ? undefined : "text-ink-muted"} /> : null}
        <span className="min-w-0 flex-1 truncate">{children}</span>
        {count !== undefined && count > 0 ? (
          <span
            className={cn(
              "min-w-5 rounded-pill px-related text-center text-micro tabular-nums",
              active ? "bg-canvas text-ink" : "bg-action-soft text-action-text",
            )}
          >
            {count}
            <span className="sr-only"> pendientes</span>
          </span>
        ) : null}
      </Comp>
    </li>
  )
}
