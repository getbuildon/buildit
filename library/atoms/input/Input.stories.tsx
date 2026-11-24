import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocExamples, DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Label } from "../label/Label"
import { Input, Textarea } from "./Input"

const rules = [
  { title: "Siempre con Label", body: "Cada campo lleva un Label con htmlFor. El placeholder es un ejemplo, no el nombre: se borra al escribir. Hoy 30 de 110 campos no tienen etiqueta asociada." },
  { title: "Foco visible", body: "Borde naranja y anillo. Hoy 44 campos y botones sacan el anillo (ring-0) y el foco queda casi invisible." },
  { title: "Error con aria-invalid", body: "invalid pinta el borde rojo y avisa al lector de pantalla. El mensaje va abajo (molécula Field)." },
  { title: "El tipo correcto", body: "type=\"email\", \"tel\", inputMode=\"decimal\": en el celular abre el teclado justo." },
] as const

function InputDoc() {
  return (
    <FoundationDoc kicker="Átomos" title="Input" lede="Campo de texto: mismo aspecto que la app (44 de alto, radio 10), con foco visible y error accesible.">
      <DocSection title="Estados">
        <DocExamples
          items={[
            { name: "Normal", node: <Input aria-label="Nombre de la obra" placeholder="Ej.: Torre Alamo" className="max-w-80" /> },
            { name: "Con valor", node: <Input aria-label="Dirección" defaultValue="Av. Siempreviva 742" className="max-w-80" /> },
            { name: "Error", note: "aria-invalid", node: <Input aria-label="CUIT" defaultValue="20-1234" invalid className="max-w-80" /> },
            { name: "Solo lectura", node: <Input aria-label="Código" defaultValue="OBR-0042" readOnly className="max-w-80" /> },
            { name: "Deshabilitado", node: <Input aria-label="Plan" defaultValue="Plan Obra" disabled className="max-w-80" /> },
            { name: "compact · 36", note: "Filtros y tablas.", node: <Input aria-label="Buscar" size="compact" placeholder="Buscar unidad" className="max-w-80" /> },
          ]}
        />
      </DocSection>
      <DocSection title="Textarea" lede="Texto largo. La persona lo puede agrandar hacia abajo.">
        <div className="flex max-w-reading flex-col gap-compact">
          <Label htmlFor="obs">Observaciones</Label>
          <Textarea id="obs" placeholder="Detalle del avance, materiales usados…" />
        </div>
      </DocSection>
      <DocSection title="Con Label">
        <div className="flex max-w-80 flex-col gap-compact">
          <Label htmlFor="sup" required>
            Superficie total
          </Label>
          <Input id="sup" inputMode="decimal" placeholder="0,00" required />
        </div>
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Átomos/Input" } satisfies Meta

export default meta

export const Estados: StoryObj = { render: () => <InputDoc /> }
