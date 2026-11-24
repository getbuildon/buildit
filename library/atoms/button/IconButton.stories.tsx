import type { Meta, StoryObj } from "@storybook/react-vite"
import { Ellipsis, Pencil, Plus, Trash2, X } from "lucide-react"
import { DocExamples, DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { IconButton } from "./IconButton"

const rules = [
  { title: "El nombre es obligatorio", body: "label no es opcional: sin él no compila. Lo lee el lector de pantalla y aparece como tooltip." },
  { title: "Tocable de 44", body: "Aunque se dibuje de 36 (compact), el área que responde al toque mide 44." },
  { title: "Si no se entiende solo, con texto", body: "Un ícono solo sirve para acciones muy conocidas (cerrar, editar, más opciones). Si no, Button con ícono y texto." },
] as const

function IconButtonDoc() {
  return (
    <FoundationDoc kicker="Átomos" title="IconButton" lede="Botón que es solo un ícono. Pasá el mouse o navegá con Tab: muestra su nombre.">
      <DocSection title="Variantes">
        <DocExamples
          items={[
            { name: "ghost", note: "El default: filas, encabezados.", node: <IconButton icon={Ellipsis} label="Más opciones" /> },
            { name: "outline", node: <IconButton icon={Pencil} label="Editar obra" variant="outline" /> },
            { name: "action", node: <IconButton icon={Plus} label="Agregar unidad" variant="action" /> },
            { name: "danger-quiet", node: <IconButton icon={Trash2} label="Borrar tarea" variant="danger-quiet" /> },
          ]}
        />
      </DocSection>
      <DocSection title="Tamaños y estados">
        <DocExamples
          items={[
            {
              name: "compact · default · large",
              node: (
                <>
                  <IconButton icon={X} label="Cerrar" size="compact" />
                  <IconButton icon={X} label="Cerrar" />
                  <IconButton icon={X} label="Cerrar" size="large" />
                </>
              ),
            },
            { name: "Cargando", node: <IconButton icon={Trash2} label="Borrando" loading /> },
            { name: "Deshabilitado", node: <IconButton icon={Pencil} label="Editar" variant="outline" disabled /> },
          ]}
        />
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Átomos/IconButton" } satisfies Meta

export default meta

export const Variantes: StoryObj = { render: () => <IconButtonDoc /> }
