import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { ProjectCard, ProjectCardSkeleton } from "./ProjectCard"

const rules = [
  { title: "Igual que hoy", body: "240 px, logo de 48, badge de avance semanal o «Borrador», niveles y barra de progreso, sobre el fondo tierra del inicio." },
  { title: "Un solo link, toda la card", body: "El link es el nombre: el lector de pantalla dice «Torre Alamo, link» en vez de leer toda la card. Su área cubre la card, así se toca igual que hoy." },
  { title: "El badge se entiende sin mirar", body: "Para el lector de pantalla dice «Avance de la semana: +2,3%». El tooltip es el de la librería (hoy es uno armado a mano)." },
  { title: "Mientras carga, su forma", body: "Badge y barra en gris mientras llega el avance; la card entera en gris mientras carga el inicio." },
] as const

function ProjectCardDoc() {
  return (
    <FoundationDoc kicker="Organismos" title="ProjectCard" lede="La card de una obra en el inicio. Va sobre el fondo tierra.">
      <div className="flex flex-wrap justify-center gap-5 rounded-surface bg-linear-135 from-earth to-earth-deep p-chapter">
        <ProjectCard name="Torre Alamo" address="Av. Siempreviva 742, Córdoba" floors={12} progress={45.5} weeklyDelta={2.3} link={<a href="#torre">Torre Alamo</a>} />
        <ProjectCard name="Barrio Los Álamos" address="Ruta 20 km 12, Villa Carlos Paz" floors={2} progress={12} weeklyDelta={-0.8} link={<a href="#alamos">Barrio Los Álamos</a>} />
        <ProjectCard name="Casa Herrera" address="Nueva Córdoba" floors={3} draft link={<a href="#herrera">Casa Herrera</a>} />
        <ProjectCard name="Edificio Mirador" address="Bv. San Juan 1200" floors={8} link={<a href="#mirador">Edificio Mirador</a>} />
        <ProjectCardSkeleton />
      </div>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Organismos/ProjectCard" } satisfies Meta

export default meta

export const Obras: StoryObj = { render: () => <ProjectCardDoc /> }
