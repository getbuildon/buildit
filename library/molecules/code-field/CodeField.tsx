import { CircleAlert } from "lucide-react"
import { Fragment, useId, useRef, type ClipboardEvent, type KeyboardEvent, type ReactNode } from "react"
import { cn } from "../../lib/cn"
import { Icon } from "../../atoms/icon/Icon"
import { fieldStyles } from "../../atoms/input/Input"

export type CodeFieldProps = {
  /** Cuántos dígitos tiene el código. */
  length?: number
  value: string
  /** Recibe solo dígitos, ya recortado al largo. */
  onChange: (value: string) => void
  /** Al completar los dígitos: se envía solo, como Slack y Stripe. */
  onComplete?: (value: string) => void
  label?: string
  description?: ReactNode
  /** El código no sirvió: se marcan los casilleros y se dice por qué. */
  error?: string
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}

/**
 * El código que llega por mail, un casillero por dígito, como Slack, Stripe y Shopify
 * (y como Rootsy): grande, en dos grupos de tres, y rápido.
 * - Pegar el código entero (o que el celular lo ofrezca: «Del mail: 123456») lo reparte.
 * - Al escribir pasa al siguiente; borrar en uno vacío vuelve al anterior; las flechas mueven.
 * - Solo números: «123 456» o «123-456» también sirven.
 * Los casilleros son el campo de texto de la librería (mismo borde, foco y error).
 */
export function CodeField({
  length = 6,
  value,
  onChange,
  onComplete,
  label = "Código",
  description,
  error,
  disabled,
  autoFocus,
  className,
}: CodeFieldProps) {
  const casilleros = useRef<(HTMLInputElement | null)[]>([])
  const id = useId()
  const rotuloId = `${id}-label`
  const descripcionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined
  const digitos = Array.from({ length }, (_, i) => value[i] ?? "")

  const enfocar = (i: number) => {
    const destino = casilleros.current[Math.max(0, Math.min(length - 1, i))]
    destino?.focus()
    destino?.select()
  }

  // Pone `texto` desde el casillero `desde`: un dígito o el código entero pegado.
  const poner = (desde: number, texto: string) => {
    const nuevos = texto.replace(/\D/g, "")
    if (!nuevos) return
    const lista = [...digitos]
    for (let k = 0; k < nuevos.length && desde + k < length; k++) lista[desde + k] = nuevos[k]!
    const siguiente = lista.join("").slice(0, length)
    onChange(siguiente)
    enfocar(Math.min(desde + nuevos.length, length - 1))
    if (lista.every((d) => d !== "")) onComplete?.(siguiente)
  }

  const alTeclear = (i: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault()
      const lista = [...digitos]
      if (lista[i]) {
        lista[i] = ""
      } else if (i > 0) {
        lista[i - 1] = ""
        enfocar(i - 1)
      }
      onChange(lista.join(""))
    } else if (event.key === "ArrowLeft") {
      event.preventDefault()
      enfocar(i - 1)
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      enfocar(i + 1)
    }
  }

  const alPegar = (i: number, event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    poner(i, event.clipboardData.getData("text"))
  }

  // Con seis, dos grupos de tres; con otro largo, uno solo.
  const corte = length === 6 ? 3 : length

  return (
    <div data-slot="code-field" className={cn("flex flex-col gap-compact", className)}>
      <span id={rotuloId} className="text-label text-ink">
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={rotuloId}
        aria-describedby={[descripcionId, errorId].filter(Boolean).join(" ") || undefined}
        // Ocupa todo el ancho del formulario, como los demás campos.
        className="flex w-full items-center gap-1.5 min-[30rem]:gap-2"
      >
        {digitos.map((digito, i) => (
          <Fragment key={i}>
            {i === corte && corte < length ? (
              <span aria-hidden className="shrink-0 text-body text-ink-subtle">
                –
              </span>
            ) : null}
            <input
              ref={(el) => {
                casilleros.current[i] = el
              }}
              className={cn(
                fieldStyles(),
                // Se reparten el ancho por igual; grandes y centrados: se leen y se tocan fácil.
                "h-12 w-auto min-w-0 flex-1 px-0 text-center text-code caret-action min-[30rem]:h-14",
                digito && "border-line-strong",
              )}
              value={digito}
              inputMode="numeric"
              pattern="[0-9]*"
              // El celular ofrece el código del mail en el primero; al tocarlo se reparte.
              autoComplete={i === 0 ? "one-time-code" : "off"}
              aria-label={`Dígito ${i + 1} de ${length}`}
              aria-invalid={error ? true : undefined}
              disabled={disabled}
              autoFocus={autoFocus && i === 0}
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) => poner(i, event.currentTarget.value.slice(-length))}
              onKeyDown={(event) => alTeclear(i, event)}
              onPaste={(event) => alPegar(i, event)}
            />
          </Fragment>
        ))}
      </div>
      {description ? (
        <p id={descripcionId} className="text-meta text-ink-muted">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="flex items-start gap-related text-meta text-fn-danger">
          <Icon icon={CircleAlert} size="xs" className="mt-0.5" />
          {error}
        </p>
      ) : null}
    </div>
  )
}
