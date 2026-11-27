"use client"

import { useRef, useState, type ChangeEvent } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/library/atoms/button/Button"
import { IconButton } from "@/library/atoms/button/IconButton"
import { Icon } from "@/library/atoms/icon/Icon"
import {
  compressUnitPlanPhoto,
  revokeUnitRenderPreview,
  type UnitRenderImageDraft,
} from "@/lib/projects/unitPlanPhoto.client"

type AdjuntarImagenProps = {
  value: UnitRenderImageDraft | null
  existingUrl?: string | null
  onChange: (value: UnitRenderImageDraft | null) => void
  onRemoveExisting?: () => void
  /** Para el lector de pantalla: «planta del local 101». */
  descripcion: string
  disabled?: boolean
}

/**
 * Adjuntar una imagen al local (planta o render). Comprime la foto antes de guardarla
 * y muestra una miniatura con el botón para quitarla. Misma lógica que el adjunto anterior.
 */
export function AdjuntarImagen({
  value,
  existingUrl = null,
  onChange,
  onRemoveExisting,
  descripcion,
  disabled = false,
}: AdjuntarImagenProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewUrl = value?.previewUrl ?? existingUrl

  const handleFile = async (file: File | null) => {
    if (!file || disabled || processing) return

    setError(null)

    if (!file.type.startsWith("image/")) {
      setError(`"${file.name}" no es una imagen válida.`)
      return
    }

    setProcessing(true)

    try {
      const compressed = await compressUnitPlanPhoto(file)
      revokeUnitRenderPreview(value)
      onChange({
        file: compressed,
        previewUrl: URL.createObjectURL(compressed),
        fileName: file.name,
        fileSize: compressed.size,
        fileType: compressed.type || "image/webp",
      })
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "No se pudo procesar la imagen."
      setError(message)
    } finally {
      setProcessing(false)
    }
  }

  const handleSelectFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    event.target.value = ""
    await handleFile(file)
  }

  const handleRemove = () => {
    if (value) {
      revokeUnitRenderPreview(value)
      onChange(null)
    } else if (existingUrl) {
      onRemoveExisting?.()
    }
    setError(null)
  }

  return (
    <div className="flex flex-col gap-related">
      <input
        ref={inputRef}
        type="file"
        tabIndex={-1}
        aria-hidden
        accept="image/jpeg,image/png,image/webp,image/heic,image/*"
        className="sr-only"
        disabled={disabled || processing}
        onChange={handleSelectFiles}
      />

      {previewUrl ? (
        <div className="flex items-center gap-related">
          <div className="h-control-compact min-w-0 flex-1 overflow-hidden rounded-control border border-line bg-canvas-raised">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={descripcion} className="size-full object-cover" />
          </div>
          {!disabled ? (
            <IconButton
              icon={X}
              label={`Quitar ${descripcion}`}
              size="compact"
              onClick={handleRemove}
            />
          ) : null}
        </div>
      ) : (
        <Button
          variant="outline"
          size="compact"
          disabled={disabled}
          loading={processing}
          loadingLabel="Procesando imagen"
          onClick={() => inputRef.current?.click()}
        >
          {processing ? null : <Icon icon={Upload} size="xs" />}
          {processing ? "..." : "Adjuntar"}
          <span className="sr-only"> {descripcion}</span>
        </Button>
      )}

      {error ? (
        <p role="alert" className="max-w-30 text-meta text-fn-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
