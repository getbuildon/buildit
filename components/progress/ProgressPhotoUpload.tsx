"use client"

import { useId, useRef, useState } from "react"
import { Camera, Loader2, X } from "lucide-react"
import {
  createEmptyTaskDraft,
  revokeTaskDraftPhotos,
  type CargarAvancePhotoDraft,
} from "@/lib/projects/cargarAvance"
import { MAX_PHOTOS_PER_TASK } from "@/lib/progress/progressPhotoConfig"
import { compressProgressPhoto } from "@/lib/progress/progressPhotos.client"
import { cn } from "@/lib/utils"

type ProgressPhotoUploadProps = {
  photos: CargarAvancePhotoDraft[]
  onChange: (photos: CargarAvancePhotoDraft[]) => void
  disabled?: boolean
  className?: string
}

export function ProgressPhotoUpload({
  photos,
  onChange,
  disabled = false,
  className,
}: ProgressPhotoUploadProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remainingSlots = MAX_PHOTOS_PER_TASK - photos.length
  const canAddMore = remainingSlots > 0 && !disabled && !processing

  const handleSelectFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? [])
    event.target.value = ""

    if (selectedFiles.length === 0) return

    setError(null)

    if (selectedFiles.length > remainingSlots) {
      setError(`Podés agregar hasta ${MAX_PHOTOS_PER_TASK} fotos por tarea.`)
      return
    }

    setProcessing(true)

    try {
      const nextPhotos = [...photos]

      for (const file of selectedFiles) {
        if (!file.type.startsWith("image/")) {
          throw new Error(`"${file.name}" no es una imagen válida.`)
        }

        const compressed = await compressProgressPhoto(file)
        nextPhotos.push({
          id: crypto.randomUUID(),
          file: compressed,
          previewUrl: URL.createObjectURL(compressed),
          fileName: file.name,
          fileSize: compressed.size,
          fileType: compressed.type || "image/webp",
        })
      }

      onChange(nextPhotos)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "No se pudieron procesar las fotos."
      setError(message)
    } finally {
      setProcessing(false)
    }
  }

  const handleRemovePhoto = (photoId: string) => {
    const target = photos.find((photo) => photo.id === photoId)
    if (target) URL.revokeObjectURL(target.previewUrl)
    onChange(photos.filter((photo) => photo.id !== photoId))
  }

  const handleClearAll = () => {
    revokeTaskDraftPhotos({ ...createEmptyTaskDraft(), photos })
    onChange([])
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <Camera className="size-4 text-[#777b84]" aria-hidden />
        <p className="text-[12px] font-normal text-[#777b84]">Fotografías</p>
        {photos.length > 0 ? (
          <span className="text-[12px] text-[#777b84]">
            ({photos.length}/{MAX_PHOTOS_PER_TASK})
          </span>
        ) : null}
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-[10px] border border-[#edeef0] bg-[#f5f6f7]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.previewUrl}
                alt={photo.fileName}
                className="size-full object-cover"
              />
              {!disabled ? (
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(photo.id)}
                  aria-label={`Quitar ${photo.fileName}`}
                  className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-[#272a2d]/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/*"
        multiple
        className="sr-only"
        disabled={!canAddMore}
        onChange={handleSelectFiles}
      />

      {canAddMore ? (
        <label
          htmlFor={inputId}
          className={cn(
            "flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#afb3ba] bg-white px-4 py-8 text-[14px] text-[#777b84] transition-colors hover:border-[#ff7433] hover:text-[#272a2d]",
            processing && "pointer-events-none opacity-70",
          )}
        >
          {processing ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Comprimiendo fotos...
            </>
          ) : (
            <>
              <Camera className="size-4" aria-hidden />
              Subir Fotos
            </>
          )}
        </label>
      ) : null}

      {photos.length > 0 && !disabled && canAddMore ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={processing}
          className="self-start text-[12px] font-medium text-[#ff7433] hover:text-[#e5662d]"
        >
          Agregar más fotos
        </button>
      ) : null}

      {photos.length > 0 && !disabled ? (
        <button
          type="button"
          onClick={handleClearAll}
          className="self-start text-[12px] text-[#777b84] hover:text-[#272a2d]"
        >
          Quitar todas
        </button>
      ) : null}

      {error ? <p className="text-[12px] text-[#641723]">{error}</p> : null}
    </div>
  )
}
