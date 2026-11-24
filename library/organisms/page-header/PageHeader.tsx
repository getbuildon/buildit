import { Slot } from "@radix-ui/react-slot"
import { ChevronLeft, type LucideIcon } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "../../lib/cn"
import { Icon } from "../../atoms/icon/Icon"

export type PageHeaderProps = {
  title: string
  description?: ReactNode
  icon?: LucideIcon
  /** Volver a la pantalla de arriba: un <a> o el Link de next/link con su texto («Unidades»). */
  back?: ReactNode
  /** Acciones de la pantalla. La principal, a la derecha. */
  actions?: ReactNode
  /** Debajo del título: badges de estado, datos clave. */
  meta?: ReactNode
  /** Pestañas o navegación de la sección, pegadas abajo. */
  tabs?: ReactNode
  className?: string
}

/**
 * Encabezado de una pantalla: volver, título, descripción, acciones y pestañas.
 * Un solo h1 por pantalla. En el celular las acciones bajan debajo del título.
 */
export function PageHeader({ title, description, icon, back, actions, meta, tabs, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-group", className)}>
      {back ? (
        <Slot className="focus-ring -ml-related inline-flex w-fit items-center gap-related rounded-box px-related text-label text-ink-muted hover:text-ink">
          {back}
        </Slot>
      ) : null}
      <div className="flex flex-col gap-group sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-compact">
          <div className="flex items-center gap-compact">
            {icon ? <Icon icon={icon} size="lg" className="text-fn-info" /> : null}
            <h1 className="text-title">{title}</h1>
          </div>
          {description ? <p className="max-w-reading text-body text-ink-muted">{description}</p> : null}
          {meta ? <div className="flex flex-wrap items-center gap-compact">{meta}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-snug">{actions}</div> : null}
      </div>
      {tabs}
    </header>
  )
}

/** El link de volver con su flecha. <PageHeader back={<BackLink href="…">Unidades</BackLink>} /> */
export function BackLink({ children, ...props }: ComponentProps<"a">) {
  return (
    <a {...props}>
      <Icon icon={ChevronLeft} />
      {children}
    </a>
  )
}
