import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocExamples, DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Label } from "../label/Label"
import { Checkbox } from "./Checkbox"

const tasks = ["Colocación de cerámicos", "Pintura de cielorrasos", "Instalación de griferías"]

function SelectAll() {
  const [checked, setChecked] = useState<boolean[]>([true, false, false])
  const all = checked.every(Boolean)
  const some = checked.some(Boolean)
  return (
    <div className="flex flex-col gap-snug">
      <div className="flex items-center gap-compact">
        <Checkbox
          id="todas"
          checked={all ? true : some ? "indeterminate" : false}
          onCheckedChange={(value) => setChecked(checked.map(() => value === true))}
        />
        <Label htmlFor="todas">Todas las tareas</Label>
      </div>
      {tasks.map((task, index) => (
        <div key={task} className="flex items-center gap-compact pl-block">
          <Checkbox
            id={`t${index}`}
            checked={checked[index]}
            onCheckedChange={(value) => setChecked(checked.map((item, i) => (i === index ? value === true : item)))}
          />
          <Label htmlFor={`t${index}`} variant="option">
            {task}
          </Label>
        </div>
      ))}
    </div>
  )
}

const rules = [
  { title: "Una sola casilla", body: "Hoy hay tres: una negra de 2px (certificaciones) y dos naranjas de 4px, cada una armada a mano. Esta las reemplaza." },
  { title: "Casilla o interruptor", body: "La casilla se confirma con Guardar. Si el cambio aplica al instante, Switch." },
  { title: "Seleccionar todo", body: "checked=\"indeterminate\" cuando hay algunas elegidas. El lector de pantalla dice «parcialmente seleccionada»." },
  { title: "Tocable de 24", body: "Se dibuja de 16 pero responde en 24, el mínimo de WCAG 2.2. Y con el Label, toda la frase es tocable." },
] as const

function CheckboxDoc() {
  return (
    <FoundationDoc kicker="Átomos" title="Checkbox" lede="Casilla para elegir una o varias cosas.">
      <DocSection title="Estados">
        <DocExamples
          items={[
            { name: "Sin marcar", node: <Checkbox aria-label="Ejemplo sin marcar" /> },
            { name: "Marcada", node: <Checkbox aria-label="Ejemplo marcada" defaultChecked /> },
            { name: "Algunas", note: "indeterminate", node: <Checkbox aria-label="Ejemplo algunas" checked="indeterminate" /> },
            {
              name: "Deshabilitada",
              node: (
                <>
                  <Checkbox aria-label="Deshabilitada" disabled />
                  <Checkbox aria-label="Deshabilitada marcada" disabled defaultChecked />
                </>
              ),
            },
            { name: "Error", node: <Checkbox aria-label="Aceptar términos" aria-invalid /> },
          ]}
        />
      </DocSection>
      <DocSection title="En contexto: seleccionar todo">
        <SelectAll />
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Átomos/Checkbox" } satisfies Meta

export default meta

export const Estados: StoryObj = { render: () => <CheckboxDoc /> }
