"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export type ProgressPhotoGalleryItem = {
  id: string
  fileName: string
  signedUrl: string
}

type ProgressPhotoGalleryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  photos: ProgressPhotoGalleryItem[]
}

export function ProgressPhotoGalleryDialog({
  open,
  onOpenChange,
  title,
  description,
  photos,
}: ProgressPhotoGalleryDialogProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const activePhoto = photos[activeIndex] ?? null
  const hasMultiple = photos.length > 1

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setActiveIndex(0)
    onOpenChange(nextOpen)
  }

  const showPrevious = () => {
    setActiveIndex((current) => (current === 0 ? photos.length - 1 : current - 1))
  }

  const showNext = () => {
    setActiveIndex((current) => (current === photos.length - 1 ? 0 : current + 1))
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[680px] max-w-[calc(100vw-32px)] gap-0 p-0"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#edeef0] px-6 py-5">
          <div className="min-w-0">
            <DialogTitle className="text-[18px] font-semibold leading-7 text-[#272a2d]">
              {title}
            </DialogTitle>
            {description ? (
              <DialogDescription className="mt-1 text-[13px] leading-5 text-[#62748e]">
                {description}
              </DialogDescription>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            aria-label="Cerrar galería"
            className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#43484e] transition-colors hover:bg-[#edeef0]"
          >
            <X className="size-4" />
          </button>
        </div>

        {photos.length === 0 ? (
          <div className="px-6 py-10 text-center text-[14px] text-[#777b84]">
            No hay fotografías para mostrar.
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-6 py-5">
            <div className="relative overflow-hidden rounded-[10px] bg-[#f5f6f7]">
              {activePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activePhoto.signedUrl}
                  alt={activePhoto.fileName}
                  className="mx-auto max-h-[420px] w-full object-contain"
                />
              ) : null}

              {hasMultiple ? (
                <>
                  <button
                    type="button"
                    onClick={showPrevious}
                    aria-label="Foto anterior"
                    className="absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#272a2d] shadow-sm"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    aria-label="Foto siguiente"
                    className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#272a2d] shadow-sm"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </>
              ) : null}
            </div>

            {hasMultiple ? (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={cn(
                      "overflow-hidden rounded-[8px] border-2 bg-[#f5f6f7]",
                      index === activeIndex ? "border-[#ff7433]" : "border-transparent",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.signedUrl}
                      alt={photo.fileName}
                      className="aspect-square size-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
