import * as SwitchPrimitive from "@radix-ui/react-switch"
import type { ComponentProps } from "react"
import { cn } from "../../lib/cn"

/**
 * Interruptor: prende o apaga algo que aplica en el momento (sin botón Guardar).
 * Si el cambio se confirma con Guardar, va una casilla.
 * La pista apagada tiene contraste 3:1 contra el fondo para que se vea el control.
 */
export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer focus-ring motion-color relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-pill p-0.5",
        "after:absolute after:-inset-y-1 after:inset-x-0 after:content-['']",
        "bg-ink-subtle data-[state=checked]:bg-action",
        "disabled:cursor-not-allowed disabled:opacity-(--state-disabled-opacity)",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-4 rounded-pill bg-canvas-raised shadow-thumb",
          "transition-transform duration-(--duration-fast) ease-standard data-[state=checked]:translate-x-4",
        )}
      />
    </SwitchPrimitive.Root>
  )
}
