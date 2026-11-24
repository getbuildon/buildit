import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocExamples, DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { formatPercent } from "../../foundations/format/format"
import { Progress } from "./Progress"

function Row({ value, label, tone }: { value: number; label: string; tone?: "action" | "ok" | "caution" | "danger" }) {
  return (
    <div className="flex w-full max-w-dialog flex-col gap-related">
      <div className="flex justify-between text-meta">
        <span className="text-ink-muted">{label}</span>
        <span className="tabular-nums">{formatPercent(value)}</span>
      </div>
      <Progress value={value} label={label} tone={tone} />
    </div>
  )
}

const rules = [
  { title: "Con nombre", body: "label dice qué mide. El lector de pantalla anuncia «Avance de obra, 45,5%»." },
  { title: "El número al lado", body: "La barra da la idea; el porcentaje escrito da el dato." },
  { title: "Nunca vacía si hubo avance", body: "Con 0,3% se ve una franja mínima: que haya avance se tiene que notar." },
] as const

function ProgressDoc() {
  return (
    <FoundationDoc kicker="Átomos" title="Progress" lede="Barra de avance: de una obra, de un rubro, de una unidad.">
      <DocSection title="Tonos">
        <DocExamples
          items={[
            { name: "action", note: "Avance de obra.", node: <Row value={45.5} label="Avance de obra" /> },
            { name: "ok", note: "Terminado o a tiempo.", node: <Row value={100} label="Albañilería" tone="ok" /> },
            { name: "caution", note: "Atrasado.", node: <Row value={32} label="Instalación eléctrica" tone="caution" /> },
            { name: "danger", note: "Excedido o bloqueado.", node: <Row value={12} label="Sanitaria" tone="danger" /> },
          ]}
        />
      </DocSection>
      <DocSection title="Casos">
        <DocExamples
          items={[
            { name: "Avance mínimo", note: "0,3%: se ve una franja.", node: <Row value={0.3} label="Pintura" /> },
            { name: "Fina", node: <Progress value={60} label="Avance de unidad" size="thin" className="max-w-dialog" /> },
          ]}
        />
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Átomos/Progress" } satisfies Meta

export default meta

export const Tonos: StoryObj = { render: () => <ProgressDoc /> }
