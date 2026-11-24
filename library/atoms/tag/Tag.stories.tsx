import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocExamples, DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Tag, tagTones } from "./Tag"

const names: Record<(typeof tagTones)[number], string> = {
  naranja: "Albañilería",
  azul: "Eléctrica",
  verde: "Paisajismo",
  amarillo: "Pintura",
  rojo: "Demolición",
  violeta: "Carpintería",
  turquesa: "Sanitaria",
  rosa: "Terminaciones",
}

function Removable() {
  const [items, setItems] = useState(["Albañilería", "Eléctrica", "Sanitaria"])
  return (
    <div className="flex flex-wrap gap-compact">
      {items.map((item, index) => (
        <Tag key={item} tone={tagTones[index]} onRemove={() => setItems(items.filter((x) => x !== item))}>
          {item}
        </Tag>
      ))}
      {items.length === 0 ? <p className="text-meta text-ink-muted">Sin rubros.</p> : null}
    </div>
  )
}

const rules = [
  { title: "Es una categoría", body: "Rubro, tipología, piso. Para estados (aprobado, pendiente), Badge." },
  { title: "Se guarda el nombre del tono", body: "El rubro guarda «turquesa», no un color. La paleta puede mejorar sin tocar los datos." },
  { title: "Quitar con nombre", body: "La cruz anuncia «Quitar Eléctrica», no solo «botón»." },
] as const

function TagDoc() {
  return (
    <FoundationDoc kicker="Átomos" title="Tag" lede="Etiqueta de categoría con uno de los 8 tonos.">
      <DocSection title="Tonos">
        <div className="flex flex-wrap gap-compact">
          {tagTones.map((tone) => (
            <Tag key={tone} tone={tone} dot>
              {names[tone]}
            </Tag>
          ))}
        </div>
      </DocSection>
      <DocSection title="Variantes">
        <DocExamples
          items={[
            { name: "Simple", node: <Tag tone="violeta">Carpintería</Tag> },
            { name: "Con punto", node: <Tag tone="violeta" dot>Carpintería</Tag> },
            { name: "Para quitar", note: "Probá la cruz con teclado.", node: <Removable /> },
          ]}
        />
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Átomos/Tag" } satisfies Meta

export default meta

export const Tonos: StoryObj = { render: () => <TagDoc /> }
