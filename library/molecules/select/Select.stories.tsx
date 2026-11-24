import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocExamples, DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Select, SelectGroup, SelectItem, SelectSeparator } from "./Select"

const rules = [
  { title: "Hasta ~15 opciones", body: "Para más, o para buscar escribiendo, Combobox (próxima tanda). Para 2 a 5 a la vista, Segmented." },
  { title: "Nada de <select> nativo suelto", body: "Hoy hay 6 con estilos propios. Este se ve igual que los campos y funciona igual con teclado." },
  { title: "Un placeholder que pide", body: "«Elegí un rubro», no «Seleccionar»." },
] as const

function SelectDoc() {
  return (
    <FoundationDoc kicker="Moléculas" title="Select" lede="Elegir una opción de una lista. Con teclado: Enter abre, flechas recorren, una letra salta.">
      <DocSection title="Variantes">
        <DocExamples
          items={[
            {
              name: "Simple",
              node: (
                <Select aria-label="Rubro" placeholder="Elegí un rubro" className="w-72">
                  <SelectItem value="albanileria">Albañilería</SelectItem>
                  <SelectItem value="electrica">Instalación eléctrica</SelectItem>
                  <SelectItem value="sanitaria">Instalación sanitaria</SelectItem>
                  <SelectItem value="pintura" disabled>
                    Pintura (sin tareas)
                  </SelectItem>
                </Select>
              ),
            },
            {
              name: "Con grupos",
              node: (
                <Select aria-label="Unidad" placeholder="Elegí una unidad" className="w-72">
                  <SelectGroup label="Piso 1">
                    <SelectItem value="1a">1A</SelectItem>
                    <SelectItem value="1b">1B</SelectItem>
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup label="Piso 2">
                    <SelectItem value="2a">2A</SelectItem>
                    <SelectItem value="2b">2B</SelectItem>
                  </SelectGroup>
                </Select>
              ),
            },
            {
              name: "Con valor · compact",
              node: (
                <Select aria-label="Estado" defaultValue="en-curso" size="compact" className="w-48">
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="en-curso">En curso</SelectItem>
                  <SelectItem value="terminadas">Terminadas</SelectItem>
                </Select>
              ),
            },
            {
              name: "Error · deshabilitado",
              node: (
                <>
                  <Select aria-label="Plan" invalid className="w-48">
                    <SelectItem value="obra">Plan Obra</SelectItem>
                  </Select>
                  <Select aria-label="Plan" disabled defaultValue="obra" className="w-48">
                    <SelectItem value="obra">Plan Obra</SelectItem>
                  </Select>
                </>
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

const meta = { title: "Moléculas/Select" } satisfies Meta

export default meta

export const Variantes: StoryObj = { render: () => <SelectDoc /> }
