import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import type { ComponentProps } from "react"
import { cn } from "../../lib/cn"

/**
 * Grupo de opciones donde se elige una. Las flechas mueven la selección, como en
 * cualquier sistema operativo. Siempre con un nombre: aria-label o aria-labelledby.
 */
export function RadioGroup({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root data-slot="radio-group" className={cn("flex flex-col gap-snug", className)} {...props} />
}

/** Una opción del grupo. Mismo tamaño y contraste que la casilla. */
export function RadioItem({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio"
      className={cn(
        "peer focus-ring motion-color relative inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-pill border border-ink-subtle bg-canvas-raised",
        "after:absolute after:-inset-1 after:content-['']",
        "hover:border-ink-muted data-[state=checked]:border-action",
        "disabled:cursor-not-allowed disabled:opacity-(--state-disabled-opacity)",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="size-2 rounded-pill bg-action" />
    </RadioGroupPrimitive.Item>
  )
}
