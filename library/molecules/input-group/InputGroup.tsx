import { X } from "lucide-react"
import { useRef, type ComponentProps, type ReactNode } from "react"
import { cn } from "../../lib/cn"
import { Icon } from "../../atoms/icon/Icon"

export type InputGroupProps = Omit<ComponentProps<"input">, "size"> & {
  /** Antes del texto: un ícono o un símbolo ($). */
  start?: ReactNode
  /** Después del texto: una unidad (m², %) o un ícono. */
  end?: ReactNode
  size?: "compact" | "default"
  invalid?: boolean
  /** Muestra la cruz para vaciar el campo cuando tiene texto. */
  onClear?: () => void
  /** Clases del contenedor (el borde). className va al input. */
  groupClassName?: string
}

/**
 * Campo con algo pegado adentro: ícono de búsqueda, $ adelante, m² o % atrás.
 * El borde, el foco y el error son del grupo entero; el texto lo sigue escribiendo
 * un input normal, así funcionan el autocompletar y el teclado del celular.
 * Los props (id, aria-*, value) van al input: sirve dentro de un Field.
 */
export function InputGroup({
  start,
  end,
  size = "default",
  invalid,
  onClear,
  groupClassName,
  className,
  "aria-invalid": ariaInvalid,
  value,
  disabled,
  ...props
}: InputGroupProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true"
  const showClear = onClear && value !== undefined && value !== ""

  return (
    <div
      data-slot="input-group"
      data-invalid={isInvalid || undefined}
      aria-disabled={disabled || undefined}
      // Clic en cualquier parte del grupo enfoca el texto.
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          event.preventDefault()
          inputRef.current?.focus()
        }
      }}
      className={cn(
        "motion-color flex w-full min-w-0 cursor-text items-center gap-compact rounded-control border border-line bg-canvas-raised px-snug text-field text-ink",
        size === "compact" ? "h-control-compact" : "h-control",
        "hover:border-line-strong",
        "has-[input:focus-visible]:border-action has-[input:focus-visible]:[box-shadow:var(--focus-ring)]",
        "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:bg-canvas-sunken has-[input:disabled]:opacity-(--state-disabled-opacity)",
        "data-invalid:border-fn-danger",
        // Autocompletado del navegador: se tiñe el grupo entero (con su ícono), no solo el texto.
        "has-[input:autofill]:bg-fn-info-canvas",
        groupClassName,
      )}
    >
      {start ? <span className="flex shrink-0 items-center text-ink-muted [&_svg]:size-icon-sm">{start}</span> : null}
      <input
        ref={inputRef}
        value={value}
        disabled={disabled}
        aria-invalid={isInvalid || undefined}
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-subtle disabled:cursor-not-allowed",
          // El navegador pinta su propio fondo solo detrás del texto: se lo deja transparente
          // (la transición eterna es la forma de anularlo) y el tinte lo pone el grupo.
          "autofill:[transition:background-color_9999s_ease-out_0s] autofill:[-webkit-text-fill-color:var(--color-ink)]",
          className,
        )}
        {...props}
      />
      {showClear ? (
        <button
          type="button"
          onClick={() => {
            onClear()
            inputRef.current?.focus()
          }}
          aria-label="Borrar texto"
          className="focus-ring state-veil -mr-related inline-flex size-6 shrink-0 items-center justify-center rounded-pill text-ink-muted"
        >
          <Icon icon={X} size="xs" />
        </button>
      ) : null}
      {end ? <span className="flex shrink-0 items-center text-ink-muted [&_svg]:size-icon-sm">{end}</span> : null}
    </div>
  )
}
