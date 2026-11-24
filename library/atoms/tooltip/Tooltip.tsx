import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import type { ReactNode } from "react"
import { cn } from "../../lib/cn"

export type TooltipProps = {
  /** Lo que dice. Corto: una frase. */
  content: ReactNode
  /** El elemento que lo dispara. Tiene que poder recibir foco (botón, link, campo). */
  children: ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  /** Espera antes de abrir, en ms. */
  delay?: number
  className?: string
}

/**
 * Un solo tooltip para toda la app (hoy hay cuatro variantes y 28 `title=` nativos).
 * Abre con mouse y con foco de teclado, se cierra con Escape y el lector de pantalla
 * lo lee como descripción del elemento. No lleva acciones adentro: para eso, popover.
 */
export function Tooltip({ content, children, side = "top", align = "center", delay = 300, className }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delay} skipDelayDuration={150}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={6}
            collisionPadding={8}
            className={cn(
              "z-(--z-toast) max-w-64 rounded-compact bg-canvas-inverse px-compact py-related text-meta text-ink-inverse shadow-overlay",
              "animate-enter [--motion-rise-from:2px]",
              className,
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-canvas-inverse" width={10} height={5} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
