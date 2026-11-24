import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, Minus } from "lucide-react"
import type { ComponentProps } from "react"
import { cn } from "../../lib/cn"

/**
 * Casilla. Una sola para toda la app (hoy hay tres distintas: negra de 2px y
 * naranjas de 4px, armadas a mano con role="checkbox").
 *
 * - 16 px de dibujo y 24 px tocables (WCAG 2.2, tamaño mínimo de objetivo).
 * - Borde con contraste 3:1 contra el fondo, como pide WCAG para controles.
 * - checked="indeterminate" para "algunos elegidos" (seleccionar todo en tablas).
 */
export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer focus-ring motion-color relative inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-box border border-ink-subtle bg-canvas-raised text-action-ink",
        "after:absolute after:-inset-1 after:content-['']",
        "hover:border-ink-muted",
        "data-[state=checked]:border-action data-[state=checked]:bg-action data-[state=indeterminate]:border-action data-[state=indeterminate]:bg-action",
        "disabled:cursor-not-allowed disabled:opacity-(--state-disabled-opacity)",
        "aria-invalid:border-fn-danger",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        {props.checked === "indeterminate" ? (
          <Minus className="size-3" style={{ strokeWidth: 3 }} aria-hidden />
        ) : (
          <Check className="size-3" style={{ strokeWidth: 3 }} aria-hidden />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
