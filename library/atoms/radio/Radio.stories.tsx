import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Label } from "../label/Label"
import { RadioGroup, RadioItem } from "./Radio"

const options = [
  { value: "no-iniciada", label: "No iniciada" },
  { value: "en-curso", label: "En curso" },
  { value: "terminada", label: "Terminada" },
  { value: "pausada", label: "Pausada", disabled: true },
]

const rules = [
  { title: "Se elige una", body: "Para varias, Checkbox. Para más de 6 opciones, un Select." },
  { title: "Con nombre de grupo", body: "El RadioGroup lleva aria-labelledby apuntando al título de la pregunta." },
  { title: "Flechas, no Tab", body: "Tab entra al grupo; las flechas cambian la opción. Es el comportamiento del sistema operativo." },
] as const

function RadioDoc() {
  return (
    <FoundationDoc kicker="Átomos" title="Radio" lede="Grupo de opciones donde se elige una.">
      <DocSection title="Ejemplo">
        <div className="flex flex-col gap-snug">
          <p id="estado-obra" className="text-label">
            Estado de la obra
          </p>
          <RadioGroup aria-labelledby="estado-obra" defaultValue="en-curso">
            {options.map((option) => (
              <div key={option.value} className="flex items-center gap-compact">
                <RadioItem id={option.value} value={option.value} disabled={option.disabled} />
                <Label htmlFor={option.value} variant="option">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Átomos/Radio" } satisfies Meta

export default meta

export const Grupo: StoryObj = { render: () => <RadioDoc /> }
