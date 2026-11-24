import type { Meta, StoryObj } from "@storybook/react-vite"
import { Building2, ClipboardCheck, HardHat, Wallet } from "lucide-react"
import { DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { MetricCard, MetricStrip } from "./Metric"

const rules = [
  { title: "El dato manda", body: "El número en grande (Recoleta, cifras tabulares); la etiqueta chica arriba." },
  { title: "El cambio, con palabra y flecha", body: "Subir no siempre es bueno (atraso, deuda): good dice si es mejor o peor y el lector de pantalla lo anuncia." },
  { title: "Hasta cuatro por fila", body: "Más de cuatro indicadores juntos ya no se leen de un vistazo." },
] as const

function MetricDoc() {
  return (
    <FoundationDoc kicker="Organismos" title="MetricCard" lede="Indicadores del panel de una obra o del backoffice.">
      <MetricStrip>
        <MetricCard label="Avance de obra" icon={Building2} value="45,5%" progress={{ value: 45.5 }} delta={{ value: "3,2 p.p.", direction: "up", good: true, label: "este mes" }} />
        <MetricCard label="Tareas certificadas" icon={ClipboardCheck} value="312" hint="de 680 tareas" />
        <MetricCard label="Avances pendientes" icon={HardHat} value="3" delta={{ value: "2", direction: "up", good: false, label: "desde ayer" }} />
        <MetricCard label="Facturación del mes" icon={Wallet} value="$ 1.284.000" delta={{ value: "8%", direction: "down", good: false, label: "vs. octubre" }} />
      </MetricStrip>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Organismos/Metric" } satisfies Meta

export default meta

export const Indicadores: StoryObj = { render: () => <MetricDoc /> }
