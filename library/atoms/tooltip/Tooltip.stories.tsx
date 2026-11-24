import type { Meta, StoryObj } from "@storybook/react-vite"
import { Info } from "lucide-react"
import { DocExamples, DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Button } from "../button/Button"
import { Icon } from "../icon/Icon"
import { Tooltip } from "./Tooltip"

const rules = [
  { title: "Uno solo", body: "Hoy hay cuatro tooltips distintos (hover, info, error de campo, permisos) y 28 title= del navegador, que no se ven con teclado ni en el celular." },
  { title: "Sobre algo que recibe foco", body: "Un botón, un link, un campo. Sobre un texto suelto no lo puede abrir el teclado." },
  { title: "No esconde lo importante", body: "En el celular no hay hover. Lo que hace falta para decidir va escrito, no en un tooltip." },
  { title: "Sin acciones adentro", body: "Si lleva un botón o un link, es un Popover (molécula)." },
] as const

function TooltipDoc() {
  return (
    <FoundationDoc kicker="Átomos" title="Tooltip" lede="Una aclaración corta al pasar el mouse o llegar con el teclado. Probá con Tab.">
      <DocSection title="Ejemplos">
        <DocExamples
          items={[
            {
              name: "Sobre un botón",
              node: (
                <Tooltip content="Se certifica con tu usuario y la fecha de hoy">
                  <Button variant="outline">Certificar</Button>
                </Tooltip>
              ),
            },
            {
              name: "Ícono de ayuda",
              note: "El disparador es un botón con nombre.",
              node: (
                <span className="flex items-center gap-related text-label">
                  Incidencia del rubro
                  <Tooltip content="Cuánto pesa este rubro en el avance total de la obra">
                    <button type="button" aria-label="Qué es la incidencia" className="focus-ring inline-flex rounded-pill text-ink-muted">
                      <Icon icon={Info} />
                    </button>
                  </Tooltip>
                </span>
              ),
            },
            {
              name: "Lados",
              node: (["top", "right", "bottom", "left"] as const).map((side) => (
                <Tooltip key={side} content={`Lado ${side}`} side={side}>
                  <Button variant="ghost" size="compact">
                    {side}
                  </Button>
                </Tooltip>
              )),
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

const meta = { title: "Átomos/Tooltip" } satisfies Meta

export default meta

export const Ejemplos: StoryObj = { render: () => <TooltipDoc /> }
