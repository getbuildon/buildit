import { cva } from "class-variance-authority"
import type { ComponentProps } from "react"
import { cn } from "../../lib/cn"

/*
 * Campo de texto. Mismo aspecto que la app (44 de alto, radio 10, borde de línea,
 * borde naranja con foco), con dos arreglos:
 * - el foco suma el anillo: el borde naranja solo no llega al contraste 3:1
 *   que pide WCAG para indicar foco (hoy hay 44 `focus-visible:ring-0`);
 * - el error se marca con aria-invalid, que también lo anuncia el lector de pantalla.
 */
export const fieldStyles = cva(
  [
    "focus-ring motion-color w-full min-w-0 rounded-control border border-line bg-canvas-raised text-field text-ink",
    "placeholder:text-ink-subtle",
    "hover:border-line-strong focus-visible:border-action",
    "disabled:cursor-not-allowed disabled:bg-canvas-sunken disabled:opacity-(--state-disabled-opacity)",
    // Solo campos con el atributo readonly: :read-only también matchea botones (el Select).
    "[&[readonly]]:bg-canvas-sunken",
    "aria-invalid:border-fn-danger aria-invalid:hover:border-fn-danger",
  ],
  {
    variants: {
      size: {
        compact: "h-control-compact px-snug",
        default: "h-control px-snug",
      },
    },
    defaultVariants: { size: "default" },
  },
)

export type InputProps = Omit<ComponentProps<"input">, "size"> & {
  size?: "compact" | "default"
  /** Marca el campo con error. El mensaje va en un FieldError (molécula Field). */
  invalid?: boolean
}

export function Input({ size, invalid, className, "aria-invalid": ariaInvalid, ...props }: InputProps) {
  return (
    <input
      data-slot="input"
      aria-invalid={invalid || ariaInvalid || undefined}
      className={cn(fieldStyles({ size }), className)}
      {...props}
    />
  )
}

export type TextareaProps = ComponentProps<"textarea"> & { invalid?: boolean }

/** Texto largo. Crece hacia abajo y la persona lo puede agrandar. */
export function Textarea({ invalid, className, "aria-invalid": ariaInvalid, rows = 3, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      rows={rows}
      aria-invalid={invalid || ariaInvalid || undefined}
      className={cn(fieldStyles(), "h-auto min-h-control resize-y px-snug py-snug", className)}
      {...props}
    />
  )
}
