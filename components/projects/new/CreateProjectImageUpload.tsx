"use client"

import { useId, useRef, useState } from "react"
import { ImageIcon, Loader2, X } from "lucide-react"
import {
  CREATE_PROJECT_COLORS,
  CREATE_PROJECT_TYPE,
} from "@/lib/projects/createProjectTokens"
import {
  compressProjectCoverPhoto,
  revokeProjectCoverPreview,
  type ProjectCoverImageDraft,
} from "@/lib/projects/projectCoverPhoto.client"
import { cn } from "@/lib/utils"

type CreateProjectImageUploadProps = {
  value: ProjectCoverImageDraft | null
  onChange: (value: ProjectCoverImageDraft | null) => void
  disabled?: boolean
}

export function CreateProjectImageUpload({
  value,
  onChange,
  disabled = false,
}: CreateProjectImageUploadProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File | null) => {
    if (!file || disabled || processing) return

    setError(null)

    if (!file.type.startsWith("image/")) {
      setError(`"${file.name}" no es una imagen válida.`)
      return
    }

    setProcessing(true)

    try {
      const compressed = await compressProjectCoverPhoto(file)
      revokeProjectCoverPreview(value)
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
    revokeProjectCoverPreview(value)
    onChange(null)
    setError(null)
  }

  const openFilePicker = () => {
    if (disabled || processing) return
    inputRef.current?.click()
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p
        className={CREATE_PROJECT_TYPE.fieldLabel}
        style={{ color: CREATE_PROJECT_COLORS.label }}
      >
        Imagen del proyecto (Opcional)
      </p>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/*"
        className="sr-only"
        disabled={disabled || processing}
        onChange={handleSelectFiles}
      />

      {value ? (
        <div
          className="relative h-[132px] overflow-hidden rounded-[10px] border border-[#edeef0] bg-[#f5f6f7]"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.previewUrl}
            alt={value.fileName}
            className="size-full object-cover"
          />
          {!disabled ? (
            <>
              <button
                type="button"
                onClick={handleRemove}
                aria-label="Quitar imagen del proyecto"
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
                {processing ? "Comprimiendo imagen..." : "Cambiar imagen"}
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
            "flex h-[132px] cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed px-4 transition-colors",
            dragActive && "border-[#ff7433] bg-[#fff8f4]",
            processing && "pointer-events-none opacity-70",
            disabled && "cursor-not-allowed opacity-50",
          )}
          style={{
            borderColor: dragActive
              ? CREATE_PROJECT_COLORS.primary
              : CREATE_PROJECT_COLORS.uploadBorder,
          }}
          aria-label="Subir imagen del proyecto"
        >
          {processing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="size-8 animate-spin text-[#777b84]" aria-hidden />
              <p
                className={CREATE_PROJECT_TYPE.uploadPrimary}
                style={{ color: CREATE_PROJECT_COLORS.uploadHint }}
              >
                Comprimiendo imagen...
              </p>
            </div>
          ) : (
            <>
              <ImageIcon className="size-8 text-[#777b84]" aria-hidden />
              <p
                className={cn(CREATE_PROJECT_TYPE.uploadPrimary, "mt-2 text-center")}
                style={{ color: "#696e77" }}
              >
                Arrastá una imagen o hacé click para seleccionar
              </p>
              <p
                className={cn(
                  CREATE_PROJECT_TYPE.uploadSecondary,
                  "mt-1 text-center tracking-[-0.36px]",
                )}
                style={{ color: CREATE_PROJECT_COLORS.uploadHint }}
              >
                PNG, JPG hasta 20MB
              </p>
            </>
          )}
        </div>
      )}

      {error ? <p className="text-[12px] text-[#641723]">{error}</p> : null}
    </div>
  )
}
