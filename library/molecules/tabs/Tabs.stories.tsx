import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocExamples, DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Badge } from "../../atoms/badge/Badge"
import { Segmented } from "../segmented/Segmented"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs"

const tabRules = [
  { title: "Vistas de lo mismo", body: "Resumen, Unidades, Equipo de una obra. Si cada una tiene su URL, es navegación (links), no pestañas." },
  { title: "Flechas entre pestañas", body: "Tab entra a la lista; las flechas cambian de pestaña; Tab de nuevo va al contenido." },
  { title: "Pocas y cortas", body: "Hasta 6. En el celular, si no entran, se desplazan de costado." },
] as const

function TabsDoc() {
  return (
    <FoundationDoc kicker="Moléculas" title="Tabs" lede="Cambiar de vista dentro de la misma pantalla. Hoy la app casi no las usa: cada sección arma sus botones a mano.">
      <DocSection title="Ejemplo">
        <Tabs defaultValue="resumen" className="max-w-reading">
          <TabsList aria-label="Secciones de la obra">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="unidades">
              Unidades <Badge size="compact">48</Badge>
            </TabsTrigger>
            <TabsTrigger value="equipo">Equipo</TabsTrigger>
            <TabsTrigger value="archivo" disabled>
              Archivo
            </TabsTrigger>
          </TabsList>
          <TabsContent value="resumen">
            <p className="text-body text-ink-muted">Avance general, próximos hitos y avances pendientes.</p>
          </TabsContent>
          <TabsContent value="unidades">
            <p className="text-body text-ink-muted">Las 48 unidades por piso, con su avance.</p>
          </TabsContent>
          <TabsContent value="equipo">
            <p className="text-body text-ink-muted">Quién trabaja en la obra y con qué permisos.</p>
          </TabsContent>
        </Tabs>
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={tabRules} />
      </DocSection>
    </FoundationDoc>
  )
}

const segmentedRules = [
  { title: "2 a 5 opciones a la vista", body: "Para más, Select. Para vistas con contenido distinto, Tabs." },
  { title: "Siempre una elegida", body: "Tocar la que está activa no la apaga." },
  { title: "Todas en tinta", body: "El gris de las opciones no elegidas de hoy da 4,4:1 sobre la pista. Van todas en tinta; la elegida se distingue por el fondo y la sombra." },
  { title: "Curvas paralelas", body: "El ítem redondea 6 dentro de la pista de 10 (con 4 de aire). Hoy es 8: dos píxeles de diferencia para que las curvas queden concéntricas." },
] as const

function SegmentedDoc() {
  const [status, setStatus] = useState("en-curso")
  const [view, setView] = useState("lista")
  return (
    <FoundationDoc kicker="Moléculas" title="Segmented" lede="Opciones excluyentes a la vista. Mismo aspecto que el selector de estado del portal de clientes.">
      <DocExamples
        items={[
          {
            name: "Estado de un hito",
            node: (
              <Segmented
                label="Estado del hito"
                value={status}
                onValueChange={setStatus}
                options={[
                  { value: "pendiente", label: "Pendiente" },
                  { value: "en-curso", label: "En curso" },
                  { value: "listo", label: "Listo" },
                ]}
              />
            ),
          },
          {
            name: "compact",
            node: (
              <Segmented
                label="Vista"
                size="compact"
                value={view}
                onValueChange={setView}
                options={[
                  { value: "lista", label: "Lista" },
                  { value: "pisos", label: "Por piso" },
                ]}
              />
            ),
          },
        ]}
      />
      <DocSection title="Reglas">
        <DocRules rules={segmentedRules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Moléculas/Tabs" } satisfies Meta

export default meta

export const Ejemplo: StoryObj = { render: () => <TabsDoc /> }
export const SegmentedStory: StoryObj = { name: "Segmented", render: () => <SegmentedDoc /> }
