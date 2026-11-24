import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc, TokenTable } from "../docs/FoundationDoc"

const states = [
  {
    token: "focus-ring",
    title: "Foco",
    uses: "Anillo naranja de 3px. Solo con teclado (focus-visible). Probalo con Tab.",
    sample: (
      <button type="button" className="focus-ring h-control rounded-control border border-line bg-canvas-raised px-group text-label">
        Tab para ver
      </button>
    ),
  },
  {
    token: "hover:border-line-strong",
    title: "Hover",
    uses: "La línea se afirma. En botones, el fondo pasa al tono hover.",
    sample: (
      <button type="button" className="motion-color h-control rounded-control border border-line bg-canvas-raised px-group text-label hover:border-line-strong">
        Pasá el mouse
      </button>
    ),
  },
  {
    token: "motion-press",
    title: "Press",
    uses: "Se achica apenas al apretar.",
    sample: (
      <button type="button" className="motion-press focus-ring h-control rounded-control bg-action px-group text-label text-action-ink">
        Apretá
      </button>
    ),
  },
  {
    token: "--state-disabled-opacity",
    title: "Deshabilitado",
    uses: "Mitad de opacidad, sin hover ni cursor.",
    sample: (
      <button type="button" disabled className="h-control cursor-not-allowed rounded-control bg-action px-group text-label text-action-ink opacity-(--state-disabled-opacity)">
        No disponible
      </button>
    ),
  },
] as const

const rules = [
  { title: "Nunca outline: none sin reemplazo", body: "Si se saca el contorno del navegador, va focus-ring." },
  { title: "Con mouse no se ve", body: "focus-visible: el anillo aparece solo cuando se navega con teclado." },
] as const

function FocusStates() {
  return (
    <FoundationDoc title="Focus y estados" lede="Cómo responde lo que se toca: foco, hover, press y deshabilitado.">
      <TokenTable sampleWidth="w-44" rows={states} />
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Foundations/Focus" } satisfies Meta

export default meta

export const Estados: StoryObj = { render: () => <FocusStates /> }
