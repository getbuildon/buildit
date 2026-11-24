import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc, TokenTable } from "../docs/FoundationDoc"

const roles = [
  {
    token: "--stroke-hairline · border",
    title: "Línea fina · 1px",
    uses: "Borde de card y de campo, divisores. Con border-line.",
    sample: <span className="block h-control w-32 rounded-control border border-line bg-canvas-raised" />,
  },
  {
    token: "--stroke-strong · border-2",
    title: "Línea fuerte · 2px",
    uses: "Selección: card elegida, opción marcada. Con border-action.",
    sample: <span className="block h-control w-32 rounded-control border-2 border-action bg-action-soft" />,
  },
  {
    token: "--icon-stroke",
    title: "Trazo de ícono · 1.75",
    uses: "El trazo de los íconos lucide. Es el que la app más usa hoy.",
    sample: (
      <svg viewBox="0 0 24 24" className="size-icon-lg text-ink" fill="none" stroke="currentColor" style={{ strokeWidth: "var(--icon-stroke)" }} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
      </svg>
    ),
  },
] as const

const rules = [
  { title: "El color de la línea es un rol", body: "border-line por defecto, border-line-strong para hover, border-action para selección." },
  { title: "No se suman bordes para separar", body: "Entre filas, divide-y divide-line. No un borde abajo y otro arriba." },
] as const

function StrokeRoles() {
  return (
    <FoundationDoc title="Stroke" lede="Ancho y color de línea. Dos anchos y un trazo de ícono.">
      <TokenTable rows={roles} />
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Foundations/Stroke" } satisfies Meta

export default meta

export const Roles: StoryObj = { render: () => <StrokeRoles /> }
