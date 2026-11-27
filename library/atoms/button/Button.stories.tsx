import type { Meta, StoryObj } from "@storybook/react-vite"
import { Check, Plus, Trash2 } from "lucide-react"
import { DocExamples, DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Icon } from "../icon/Icon"
import { Button } from "./Button"

const rules = [
  { title: "Uno por pantalla", body: "action es la acción principal. Si hay dos, una es outline." },
  { title: "type=\"button\" por defecto", body: "Un botón adentro de un formulario no lo envía sin querer. El que envía lleva type=\"submit\"." },
  { title: "Cargando, no deshabilitado", body: "Mientras guarda, loading: muestra el spinner, bloquea el doble clic y avisa al lector de pantalla." },
  { title: "Links que parecen botón", body: "asChild con el Link de next/link: navega como link y se ve como botón." },
  { title: "Borrar es danger", body: "La acción que no se deshace va en rojo y pide confirmación (molécula AlertDialog)." },
] as const

function ButtonDoc() {
  return (
    <FoundationDoc
      kicker="Átomos"
      title="Button"
      lede="El botón del sistema. Hoy la app tiene 54 botones con el componente y 215 armados a mano, con 6 alturas y 4 radios distintos. Este los reemplaza a todos."
    >
      <DocSection title="Variantes">
        <DocExamples
          items={[
            { name: "action", note: "Acción principal. Naranja ladrillo con letra blanca (4.7:1); en oscuro, naranja con tinta oscura.", node: <Button>Certificar</Button> },
            { name: "outline", note: "Acción secundaria.", node: <Button variant="outline">Cancelar</Button> },
            { name: "ghost", note: "Acción terciaria, barras de herramientas.", node: <Button variant="ghost">Ver detalle</Button> },
            {
              name: "danger",
              note: "Confirmar algo que no se deshace.",
              node: (
                <Button variant="danger">
                  <Icon icon={Trash2} /> Borrar unidad
                </Button>
              ),
            },
            { name: "danger-quiet", note: "Borrar como opción, no como acción principal.", node: <Button variant="danger-quiet">Eliminar</Button> },
          ]}
        />
      </DocSection>
      <DocSection title="Tamaños">
        <DocExamples
          items={[
            { name: "compact · 36", note: "Tablas, filtros.", node: <Button size="compact">Filtrar</Button> },
            { name: "default · 44", note: "Formularios, diálogos.", node: <Button>Guardar</Button> },
            { name: "large · 52", note: "Landing, acción principal de una pantalla.", node: <Button size="large">Empezar gratis</Button> },
            { name: "fullWidth", note: "Celular, pie de diálogo.", node: <Button fullWidth>Continuar</Button> },
          ]}
        />
      </DocSection>
      <DocSection title="Estados">
        <DocExamples
          items={[
            {
              name: "Con ícono",
              node: (
                <>
                  <Button>
                    <Icon icon={Plus} /> Nueva obra
                  </Button>
                  <Button variant="outline">
                    <Icon icon={Check} /> Marcar lista
                  </Button>
                </>
              ),
            },
            { name: "Cargando", note: "Probá con el lector de pantalla: anuncia «Guardando».", node: <Button loading>Guardar</Button> },
            {
              name: "Deshabilitado",
              node: (
                <>
                  <Button disabled>Certificar</Button>
                  <Button variant="outline" disabled>
                    Cancelar
                  </Button>
                </>
              ),
            },
            {
              name: "Como link",
              note: "asChild: es un <a>, se ve como botón.",
              node: (
                <Button asChild variant="outline">
                  <a href="#unidades">Ver unidades</a>
                </Button>
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

const meta = { title: "Átomos/Button" } satisfies Meta

export default meta

export const Variantes: StoryObj = { render: () => <ButtonDoc /> }
