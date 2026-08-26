"use client"

import { useId, useRef, useState } from "react"
import { ImageIcon, Loader2, X } from "lucide-react"
import { FieldErrorTooltip } from "@/components/ui/field-error-tooltip"
import {
  compressPortalNewsImage,
  revokePortalNewsPreview,
  type PortalNewsImageDraft,
} from "@/lib/projects/portalNewsPhoto.client"
import { cn } from "@/lib/utils"

type PortalNewsImageUploadProps = {
  value: PortalNewsImageDraft | null
  onChange: (value: PortalNewsImageDraft | null) => void
  existingImageUrl?: string | null
  onExistingImageRemove?: () => void
  disabled?: boolean
  className?: string
  errorMessage?: string | null
}

export function PortalNewsImageUpload({
  value,
  onChange,
  existingImageUrl = null,
  onExistingImageRemove,
  disabled = false,
  className,
  errorMessage = null,
}: PortalNewsImageUploadProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayError = error ?? errorMessage
  const hasError = Boolean(displayError)

  const handleFile = async (file: File | null) => {
    if (!file || disabled || processing) return

    setError(null)

    if (!file.type.startsWith("image/")) {
      setError(`"${file.name}" no es una imagen válida.`)
      return
    }

    setProcessing(true)

    try {
      const compressed = await compressPortalNewsImage(file)
      revokePortalNewsPreview(value)
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

  const handleSelectFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    event.target.value = ""
    await handleFile(file)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!disabled && !processing) setDragActive(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (event.currentTarget.contains(event.relatedTarget as Node)) return
    setDragActive(false)
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragActive(false)
    if (disabled || processing) return
    const file = event.dataTransfer.files?.[0] ?? null
    await handleFile(file)
  }

  const handleRemove = () => {
    revokePortalNewsPreview(value)
    onChange(null)
    onExistingImageRemove?.()
    setError(null)
  }

  const previewUrl = value?.previewUrl ?? existingImageUrl
  const previewAlt = value?.fileName ?? "Imagen de la novedad"

  const openFilePicker = () => {
    if (disabled || processing) return
    inputRef.current?.click()
  }

  const borderClassName = hasError
    ? "border-[#eb8e90]"
    : dragActive
      ? "border-[#ff7433]"
      : "border-[#cad5e2]"

  const zoneClassName = cn(
    "relative h-full min-h-[122px] w-full overflow-hidden rounded-[10px] border",
    previewUrl ? "border-solid bg-[#f5f6f7]" : "border-dashed bg-transparent",
    borderClassName,
  )

  return (
    <div
      className={cn(
        "relative flex w-full shrink-0 self-stretch min-h-[122px] min-[640px]:h-full min-[640px]:w-[220px]",
        className,
      )}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="sr-only"
        disabled={disabled || processing}
        onChange={handleSelectFiles}
      />

      {hasError && displayError ? (
        <span className="pointer-events-auto absolute top-2 right-2 z-20">
          <FieldErrorTooltip message={displayError} />
        </span>
      ) : null}

      {previewUrl ? (
        <div
          className={zoneClassName}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={previewAlt}
            className="absolute inset-0 size-full object-cover"
          />
          {!disabled ? (
            <>
              <button
                type="button"
                onClick={handleRemove}
                aria-label="Quitar imagen"
                className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-[#272a2d]/70 text-white transition-colors hover:bg-[#272a2d]"
              >
                <X className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={openFilePicker}
                disabled={processing}
                className="absolute inset-x-0 bottom-0 bg-[#272a2d]/55 px-3 py-2 text-[13px] font-normal text-white transition-colors hover:bg-[#272a2d]/70 disabled:opacity-70"
              >
                {processing ? "Procesando imagen..." : "Cambiar imagen"}
              </button>
            </>
          ) : null}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled || processing ? -1 : 0}
          onClick={openFilePicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              openFilePicker()
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            zoneClassName,
            "flex flex-col items-center justify-center gap-1 px-6 py-2 transition-colors",
            dragActive && "bg-[#fff8f4]",
            processing && "pointer-events-none opacity-70",
            disabled && "cursor-not-allowed opacity-50",
            !disabled && !processing && "cursor-pointer",
          )}
          aria-label="Subir imagen de la novedad"
          aria-invalid={hasError}
        >
          {processing ? (
            <Loader2 className="size-5 animate-spin text-[#777b84]" aria-hidden />
          ) : (
            <ImageIcon className="size-5 shrink-0 text-[#777b84]" aria-hidden />
          )}
          <p className="text-center text-[10px] leading-[1.4] tracking-[-0.5px] text-[#696e77]">
            {processing
              ? "Procesando imagen..."
              : "Hacé click para seleccionar la imagen o arrastrala"}
          </p>
          <p className="text-center text-[8px] leading-[1.4] tracking-[-0.4px] text-[#777b84]">
            PNG, JPG hasta 10 MB
          </p>
        </div>
      )}
    </div>
  )
}
