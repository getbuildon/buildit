import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc, TokenTable } from "../docs/FoundationDoc"

const layers = [
  { token: "--z-base · z-(--z-base)", title: "Base · 0", uses: "El contenido de la página." },
  { token: "--z-raised · z-(--z-raised)", title: "Levantado · 10", uses: "Card levantada, encabezado sticky dentro de una tabla." },
  { token: "--z-sticky · z-(--z-sticky)", title: "Fijo · 20", uses: "Header y barras fijas de la pantalla." },
  { token: "--z-overlay · z-(--z-overlay)", title: "Overlay · 40", uses: "Popover, menú, select, date picker." },
  { token: "--z-modal · z-(--z-modal)", title: "Modal · 50", uses: "Diálogo y su velo." },
  { token: "--z-toast · z-(--z-toast)", title: "Aviso · 60", uses: "Toasts: arriba de todo, también de un diálogo." },
] as const

const rules = [
  { title: "Un solo origen", body: "Hoy hay z-index de 0, 1, 2, 3, 4, 10, 20, 30, 40, 50 y 9999. Se piden estas seis capas por nombre." },
  { title: "Nada de 9999", body: "Si algo no queda arriba, está en la capa equivocada: se cambia de capa, no se sube el número." },
] as const

function StackingRoles() {
  return (
    <FoundationDoc title="Stacking" lede="Qué tapa a qué. Seis capas.">
      <TokenTable rows={layers} />
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Foundations/Stacking" } satisfies Meta

export default meta

export const Capas: StoryObj = { render: () => <StackingRoles /> }
