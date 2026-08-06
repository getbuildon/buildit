import Image from "next/image"
import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import type { SolutionSlide } from "@/lib/landing/solutionSlides"

type SolutionSlideCardProps = {
  slide: SolutionSlide
  isFirst?: boolean
  stacked?: boolean
  style?: CSSProperties
  className?: string
}

export function SolutionSlideCard({
  slide,
  isFirst = false,
  stacked = false,
  style,
  className,
}: SolutionSlideCardProps) {
  return (
    <article
      className={cn(
        "w-full max-w-[324px] overflow-hidden rounded border border-[#363a3f] bg-[#edeef0]",
        stacked && "shadow-[0px_-10px_20.8px_-8px_rgba(0,0,0,0.1)]",
        className,
      )}
      style={style}
    >
      <div className="flex flex-col gap-2 px-4 pb-8 pt-3">
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

      <div className="relative overflow-hidden rounded-tl-[24px] rounded-tr-[24px]">
        <Image
          src={slide.bgSrc}
          alt=""
          width={342}
          height={309}
          aria-hidden
          className="absolute inset-0 size-full object-cover"
        />
        <div className="relative flex justify-center py-6">
          <Image
            src={slide.screenSrc}
            alt={`Captura de pantalla: ${slide.title}`}
            width={slide.screenWidth}
            height={slide.screenHeight}
            className="h-[261px] w-[311px] max-w-[calc(100%-32px)] object-contain"
            sizes="311px"
          />
        </div>
      </div>
    </article>
  )
}
