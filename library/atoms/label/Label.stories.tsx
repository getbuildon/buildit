import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocExamples, DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Input } from "../input/Input"
import { Label } from "./Label"

const rules = [
  { title: "Asociado al campo", body: "htmlFor igual al id del campo. Tocar el label enfoca el campo y el lector de pantalla lo lee junto." },
  { title: "Obligatorio u opcional, no los dos", body: "Si casi todos son obligatorios, se marca el opcional. Si casi todos son opcionales, se marca el obligatorio." },
  { title: "El asterisco no alcanza", body: "El campo también lleva required: así el navegador y el lector de pantalla saben que es obligatorio." },
] as const

function LabelDoc() {
  return (
    <FoundationDoc kicker="Átomos" title="Label" lede="El nombre de un campo.">
      <DocSection title="Variantes">
        <DocExamples
          items={[
            {
              name: "Normal",
              node: (
                <div className="flex w-72 flex-col gap-compact">
                  <Label htmlFor="l1">Nombre de la obra</Label>
                  <Input id="l1" />
                </div>
              ),
            },
            {
              name: "Obligatorio",
              node: (
                <div className="flex w-72 flex-col gap-compact">
                  <Label htmlFor="l2" required>
                    Fecha de inicio
                  </Label>
                  <Input id="l2" type="date" required />
                </div>
              ),
            },
            {
              name: "Opcional",
              node: (
                <div className="flex w-72 flex-col gap-compact">
                  <Label htmlFor="l3" optional>
                    Ciudad para el clima
                  </Label>
                  <Input id="l3" />
                </div>
              ),
            },
          ]}
        />
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Átomos/Label" } satisfies Meta

export default meta

export const Variantes: StoryObj = { render: () => <LabelDoc /> }
