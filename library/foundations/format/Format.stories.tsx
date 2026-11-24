import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc } from "../docs/FoundationDoc"
import { formatArea, formatDate, formatMoney, formatNumber, formatPercent, type DateFormat } from "./format"

const sampleDate = "2026-07-30T19:33:00Z"

const numbers = [
  { call: "formatMoney(1234567)", result: formatMoney(1234567), uses: "Pesos, sin centavos." },
  { call: 'formatMoney(120, { currency: "USD" })', result: formatMoney(120, { currency: "USD" }), uses: "Planes en dólares." },
  { call: "formatMoney(99.5, { decimals: 2 })", result: formatMoney(99.5, { decimals: 2 }), uses: "Cuando hacen falta centavos." },
  { call: "formatNumber(1234.567)", result: formatNumber(1234.567), uses: "Punto de miles, coma decimal." },
  { call: "formatPercent(45.5)", result: formatPercent(45.5), uses: "Avance. Recibe 45.5, no 0.455." },
  { call: "formatArea(1250.5)", result: formatArea(1250.5), uses: "Superficie." },
  { call: "formatNumber(null)", result: formatNumber(null), uses: "Sin dato: raya." },
] as const

const dates: { format: DateFormat; uses: string }[] = [
  { format: "numeric", uses: "Formularios y exportaciones." },
  { format: "table", uses: "Tablas y listados. El default." },
  { format: "compact", uses: "Listas compactas del mismo año." },
  { format: "long", uses: "Encabezados: el día de hoy." },
  { format: "time", uses: "Hora de carga." },
  { format: "datetime", uses: "Meta de una tarea." },
]

const rules = [
  { title: "Un solo lugar", body: "Todo número, monto o fecha que se muestra pasa por estas funciones. Hoy el formato está repartido en varios archivos de la app." },
  { title: "Hora de Buenos Aires", body: "Siempre, aunque la persona esté en otra zona horaria: la obra está en Argentina." },
  { title: "Coma decimal también en porcentajes", body: "45,5%. Hoy la app muestra 45.5%: al adoptar la librería, cambia." },
  { title: "Sin dato, raya", body: "Nunca 0 ni vacío cuando no hay dato: —." },
] as const

function Row({ call, result, uses }: { call: string; result: string; uses: string }) {
  return (
    <li className="flex flex-col gap-related p-group sm:flex-row sm:items-center sm:gap-block">
      <span className="text-section tabular-nums sm:w-64">{result}</span>
      <span className="flex-1 text-body text-ink-muted">{uses}</span>
      <code className="font-mono text-meta text-ink-muted">{call}</code>
    </li>
  )
}

function FormatRoles() {
  return (
    <FoundationDoc title="Formato" lede="Plata, números, porcentajes, superficie y fechas en español de Argentina.">
      <DocSection title="Números">
        <ul className="divide-y divide-line overflow-hidden rounded-surface border border-line bg-canvas-raised">
          {numbers.map((row) => (
            <Row key={row.call} {...row} />
          ))}
        </ul>
      </DocSection>
      <DocSection title="Fechas" lede="Ejemplo: 30 de julio de 2026, 16:33 en Buenos Aires.">
        <ul className="divide-y divide-line overflow-hidden rounded-surface border border-line bg-canvas-raised">
          {dates.map((row) => (
            <Row key={row.format} call={`formatDate(fecha, "${row.format}")`} result={formatDate(sampleDate, row.format)} uses={row.uses} />
          ))}
        </ul>
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Foundations/Formato" } satisfies Meta

export default meta

export const Roles: StoryObj = { render: () => <FormatRoles /> }
