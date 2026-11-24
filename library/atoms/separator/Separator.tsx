import * as SeparatorPrimitive from "@radix-ui/react-separator"
import type { ComponentProps } from "react"
import { cn } from "../../lib/cn"

/**
 * Línea que separa. Decorativa por defecto (el lector de pantalla la saltea);
 * con decorative={false} anuncia un corte de sección.
 */
export function Separator({
  orientation = "horizontal",
  decorative = true,
  className,
  ...props
}: ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      orientation={orientation}
      decorative={decorative}
      className={cn("shrink-0 bg-line", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className)}
      {...props}
    />
  )
}
