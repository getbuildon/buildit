import * as LabelPrimitive from "@radix-ui/react-label"
import type { ComponentProps } from "react"
import { cn } from "../../lib/cn"

export type LabelProps = ComponentProps<typeof LabelPrimitive.Root> & {
  /** Muestra el asterisco. El campo igual tiene que llevar `required`. */
  required?: boolean
  /** Muestra "(opcional)". Usar cuando la mayoría de los campos son obligatorios. */
  optional?: boolean
  /** field: nombre de un campo (500). option: texto de una casilla, radio o switch (400). */
  variant?: "field" | "option"
}

/** Nombre de un campo. Siempre asociado con htmlFor: clic en el label enfoca el campo. */
export function Label({ required, optional, variant = "field", className, children, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "inline-flex items-baseline gap-related text-ink select-none",
        variant === "field" ? "text-label" : "text-body",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-(--state-disabled-opacity)",
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <span aria-hidden className="text-fn-danger">
          *
        </span>
      ) : null}
      {optional && !required ? <span className="text-meta text-ink-muted">(opcional)</span> : null}
    </LabelPrimitive.Root>
  )
}
