import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "../../lib/cn"
import { Icon } from "../../atoms/icon/Icon"

/**
 * Secciones que se abren y se cierran (rubros con sus tareas, preguntas frecuentes).
 * Reemplaza AnimatedCollapsible: suma teclado, aria-expanded y la animación de alto
 * sin medir a mano. Con reduced-motion abre sin animar.
 */
export function Accordion({ className, ...props }: ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      className={cn("divide-y divide-line overflow-hidden rounded-surface border border-line bg-canvas-raised", className)}
      {...props}
    />
  )
}

export type AccordionItemProps = Omit<ComponentProps<typeof AccordionPrimitive.Item>, "title"> & {
  title: ReactNode
  /** Dato a la derecha del título: «8 tareas», «45%». */
  meta?: ReactNode
}

export function AccordionItem({ title, meta, className, children, ...props }: AccordionItemProps) {
  return (
    <AccordionPrimitive.Item className={cn("group/item", className)} {...props}>
      <AccordionPrimitive.Header className="flex">
        {/* El velo de hover solo con la sección cerrada: abierta, el velo cortaba el título
            del contenido y el texto parecía pegado a una franja. */}
        <AccordionPrimitive.Trigger className="focus-ring data-[state=closed]:state-veil flex min-h-control flex-1 cursor-pointer items-center gap-snug px-group py-snug text-left text-label">
          <span className="min-w-0 flex-1">{title}</span>
          {meta ? <span className="text-meta text-ink-muted">{meta}</span> : null}
          <Icon
            icon={ChevronDown}
            className="text-ink-muted transition-transform duration-(--duration-base) ease-standard group-data-[state=open]/item:rotate-180"
          />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      {/* Aire: 12 arriba del título, 8 entre título y contenido (van juntos), 12 abajo. */}
      <AccordionPrimitive.Content className="-mt-related overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down motion-reduce:animate-none">
        <div className="px-group pb-snug text-body text-ink-muted">{children}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  )
}
