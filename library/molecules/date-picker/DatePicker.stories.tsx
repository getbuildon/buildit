import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocExamples, DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Field } from "../field/Field"
import { DatePicker, formatPickedDate } from "./DatePicker"
import { DateRangePicker, type DateRange } from "./DateRangePicker"

function Single() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 6, 30))
  return (
    <div className="flex flex-col gap-compact">
      <Field label="Fecha de inicio" description="Escribila (30/07/2026) o elegila en el calendario." className="w-72">
        <DatePicker value={date} onChange={setDate} />
      </Field>
      <p className="text-meta text-ink-muted">Valor: {formatPickedDate(date)}</p>
    </div>
  )
}

function Limited() {
  const [date, setDate] = useState<Date | undefined>()
  const today = new Date()
  return (
    <Field label="Fecha del avance" description="No puede ser una fecha futura." className="w-72">
      <DatePicker value={date} onChange={setDate} max={today} />
    </Field>
  )
}

function Range() {
  const [range, setRange] = useState<DateRange | undefined>()
  return (
    <Field label="Período del reporte" className="w-80">
      <DateRangePicker value={range} onChange={setRange} />
    </Field>
  )
}

const rules = [
  { title: "Se puede escribir", body: "Hoy solo se elige en el calendario: para una fecha de hace dos años eran 24 clics. Ahora se escribe 30072026 y las barras se ponen solas." },
  { title: "Límites de verdad", body: "min y max deshabilitan los días afuera y marcan error si se escribe una fecha fuera de rango." },
  { title: "No se sale de la pantalla", body: "El calendario de hoy tiene apagado el reacomodo (avoidCollisions={false}): en el celular puede quedar cortado." },
  { title: "Teclado", body: "Alt+↓ abre el calendario; flechas mueven el día; PageUp/PageDown cambian de mes; Enter elige." },
  { title: "Rango con atajos y Aplicar", body: "Últimos 30 días, este mes, mes pasado. El rango se confirma con Aplicar: no se cierra a mitad de elegir." },
] as const

function DatePickerDoc() {
  return (
    <FoundationDoc kicker="Moléculas" title="DatePicker" lede="Fechas: una sola o un período.">
      <DocSection title="Ejemplos">
        <DocExamples
          items={[
            { name: "Fecha", node: <Single /> },
            { name: "Con límite", note: "max = hoy.", node: <Limited /> },
            { name: "Período", note: "DateRangePicker", node: <Range /> },
          ]}
        />
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Moléculas/DatePicker" } satisfies Meta

export default meta

export const Ejemplos: StoryObj = { render: () => <DatePickerDoc /> }
