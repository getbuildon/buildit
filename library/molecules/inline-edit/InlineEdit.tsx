import { CircleAlert, Pencil } from "lucide-react"
import { useId, useRef, useState } from "react"
import { cn } from "../../lib/cn"
import { Icon } from "../../atoms/icon/Icon"
import { Spinner } from "../../atoms/spinner/Spinner"
import { InputGroup } from "../input-group/InputGroup"

export type InlineEditProps = {
  value: string
  /** Guarda. Puede ser async; si tira un error, se muestra y el campo queda abierto. */
  onSave: (value: string) => void | Promise<void>
  /** Qué se edita: «Nombre de la unidad». Lo lee el lector de pantalla. */
  label: string
  placeholder?: string
  /** Devuelve el mensaje si el valor no sirve: «El nombre no puede quedar vacío». */
  validate?: (value: string) => string | undefined
  className?: string
}

/**
 * Editar un dato en el lugar, sin abrir un formulario: el nombre de una unidad,
 * el de un rubro. Clic o Enter para editar; Enter o salir del campo guarda; Escape
 * cancela. Mientras guarda muestra el spinner; si falla, el error queda escrito.
 */
export function InlineEdit({ value, onSave, label, placeholder = "Sin dato", validate, className }: InlineEditProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const errorId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)

  const finish = (focusBack: boolean) => {
    setEditing(false)
    setError(undefined)
    if (focusBack) requestAnimationFrame(() => triggerRef.current?.focus())
  }

  const save = async () => {
    const next = draft.trim()
    if (next === value) return finish(true)
    const message = validate?.(next)
    if (message) return setError(message)
    setSaving(true)
    try {
      await onSave(next)
      setSaving(false)
      finish(true)
    } catch (cause) {
      setSaving(false)
      setError(cause instanceof Error ? cause.message : "No se pudo guardar. Intentá de nuevo.")
    }
  }

  if (!editing) {
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setDraft(value)
          setEditing(true)
        }}
        aria-label={`${label}: ${value || placeholder}. Editar`}
        className={cn(
          "group/edit focus-ring state-veil -mx-compact inline-flex h-control-compact max-w-full cursor-text items-center gap-compact rounded-compact px-compact text-left text-body",
          !value && "text-ink-subtle",
          className,
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <Icon icon={Pencil} size="xs" className="text-ink-muted opacity-0 transition-opacity group-hover/edit:opacity-100 group-focus-visible/edit:opacity-100" />
      </button>
    )
  }

  return (
    <div className={cn("flex flex-col gap-related", className)}>
      <InputGroup
        aria-label={label}
        aria-describedby={error ? errorId : undefined}
        invalid={Boolean(error)}
        size="compact"
        value={draft}
        placeholder={placeholder}
        autoFocus
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => {
          setDraft(event.target.value)
          setError(undefined)
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            void save()
          }
          if (event.key === "Escape") {
            event.preventDefault()
            finish(true)
          }
        }}
        onBlur={() => {
          if (!saving) void save()
        }}
        readOnly={saving}
        end={saving ? <Spinner label="Guardando" /> : null}
      />
      {error ? (
        <p id={errorId} className="flex items-start gap-related text-meta text-fn-danger">
          <Icon icon={CircleAlert} size="xs" className="mt-0.5" />
          {error}
        </p>
      ) : null}
    </div>
  )
}
