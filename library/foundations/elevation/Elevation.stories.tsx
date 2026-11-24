import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc, TokenTable } from "../docs/FoundationDoc"

const roles = [
  { token: "--elevation-flat · shadow-none", title: "Plano", uses: "El default. Borde y nada de sombra: card, panel, tabla.", className: "shadow-none" },
  { token: "--elevation-hint · shadow-hint", title: "Halo", uses: "Halo de marca muy suave. Cards del backoffice.", className: "shadow-hint" },
  { token: "--elevation-near · shadow-near", title: "Cerca", uses: "Se levanta del lienzo: card en hover, barra fija.", className: "shadow-near" },
  { token: "--elevation-overlay · shadow-overlay", title: "Overlay", uses: "Flota sobre todo: menú, popover, select.", className: "shadow-overlay" },
  { token: "--elevation-modal · shadow-modal", title: "Modal", uses: "Bloquea la pantalla: diálogo.", className: "shadow-modal" },
] as const

const rules = [
  { title: "Plano por defecto", body: "La jerarquía la dan la superficie y la línea. La sombra dice que algo está más cerca, no que es importante." },
  { title: "En oscuro sube la superficie", body: "Un menú o un diálogo en oscuro usan bg-canvas-overlay, un paso más claro. La sombra sola no alcanza." },
  { title: "Cinco niveles", body: "Hoy hay más de quince sombras distintas escritas a mano. Se unifican en estos cinco." },
] as const

function ElevationRoles() {
  return (
    <FoundationDoc title="Elevación" lede="Qué tan cerca está algo de quien mira. En oscuro la sombra casi no se ve: la distancia la da la superficie, que se aclara al subir (lienzo → elevada → overlay).">
      <TokenTable
        sampleWidth="w-44"
        rows={roles.map((role) => ({
          ...role,
          sample: <span className={`block h-20 w-40 rounded-surface border border-line bg-canvas-raised ${role.className}`} />,
        }))}
      />
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Foundations/Elevación" } satisfies Meta

export default meta

export const Roles: StoryObj = { render: () => <ElevationRoles /> }
