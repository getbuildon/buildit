import { LandingSolutionsMobile } from "@/components/landing/LandingSolutionsMobile"
import { SolutionSlideCard } from "@/components/landing/SolutionSlideCard"
import { SOLUTION_SLIDES } from "@/lib/landing/solutionSlides"

export function LandingSolutionsSection() {
  return (
    <section id="soluciones" className="relative z-1 overflow-visible bg-[#272a2d]">
      <LandingSolutionsMobile />

      <div className="mx-auto hidden w-full max-w-[390px] px-6 pb-6 pt-10 lg:block">
        <header className="pb-8 text-center">
          <h2 className="font-recoleta text-2xl leading-[1.05] text-white">
            Todo el avance de obra. En{" "}
            <span className="text-primary">un sólo lugar.</span>
          </h2>
          <p className="pt-3 text-base leading-[1.4] text-white">
            Con BuildOn conectás cada etapa del proyecto, desde la carga en campo
            hasta la visualización para clientes.
          </p>
        </header>
        <div className="flex justify-center pt-10">
          <SolutionSlideCard slide={SOLUTION_SLIDES[0]} />
        </div>
      </div>
    </section>
  )
}
