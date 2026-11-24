import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Search } from "lucide-react"
import { DocExamples, DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { InputGroup } from "./InputGroup"

function SearchExample() {
  const [value, setValue] = useState("Torre")
  return (
    <InputGroup
      aria-label="Buscar obra"
      type="search"
      start={<Search />}
      placeholder="Buscar obra"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onClear={() => setValue("")}
      groupClassName="w-80"
    />
  )
}

const rules = [
  { title: "La unidad no se escribe", body: "m², % y $ van pegados al campo: la persona escribe solo el número." },
  { title: "El grupo entero es el campo", body: "Borde, foco y error son del grupo; clic en cualquier parte enfoca el texto." },
  { title: "Borrar con una tecla", body: "onClear muestra la cruz cuando hay texto. Escape también borra en type=\"search\"." },
] as const

function InputGroupDoc() {
  return (
    <FoundationDoc kicker="Moléculas" title="InputGroup" lede="Campo con algo pegado adentro: búsqueda, moneda o unidad.">
      <DocSection title="Variantes">
        <DocExamples
          items={[
            { name: "Búsqueda", note: "Con cruz para borrar.", node: <SearchExample /> },
            { name: "Moneda", node: <InputGroup aria-label="Precio" inputMode="decimal" start="$" placeholder="0" groupClassName="w-60" /> },
            { name: "Superficie", node: <InputGroup aria-label="Superficie" inputMode="decimal" end="m²" placeholder="0,00" groupClassName="w-60" /> },
            { name: "Porcentaje", node: <InputGroup aria-label="Incidencia" inputMode="decimal" end="%" defaultValue="12,5" groupClassName="w-40" /> },
            { name: "Error", node: <InputGroup aria-label="Incidencia" invalid end="%" defaultValue="120" groupClassName="w-40" /> },
            { name: "Deshabilitado", node: <InputGroup aria-label="Superficie" disabled end="m²" defaultValue="1.250" groupClassName="w-60" /> },
          ]}
        />
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Moléculas/InputGroup" } satisfies Meta

export default meta

export const Variantes: StoryObj = { render: () => <InputGroupDoc /> }
