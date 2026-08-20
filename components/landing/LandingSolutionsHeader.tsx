import { LandingReveal } from "@/components/landing/LandingReveal"

export function LandingSolutionsHeader() {
  return (
    <div className="px-6 text-center">
      <LandingReveal direction="up">
        <h2 className="font-recoleta text-2xl leading-[1.05] text-white">
          Todo el avance de obra. En{" "}
          <span className="text-primary">un sólo lugar.</span>
        </h2>
      </LandingReveal>
      <LandingReveal direction="up" delay={0.12}>
        <p className="pt-3 text-base leading-[1.4] text-white">
          Con BuildOn conectás cada etapa del proyecto, desde la carga en campo
          hasta la visualización para clientes.
        </p>
      </LandingReveal>
    </div>
  )
}
