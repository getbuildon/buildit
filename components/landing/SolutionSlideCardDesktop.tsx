import Image from "next/image"

import type { SolutionSlide } from "@/lib/landing/solutionSlides"
import {
  DESKTOP_CARD_HEIGHT_PX,
  DESKTOP_CARD_WIDTH_PX,
} from "@/lib/landing/solutionDesktopSlider"

type SolutionSlideCardDesktopProps = {
  slide: SolutionSlide
}

export function SolutionSlideCardDesktop({ slide }: SolutionSlideCardDesktopProps) {
  return (
    <article
      className="flex shrink-0 flex-col overflow-hidden rounded-[4px] border border-[#363a3f] bg-[#edeef0]"
      style={{
        width: DESKTOP_CARD_WIDTH_PX,
        height: DESKTOP_CARD_HEIGHT_PX,
      }}
    >
      <div className="flex h-[160px] shrink-0 flex-col gap-4 px-[28px] pb-8 pt-[24px]">
        <p className="font-recoleta text-2xl leading-[1.05] text-primary">
          {slide.number}
        </p>
        <div>
          <h3 className="font-recoleta text-[28px] leading-[1.05] text-[#18191b]">
            {slide.title}
          </h3>
          <p className="pt-2 text-lg leading-[1.2] tracking-[0.36px] text-[#18191b]">
            {slide.description}
          </p>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-tl-[40px] rounded-tr-[40px]">
        <Image
          src={slide.bgSrc}
          alt=""
          fill
          aria-hidden
          className="object-cover"
          sizes="900px"
        />
        <div className="relative flex h-full items-center justify-center py-16">
          <Image
            src={slide.desktopScreenSrc}
            alt={`Captura de pantalla: ${slide.title}`}
            width={slide.desktopScreenWidth}
            height={slide.desktopScreenHeight}
            className="max-h-full max-w-[calc(100%-64px)] object-contain"
            sizes="900px"
          />
        </div>
      </div>
    </article>
  )
}
