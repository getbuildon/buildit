import { Slot } from "@radix-ui/react-slot"
import { CircleAlert } from "lucide-react"
import { useId, type ReactElement, type ReactNode } from "react"
import { cn } from "../../lib/cn"
import { Icon } from "../../atoms/icon/Icon"
import { Label } from "../../atoms/label/Label"

export type FieldProps = {
  label: string
  /** Ayuda debajo del campo: formato esperado, para qué se usa. */
  description?: ReactNode
  /** Mensaje de error. Se ve escrito debajo y el lector de pantalla lo lee con el campo. */
  error?: string
  required?: boolean
  optional?: boolean
  /** El control: Input, Textarea, InputGroup, Select. Recibe id y aria-* solo. */
  children: ReactElement
  id?: string
  className?: string
}

/**
 * Campo completo: label, control, ayuda y error, conectados entre sí.
 *
 * Reemplaza el error escondido en un ícono con tooltip de la app (FieldErrorTooltip):
 * el error tiene que estar escrito, a la vista y asociado al campo, para que se
 * entienda sin pasar el mouse y lo lea el lector de pantalla.
 */
export function Field({ label, description, error, required, optional, children, id, className }: FieldProps) {
  const autoId = useId()
  const controlId = id ?? `field-${autoId}`
  const descriptionId = description ? `${controlId}-description` : undefined
  const errorId = error ? `${controlId}-error` : undefined
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined

  return (
    <div data-slot="field" className={cn("flex flex-col gap-compact", className)}>
      <Label htmlFor={controlId} required={required} optional={optional}>
        {label}
      </Label>
      <Slot id={controlId} aria-describedby={describedBy} aria-invalid={error ? true : undefined} aria-required={required || undefined}>
        {children}
      </Slot>
      {description ? (
        <p id={descriptionId} className="text-meta text-ink-muted">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-start gap-related text-meta text-fn-danger">
          <Icon icon={CircleAlert} size="xs" className="mt-0.5" />
          {error}
        </p>
      ) : null}
    </div>
  )
}
