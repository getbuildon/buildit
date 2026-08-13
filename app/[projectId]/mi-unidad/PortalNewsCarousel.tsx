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
  const canNavigate = items.length > 1

  const goTo = (index: number) => {
    if (items.length === 0) return
    const nextIndex = (index + items.length) % items.length
    if (nextIndex === activeIndex) return
    setActiveIndex(nextIndex)
  }

  if (!activeItem) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-[16px] border border-[#edeef0] bg-white px-6 text-center text-[14px] text-[#696e77] shadow-[0_0_5px_rgba(243,103,31,0.08)] sm:h-[380px]">
        Todavía no hay novedades publicadas en el portal.
      </div>
    )
  }

  return (
    <div className="relative h-[280px] overflow-hidden rounded-[16px] shadow-[0_0_5px_rgba(243,103,31,0.08)] sm:h-[380px]">
      {items.map((item, index) => {
        const isActive = index === activeIndex

        return (
          <div
            key={item.id}
            aria-hidden={!isActive}
            className={cn(
              "absolute inset-0 overflow-hidden transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]",
              isActive
                ? "portal-news-slide-active z-[2] opacity-100"
                : "pointer-events-none z-[1] scale-[1.02] opacity-0",
            )}
          >
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt={isActive ? item.title : ""}
                className="size-full object-cover will-change-transform"
              />
            ) : (
              <div className="portal-news-slide-fallback size-full bg-[#1d293d]" />
            )}
          </div>
        )
      })}

      <div className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-t from-[rgba(10,14,26,0.88)] via-[rgba(10,14,26,0.48)] via-[55%] to-[rgba(0,0,0,0)]" />

      <div className="relative z-[4] flex h-full flex-col justify-end p-6">
        <div key={activeItem.id} className="portal-news-caption-enter">
          <p className="text-[12px] leading-[1.4] tracking-[-0.36px] text-[#edeef0]">
            Novedad {activeIndex + 1}
          </p>
          <h3 className="pt-1.5 font-recoleta text-[24px] leading-[1.05] text-white sm:text-[28px]">
            {activeItem.title}
          </h3>
          {activeItem.description ? (
            <p className="max-w-[560px] pt-2 text-[14px] leading-[1.4] text-white">
              {activeItem.description}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3.5 pt-5">
          {canNavigate ? (
            <div className="flex items-center gap-1.5">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Ir a novedad ${index + 1}`}
                  onClick={() => goTo(index)}
                  className={cn(
                    "rounded-full transition-all duration-300 ease-out",
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
                className="flex size-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.15)] text-white transition-all duration-200 hover:scale-[1.03] hover:bg-[rgba(255,255,255,0.25)] active:scale-95"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Novedad siguiente"
                onClick={() => goTo(activeIndex + 1)}
                className="flex size-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.15)] text-white transition-all duration-200 hover:scale-[1.03] hover:bg-[rgba(255,255,255,0.25)] active:scale-95"
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
