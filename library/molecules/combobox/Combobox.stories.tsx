import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocExamples, DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Field } from "../field/Field"
import { Combobox, type ComboboxOption } from "./Combobox"

const clients: ComboboxOption[] = [
  { value: "c1", label: "Lucía Fernández", description: "lucia.fernandez@mail.com" },
  { value: "c2", label: "Martín Gómez", description: "martin.gomez@mail.com" },
  { value: "c3", label: "Carla Ruiz", description: "carla.ruiz@mail.com" },
  { value: "c4", label: "Juan Pérez", description: "juan.perez@mail.com" },
  { value: "c5", label: "Sofía Díaz", description: "sofia.diaz@mail.com" },
  { value: "c6", label: "Tomás Herrera", description: "tomas.herrera@mail.com" },
  { value: "c7", label: "Ana Ibáñez", description: "ana.ibanez@mail.com", disabled: true },
]

const units: ComboboxOption[] = Array.from({ length: 4 }, (_, floor) =>
  ["A", "B", "C", "D"].map((letter) => ({ value: `${floor + 1}${letter}`, label: `${floor + 1}${letter}`, group: `Piso ${floor + 1}` })),
).flat()

function ClientExample() {
  const [value, setValue] = useState<string>()
  return (
    <Field label="Cliente" description="Buscá por nombre o mail. Probá «gomez», sin tilde." className="w-80">
      <Combobox options={clients} value={value} onValueChange={setValue} placeholder="Elegí un cliente" searchPlaceholder="Buscar cliente…" emptyText="No hay clientes con ese nombre." />
    </Field>
  )
}

function UnitExample() {
  const [value, setValue] = useState<string | undefined>("2B")
  return (
    <Field label="Unidad" className="w-60">
      <Combobox options={units} value={value} onValueChange={setValue} searchPlaceholder="Buscar unidad…" />
    </Field>
  )
}

const rules = [
  { title: "Para listas largas", body: "Clientes, unidades, miembros. Para menos de ~15 opciones sin búsqueda, Select." },
  { title: "Busca como habla la gente", body: "Sin importar tildes ni mayúsculas, y también por el texto secundario (el mail)." },
  { title: "Decir qué no encontró", body: "emptyText: «No hay clientes con ese nombre», no una lista vacía." },
  { title: "Tocar la elegida la quita", body: "Así se puede volver a «sin elegir» sin un botón aparte." },
] as const

function ComboboxDoc() {
  return (
    <FoundationDoc kicker="Moléculas" title="Combobox" lede="Elegir de una lista larga escribiendo para buscar. Reemplaza el NestedSelect de ~300 líneas.">
      <DocSection title="Ejemplos">
        <DocExamples
          items={[
            { name: "Con descripción", node: <ClientExample /> },
            { name: "Con grupos", node: <UnitExample /> },
          ]}
        />
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Moléculas/Combobox" } satisfies Meta

export default meta

export const Ejemplos: StoryObj = { render: () => <ComboboxDoc /> }
