import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { InlineEdit } from "./InlineEdit"

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function Rows() {
  const [names, setNames] = useState(["Unidad 1A", "Unidad 1B", ""])
  return (
    <ul className="flex max-w-dialog flex-col divide-y divide-line rounded-surface border border-line bg-canvas-raised">
      {names.map((name, index) => (
        <li key={index} className="flex items-center justify-between gap-group px-group py-compact">
          <InlineEdit
            label={`Nombre de la unidad ${index + 1}`}
            value={name}
            placeholder="Sin nombre"
            validate={(value) => (value === "" ? "El nombre no puede quedar vacío." : undefined)}
            onSave={async (value) => {
              await wait(700)
              if (value.toLowerCase() === "error") throw new Error("Ya hay una unidad con ese nombre.")
              setNames((current) => current.map((item, i) => (i === index ? value : item)))
            }}
          />
          <span className="shrink-0 text-meta text-ink-muted">Piso 1</span>
        </li>
      ))}
    </ul>
  )
}

const rules = [
  { title: "Para datos chicos", body: "Un nombre, un número. Para varios campos juntos, un formulario o un diálogo." },
  { title: "Teclado completo", body: "Enter o Tab para entrar, Enter para guardar, Escape para cancelar. Al terminar, el foco vuelve al dato." },
  { title: "Se ve que se puede editar", body: "El lápiz aparece con el mouse encima o con foco; el lector de pantalla dice «Nombre: 1A. Editar»." },
  { title: "Si falla, no se pierde", body: "El texto escrito queda y el error aparece abajo. Probá escribir «error»." },
] as const

function InlineEditDoc() {
  return (
    <FoundationDoc kicker="Moléculas" title="InlineEdit" lede="Editar un dato en el lugar, sin abrir un formulario. Tocá un nombre.">
      <DocSection title="Ejemplo">
        <Rows />
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Moléculas/InlineEdit" } satisfies Meta

export default meta

export const Ejemplo: StoryObj = { render: () => <InlineEditDoc /> }
