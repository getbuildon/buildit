import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { formatMoney, formatMoneyCompact } from "../../foundations/format/format"
import { Card, CardBody, CardHeader } from "../../molecules/card/Card"
import { BarChart, DonutChart, ProgressCurve } from "./Charts"

const curve = [
  { label: "Jun", planned: 5, actual: 4 },
  { label: "Jul", planned: 12, actual: 10 },
  { label: "Ago", planned: 22, actual: 18 },
  { label: "Sep", planned: 35, actual: 29 },
  { label: "Oct", planned: 48, actual: 41 },
  { label: "Nov", planned: 60, actual: 45.5 },
  { label: "Dic", planned: 71 },
  { label: "Ene", planned: 81 },
  { label: "Feb", planned: 89 },
  { label: "Mar", planned: 95 },
  { label: "Abr", planned: 100 },
]

const rules = [
  { title: "Colores que se ven", body: "Los tonos sólidos de la librería pasan 3:1 contra la superficie en los dos modos. Hoy el gris de «inactivas» (#afb3ba) da 2,1:1 y casi no se distingue del fondo." },
  { title: "Los números, para todos", body: "Cada gráfico lleva su tabla de datos para el lector de pantalla. Hoy los gráficos de barras no dicen nada a quien no los ve." },
  { title: "La leyenda escrita", body: "La dona muestra al lado cada valor y su porcentaje: no hace falta adivinar por el color." },
  { title: "Sin animar si molesta", body: "Con menos movimiento pedido en el sistema, los gráficos aparecen sin animación." },
  { title: "Ejes abreviados", body: "En el eje, «$ 684 mil»; el monto completo, en el tooltip y en la tabla para el lector de pantalla." },
  { title: "Series en orden fijo", body: "La primera serie siempre es naranja, la segunda azul: un mismo dato no cambia de color entre gráficos." },
] as const

function ChartsDoc() {
  return (
    <FoundationDoc kicker="Organismos" title="Gráficos" lede="Barras, dona y curva de avance, sobre Recharts (la misma librería que usa hoy el panel), con los colores y textos de la librería. Pasá el mouse por las barras.">
      <div className="grid gap-group lg:grid-cols-2">
        <Card variant="hint">
          <CardHeader title="Estado de suscripciones" description="Al cierre del período" />
          <CardBody>
            <DonutChart
              label="Suscripciones por estado"
              centerLabel="42"
              data={[
                { label: "Activas", value: 31, tone: "verde" },
                { label: "Inactivas", value: 5, tone: "neutral" },
                { label: "Vencidas", value: 4, tone: "amarillo" },
                { label: "Dadas de baja", value: 2, tone: "rojo" },
              ]}
            />
          </CardBody>
        </Card>
        <Card variant="hint">
          <CardHeader title="Facturación por plan" description="Noviembre 2026" />
          <CardBody>
            <BarChart
              label="Facturación por plan"
              format={(value) => formatMoney(value)}
              axisFormat={(value) => formatMoneyCompact(value)}
              data={[
                { label: "Obra", value: 684000 },
                { label: "Constructora", value: 412000, tone: "azul" },
                { label: "Inicial", value: 188000, tone: "verde" },
              ]}
            />
          </CardBody>
        </Card>
      </div>
      <Card>
        <CardHeader title="Curva de avance · Torre Alamo" description="Planificado contra real, en % de la obra" />
        <CardBody>
          <ProgressCurve label="Curva de avance de Torre Alamo" data={curve} />
        </CardBody>
      </Card>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Organismos/Gráficos" } satisfies Meta

export default meta

export const Ejemplos: StoryObj = { render: () => <ChartsDoc /> }
