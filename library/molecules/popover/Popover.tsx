import * as PopoverPrimitive from "@radix-ui/react-popover"
import type { ComponentProps } from "react"
import { cn } from "../../lib/cn"

export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger
export const PopoverClose = PopoverPrimitive.Close
/** Para que el panel se alinee con otro elemento que no es el que lo abre (un campo entero). */
export const PopoverAnchor = PopoverPrimitive.Anchor

/**
 * Panel flotante con contenido que se puede tocar (filtros, un formulario corto,
 * ayuda con un link). Si es solo una frase, Tooltip. Si bloquea la pantalla, Dialog.
 */
export function PopoverContent({ className, sideOffset = 6, ...props }: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        sideOffset={sideOffset}
        collisionPadding={8}
        className={cn(
          "z-(--z-overlay) w-72 max-w-[calc(100vw-2*var(--space-group))] rounded-control border border-line bg-canvas-overlay p-group text-ink shadow-overlay outline-none",
          "data-[state=open]:animate-enter [--motion-rise-from:-4px]",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
