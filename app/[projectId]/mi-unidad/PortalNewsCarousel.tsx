"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { PortalNewsItem } from "@/lib/projects/portalClientesTypes"
import { cn } from "@/lib/utils"

type PortalNewsCarouselProps = {
  items: PortalNewsItem[]
}

export function PortalNewsCarousel({ items }: PortalNewsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const activeItem = items[activeIndex]

  const goTo = (index: number) => {
    if (items.length === 0) return
    const nextIndex = (index + items.length) % items.length
    setActiveIndex(nextIndex)
  }

  const canNavigate = items.length > 1

  if (!activeItem) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-[16px] border border-[#edeef0] bg-white px-6 text-center text-[14px] text-[#696e77] shadow-[0_0_5px_rgba(243,103,31,0.08)] sm:h-[380px]">
        Todavía no hay novedades publicadas en el portal.
      </div>
    )
  }

  return (
    <div className="relative h-[280px] overflow-hidden rounded-[16px] shadow-[0_0_5px_rgba(243,103,31,0.08)] sm:h-[380px]">
      {activeItem.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={activeItem.imageUrl}
          alt={activeItem.title}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[#1d293d]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,14,26,0.88)] via-[rgba(10,14,26,0.48)] via-[55%] to-[rgba(0,0,0,0)]" />

      <div className="relative flex h-full flex-col justify-end p-6">
        <p className="text-[12px] leading-[1.4] tracking-[-0.36px] text-[#edeef0]">
          Novedad {activeIndex + 1}
        </p>
        <h3 className="pt-1.5 font-recoleta text-[24px] leading-[1.05] text-white sm:text-[28px]">
          {activeItem.title}
        </h3>
        {activeItem.description ? (
          <p className="pt-2 max-w-[560px] text-[14px] leading-[1.4] text-white">
            {activeItem.description}
          </p>
        ) : null}

        <div className="flex items-center gap-3.5 pt-5">
          {canNavigate ? (
            <div className="flex items-center gap-1.5">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Ir a novedad ${index + 1}`}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "rounded-full transition-all",
                    index === activeIndex
                      ? "h-[5px] w-5 bg-[#ff7433]"
                      : "size-[5px] bg-[rgba(255,255,255,0.35)] hover:bg-white/60",
                  )}
                />
              ))}
            </div>
          ) : (
            <div className="h-[5px] w-5 rounded-full bg-[#ff7433]" />
          )}

          {canNavigate ? (
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Novedad anterior"
                onClick={() => goTo(activeIndex - 1)}
                className="flex size-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.15)] text-white transition-colors hover:bg-[rgba(255,255,255,0.25)]"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Novedad siguiente"
                onClick={() => goTo(activeIndex + 1)}
                className="flex size-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.15)] text-white transition-colors hover:bg-[rgba(255,255,255,0.25)]"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
