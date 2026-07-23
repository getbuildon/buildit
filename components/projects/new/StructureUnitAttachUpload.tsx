"use client"

import { useId, useState } from "react"
import { Loader2, Upload, X } from "lucide-react"
import {
  compressUnitPlanPhoto,
  revokeUnitRenderPreview,
  type UnitRenderImageDraft,
} from "@/lib/projects/unitPlanPhoto.client"
import {
  structureAttachButtonClassName,
  structureAttachButtonStyle,
} from "@/lib/projects/structureStepTokens"
import { cn } from "@/lib/utils"

type StructureUnitAttachUploadProps = {
  value: UnitRenderImageDraft | null
  existingUrl?: string | null
  onChange: (value: UnitRenderImageDraft | null) => void
  onRemoveExisting?: () => void
  disabled?: boolean
}

export function StructureUnitAttachUpload({
  value,
  existingUrl = null,
  onChange,
  onRemoveExisting,
  disabled = false,
}: StructureUnitAttachUploadProps) {
  const inputId = useId()
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

  const handleSelectFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="flex flex-col gap-1">
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/*"
        className="sr-only"
        disabled={disabled || processing}
        onChange={handleSelectFiles}
      />

      {previewUrl ? (
        <div
          className="relative flex h-[30px] w-full min-w-0 items-center overflow-hidden rounded-[4px] border bg-white"
          style={structureAttachButtonStyle}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="" className="size-full object-cover" />
          {!disabled ? (
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Quitar archivo"
              className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-[#272a2d]/70 text-white"
            >
              <X className="size-2.5" aria-hidden />
            </button>
          ) : null}
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={cn(
            structureAttachButtonClassName,
            (disabled || processing) && "pointer-events-none opacity-70",
          )}
          style={structureAttachButtonStyle}
        >
          {processing ? (
            <Loader2 className="size-3 animate-spin" aria-hidden />
          ) : (
            <Upload className="size-3 shrink-0" aria-hidden />
          )}
          {processing ? "..." : "Adjuntar"}
        </label>
      )}

      {error ? <p className="max-w-[120px] text-[11px] text-[#641723]">{error}</p> : null}
    </div>
  )
}
