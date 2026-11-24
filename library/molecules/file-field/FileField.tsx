import { CircleAlert, FileText, Upload, X } from "lucide-react"
import { useId, useRef, useState, type ComponentProps } from "react"
import { cn } from "../../lib/cn"
import { Button } from "../../atoms/button/Button"
import { Icon } from "../../atoms/icon/Icon"
import { Spinner } from "../../atoms/spinner/Spinner"

export type FileItem = {
  id: string
  name: string
  /** Vista previa (URL.createObjectURL o la URL guardada). Si no es imagen, se muestra un ícono. */
  previewUrl?: string
  status?: "uploading" | "error" | "done"
  /** Por qué falló, si status es "error". */
  errorText?: string
}

export type FileFieldProps = {
  files: readonly FileItem[]
  /**
   * Llegan los archivos que pasaron las validaciones (tipo, tamaño, cantidad).
   * Lo que haga falta después (comprimir fotos, subir) lo hace quien usa el campo.
   */
  onAdd: (files: File[]) => void
  onRemove: (id: string) => void
  /** Tipos aceptados, como en <input accept>: "image/*", ".pdf". */
  accept?: string
  /** Texto corto de los tipos para mostrar: «JPG, PNG o HEIC». */
  acceptLabel?: string
  multiple?: boolean
  maxFiles?: number
  maxSizeMB?: number
  /** En el celular, abre la cámara directo (fotos de avance). */
  capture?: ComponentProps<"input">["capture"]
  disabled?: boolean
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean | "true" | "false"
  className?: string
}

function matchesAccept(file: File, accept: string | undefined): boolean {
  if (!accept) return true
  return accept.split(",").some((rule) => {
    const type = rule.trim().toLowerCase()
    if (type.startsWith(".")) return file.name.toLowerCase().endsWith(type)
    if (type.endsWith("/*")) return file.type.startsWith(type.slice(0, -1))
    return file.type === type
  })
}

/**
 * Subir archivos: fotos de avance, planos, logos. Reemplaza las 6 formas distintas
 * que tiene hoy la app. Se elige con el botón o se arrastra; valida tipo, tamaño y
 * cantidad con mensajes en español; muestra vista previa y deja quitar cada uno.
 */
export function FileField({
  files,
  onAdd,
  onRemove,
  accept,
  acceptLabel,
  multiple = false,
  maxFiles = multiple ? 10 : 1,
  maxSizeMB = 10,
  capture,
  disabled,
  id,
  className,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
}: FileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const hintId = useId()
  const errorId = useId()
  const [dragging, setDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const remaining = maxFiles - files.length
  const full = remaining <= 0

  const take = (list: FileList | null) => {
    if (!list || disabled) return
    const problems: string[] = []
    const accepted: File[] = []
    for (const file of Array.from(list)) {
      if (!matchesAccept(file, accept)) problems.push(`«${file.name}» no es de un tipo permitido${acceptLabel ? ` (${acceptLabel})` : ""}.`)
      else if (file.size > maxSizeMB * 1024 * 1024) problems.push(`«${file.name}» pesa más de ${maxSizeMB} MB.`)
      else accepted.push(file)
    }
    if (accepted.length > remaining) {
      problems.push(`Podés agregar ${remaining === 1 ? "1 archivo más" : `${remaining} archivos más`} (máximo ${maxFiles}).`)
      accepted.splice(remaining)
    }
    setErrors(problems)
    if (accepted.length) onAdd(accepted)
  }

  const hint = [acceptLabel, `hasta ${maxSizeMB} MB`, multiple ? `máximo ${maxFiles}` : null].filter(Boolean).join(" · ")

  return (
    <div className={cn("flex flex-col gap-snug", className)}>
      {!full ? (
        <div
          onDragOver={(event) => {
            event.preventDefault()
            if (!disabled) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            take(event.dataTransfer.files)
          }}
          className={cn(
            "motion-color flex flex-col items-center gap-compact rounded-surface border border-dashed border-line-strong bg-canvas-raised px-group py-block text-center",
            dragging && "border-action bg-action-soft",
            (ariaInvalid === true || ariaInvalid === "true" || errors.length > 0) && "border-fn-danger",
            disabled && "opacity-(--state-disabled-opacity)",
          )}
        >
          <Icon icon={Upload} size="lg" className="text-ink-muted" />
          <Button
            id={id}
            variant="outline"
            size="compact"
            disabled={disabled}
            aria-describedby={[hintId, errors.length ? errorId : undefined, describedBy].filter(Boolean).join(" ")}
            onClick={() => inputRef.current?.click()}
          >
            {multiple ? "Elegir archivos" : "Elegir archivo"}
          </Button>
          <p className="text-meta text-ink-muted">
            <span className="hidden sm:inline">o arrastralos acá · </span>
            <span id={hintId}>{hint}</span>
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            capture={capture}
            disabled={disabled}
            tabIndex={-1}
            className="sr-only"
            aria-hidden
            onChange={(event) => {
              take(event.target.files)
              event.target.value = ""
            }}
          />
        </div>
      ) : (
        <p className="text-meta text-ink-muted">Llegaste al máximo de {maxFiles} {maxFiles === 1 ? "archivo" : "archivos"}.</p>
      )}

      {errors.length > 0 ? (
        <ul id={errorId} role="alert" className="flex flex-col gap-related">
          {errors.map((error) => (
            <li key={error} className="flex items-start gap-related text-meta text-fn-danger">
              <Icon icon={CircleAlert} size="xs" className="mt-0.5" />
              {error}
            </li>
          ))}
        </ul>
      ) : null}

      {files.length > 0 ? (
        <ul className="grid grid-cols-3 gap-compact sm:grid-cols-4">
          {files.map((file) => (
            <li key={file.id} className="relative flex flex-col gap-related">
              <div
                className={cn(
                  "relative aspect-square overflow-hidden rounded-control border border-line bg-canvas-sunken",
                  file.status === "error" && "border-fn-danger",
                )}
              >
                {file.previewUrl ? (
                  // Vista previa de un archivo local (blob:): next/image no la puede optimizar.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={file.previewUrl} alt={file.name} className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-ink-muted">
                    <Icon icon={FileText} size="lg" label={file.name} />
                  </span>
                )}
                {file.status === "uploading" ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-scrim text-ink-inverse">
                    <Spinner label={`Subiendo ${file.name}`} />
                  </span>
                ) : null}
              </div>
              <span className={cn("truncate text-meta", file.status === "error" ? "text-fn-danger" : "text-ink-muted")}>
                {file.status === "error" ? (file.errorText ?? "No se pudo subir") : file.name}
              </span>
              <button
                type="button"
                onClick={() => onRemove(file.id)}
                aria-label={`Quitar ${file.name}`}
                className="focus-ring absolute top-related right-related inline-flex size-7 items-center justify-center rounded-pill bg-canvas-overlay text-ink shadow-thumb"
              >
                <Icon icon={X} size="xs" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
