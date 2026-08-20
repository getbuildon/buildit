import { LandingSolutionsDesktop } from "@/components/landing/LandingSolutionsDesktop"
import { LandingSolutionsMobile } from "@/components/landing/LandingSolutionsMobile"

export function LandingSolutionsSection() {
  return (
    <section id="soluciones" className="relative z-1 overflow-x-clip bg-[#272a2d]">
      <div className="lg:hidden">
        <LandingSolutionsMobile />
      </div>

      <div className="hidden lg:block">
        <LandingSolutionsDesktop />
      </div>

      <div className="h-[44px] bg-[#272a2d] lg:hidden" aria-hidden />
    </section>
  )
}
