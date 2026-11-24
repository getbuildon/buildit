import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Search } from "lucide-react"
import { DocExamples, DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Button } from "../../atoms/button/Button"
import { Input, Textarea } from "../../atoms/input/Input"
import { InputGroup } from "../input-group/InputGroup"
import { Select, SelectItem } from "../select/Select"
import { Field } from "./Field"

function FormExample() {
  const [name, setName] = useState("")
  const [sent, setSent] = useState(false)
  const error = sent && name.trim() === "" ? "Escribí el nombre de la obra." : undefined
  return (
    <form
      noValidate
      className="flex max-w-dialog flex-col gap-group"
      onSubmit={(event) => {
        event.preventDefault()
        setSent(true)
      }}
    >
      <Field label="Nombre de la obra" required error={error}>
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej.: Torre Alamo" />
      </Field>
      <Field label="Superficie total" description="En metros cuadrados, con hasta dos decimales.">
        <InputGroup inputMode="decimal" placeholder="0,00" end="m²" />
      </Field>
      <Field label="Tipo de obra">
        <Select>
          <SelectItem value="edificio">Edificio</SelectItem>
          <SelectItem value="barrio">Barrio cerrado</SelectItem>
          <SelectItem value="casa">Casa</SelectItem>
        </Select>
      </Field>
      <Field label="Observaciones" optional>
        <Textarea />
      </Field>
      <div>
        <Button type="submit">Crear obra</Button>
      </div>
    </form>
  )
}

const rules = [
  {
    title: "El error, escrito y a la vista",
    body: "Hoy hay 8 campos que esconden el error en un ícono con tooltip: no se ve en el celular y el lector de pantalla no lo asocia al campo. Field lo escribe debajo y lo conecta.",
  },
  { title: "Qué hacer, no qué pasó", body: "«Escribí el nombre de la obra», no «Campo inválido»." },
  { title: "Se valida al enviar o al salir", body: "No mientras la persona escribe: el error aparece antes de que termine." },
  { title: "Un Field, un control", body: "Field pasa solo el id, la ayuda y el error al control: Input, Textarea, InputGroup o Select." },
] as const

function FieldDoc() {
  return (
    <FoundationDoc kicker="Moléculas" title="Field" lede="Label, control, ayuda y error, conectados. El lector de pantalla lee todo junto al llegar al campo.">
      <DocSection title="Estados">
        <DocExamples
          items={[
            {
              name: "Con ayuda",
              node: (
                <Field label="CUIT" description="11 números, sin guiones." className="w-80">
                  <Input inputMode="numeric" />
                </Field>
              ),
            },
            {
              name: "Con error",
              node: (
                <Field label="Mail" required error="El mail tiene que tener @ y un dominio." className="w-80">
                  <Input type="email" defaultValue="juan.perez" />
                </Field>
              ),
            },
            {
              name: "Con grupo",
              node: (
                <Field label="Buscar unidad" className="w-80">
                  <InputGroup start={<Search />} placeholder="Ej.: 4B" />
                </Field>
              ),
            },
          ]}
        />
      </DocSection>
      <DocSection title="En contexto: formulario" lede="Tocá Crear obra con el nombre vacío.">
        <FormExample />
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Moléculas/Field" } satisfies Meta

export default meta

export const Estados: StoryObj = { render: () => <FieldDoc /> }
