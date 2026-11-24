import type { Meta, StoryObj } from "@storybook/react-vite"
import { CircleAlert, CircleCheck, Clock, Info } from "lucide-react"
import { DocExamples, DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Badge } from "./Badge"

const rules = [
  { title: "Es un estado", body: "Certificada, Pendiente, Rechazada, A tiempo. Para categorías (rubro, unidad), Tag." },
  { title: "Palabra siempre, ícono si suma", body: "El color solo no alcanza: una persona daltónica tiene que poder leer el estado." },
  { title: "No se toca", body: "Un badge no es un botón. Si filtra o abre algo, es un botón o un toggle." },
] as const

function BadgeDoc() {
  return (
    <FoundationDoc kicker="Átomos" title="Badge" lede="El estado de algo. Hoy cada sección arma sus propias pastillas de estado con colores sueltos.">
      <DocSection title="Tonos">
        <DocExamples
          items={[
            { name: "neutral", node: <Badge>Borrador</Badge> },
            { name: "action", node: <Badge tone="action">Nueva</Badge> },
            { name: "ok", node: <Badge tone="ok" icon={CircleCheck}>Certificada</Badge> },
            { name: "caution", node: <Badge tone="caution" icon={Clock}>Pendiente de revisión</Badge> },
            { name: "danger", node: <Badge tone="danger" icon={CircleAlert}>Rechazada</Badge> },
            { name: "info", node: <Badge tone="info" icon={Info}>Plano actualizado</Badge> },
          ]}
        />
      </DocSection>
      <DocSection title="Tamaños">
        <DocExamples
          items={[
            { name: "compact · 20", note: "Tablas densas.", node: <Badge tone="ok" size="compact">A tiempo</Badge> },
            { name: "default · 24", node: <Badge tone="ok">A tiempo</Badge> },
          ]}
        />
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Átomos/Badge" } satisfies Meta

export default meta

export const Tonos: StoryObj = { render: () => <BadgeDoc /> }
