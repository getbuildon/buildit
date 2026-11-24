import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc, TokenTable } from "../docs/FoundationDoc"

const roles = [
  { token: "--radius-compact · rounded-compact", title: "Compacto · 6", uses: "Chip, badge, celda.", className: "rounded-compact" },
  { token: "--radius-control · rounded-control", title: "Control · 10", uses: "Botón, campo, menú. El más usado hoy (más de 200 veces).", className: "rounded-control" },
  { token: "--radius-surface · rounded-surface", title: "Superficie · 16", uses: "Card, panel, diálogo.", className: "rounded-surface" },
  { token: "--radius-pill · rounded-pill", title: "Píldora", uses: "Avatar, switch, tag redonda.", className: "rounded-pill" },
] as const

const rules = [
  {
    title: "La curva crece con el elemento",
    body: "Lo chico, compacto. Lo que se toca, control. Lo que contiene, superficie.",
  },
  {
    title: "Hoy hay diez radios",
    body: "4, 6, 8, 9, 10, 12, 14, 16, 24 y 40 px. Se unifican en cuatro roles. rounded-lg y rounded-[8px] dejan de existir.",
  },
  {
    title: "Anidados, de afuera hacia adentro",
    body: "Un control dentro de una card usa control, no superficie. Nunca un radio mayor adentro de uno menor.",
  },
] as const

function RadiusRoles() {
  return (
    <FoundationDoc title="Radio" lede="Cuatro curvas, cada una con su trabajo.">
      <TokenTable
        rows={roles.map((role) => ({
          ...role,
          sample: <span className={`block h-control w-32 border border-line-strong bg-action-soft ${role.className}`} />,
        }))}
      />
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Foundations/Radio" } satisfies Meta

export default meta

export const Roles: StoryObj = { render: () => <RadiusRoles /> }
