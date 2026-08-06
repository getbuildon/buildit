import Image from "next/image"
import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import type { SolutionSlide } from "@/lib/landing/solutionSlides"
import {
  CARD_HEIGHT_PX,
  CARD_WIDTH_PX,
} from "@/lib/landing/solutionStackAnimation"

type SolutionSlideCardProps = {
  slide: SolutionSlide
  isFirst?: boolean
  stacked?: boolean
  /** 324×427 fijo para el stack mobile animado */
  fixedSize?: boolean
  style?: CSSProperties
  className?: string
}

export function SolutionSlideCard({
  slide,
  isFirst = false,
  stacked = false,
  fixedSize = false,
  style,
  className,
}: SolutionSlideCardProps) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded border border-[#363a3f] bg-[#edeef0]",
        fixedSize
          ? "flex w-[324px] flex-col"
          : "w-full max-w-[324px]",
        stacked && "shadow-[0px_-10px_20.8px_-8px_rgba(0,0,0,0.1)]",
        className,
      )}
      style={
        fixedSize
          ? { width: CARD_WIDTH_PX, height: CARD_HEIGHT_PX, ...style }
          : style
      }
    >
      <div
        className={cn(
          "flex shrink-0 flex-col gap-2 px-4 pt-3",
          fixedSize ? "pb-4" : "pb-8",
        )}
      >
        <p className="font-recoleta text-xs leading-[1.05] text-primary">
          {slide.number}
        </p>
        <div>
          <h3 className="font-recoleta text-2xl leading-[1.05] text-[#18191b]">
            {slide.title}
          </h3>
          <p className="pt-2 text-sm leading-[1.4] text-[#18191b]">
            {slide.description}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "relative min-h-0 overflow-hidden rounded-tl-[24px] rounded-tr-[24px]",
          fixedSize && "flex flex-1 flex-col",
        )}
      >
        <Image
          src={slide.bgSrc}
          alt=""
          width={342}
          height={309}
          aria-hidden
          className="absolute inset-0 size-full object-cover"
        />
        <div
          className={cn(
            "relative flex flex-1 justify-center",
            fixedSize ? "items-center py-4" : "py-6",
          )}
        >
          <Image
            src={slide.screenSrc}
            alt={`Captura de pantalla: ${slide.title}`}
            width={slide.screenWidth}
            height={slide.screenHeight}
            className={cn(
              "max-w-[calc(100%-32px)] object-contain",
              fixedSize ? "h-[248px] w-[294px]" : "h-[261px] w-[311px]",
            )}
            sizes="311px"
          />
        </div>
      </div>
    </article>
  )
}
