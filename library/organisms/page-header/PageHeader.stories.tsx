import type { Meta, StoryObj } from "@storybook/react-vite"
import { Building2, Download, Plus } from "lucide-react"
import { DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Badge } from "../../atoms/badge/Badge"
import { Button } from "../../atoms/button/Button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../molecules/tabs/Tabs"
import { BackLink, PageHeader } from "./PageHeader"

const rules = [
  { title: "Un h1 por pantalla", body: "El título del encabezado es el único h1. Las secciones de abajo usan h2." },
  { title: "Volver a dónde", body: "«Unidades», no «Volver»: dice a qué pantalla lleva." },
  { title: "La acción principal, una", body: "A la derecha y en naranja. En el celular baja debajo del título." },
] as const

function PageHeaderDoc() {
  return (
    <FoundationDoc kicker="Organismos" title="PageHeader" lede="El encabezado de cada pantalla.">
      <DocSection title="Sección de una obra">
        <div className="rounded-surface border border-line bg-canvas p-block">
          <PageHeader
            icon={Building2}
            title="Unidades"
            description="Las 48 unidades de Torre Alamo, con su avance y su cliente."
            actions={
              <>
                <Button variant="outline">
                  <Download className="size-icon-sm" aria-hidden /> Exportar
                </Button>
                <Button>
                  <Plus className="size-icon-sm" aria-hidden /> Nueva unidad
                </Button>
              </>
            }
          />
        </div>
      </DocSection>
      <DocSection title="Detalle con volver, estado y pestañas" lede="Las pestañas envuelven el encabezado y el contenido: cada una apunta a su panel.">
        <div className="rounded-surface border border-line bg-canvas p-block">
          <Tabs defaultValue="avance">
            <PageHeader
              back={<BackLink href="#unidades">Unidades</BackLink>}
              title="Unidad 4B"
              meta={
                <>
                  <Badge tone="ok">A tiempo</Badge>
                  <span className="text-meta text-ink-muted">Piso 4 · 68,25 m² · Carla Ruiz</span>
                </>
              }
              actions={<Button variant="outline">Editar unidad</Button>}
              tabs={
                <TabsList aria-label="Secciones de la unidad">
                  <TabsTrigger value="avance">Avance</TabsTrigger>
                  <TabsTrigger value="fotos">Fotos</TabsTrigger>
                  <TabsTrigger value="cliente">Cliente</TabsTrigger>
                </TabsList>
              }
            />
            <TabsContent value="avance" className="text-body text-ink-muted">
              Avance por rubro de la unidad.
            </TabsContent>
            <TabsContent value="fotos" className="text-body text-ink-muted">
              Fotos cargadas por el equipo.
            </TabsContent>
            <TabsContent value="cliente" className="text-body text-ink-muted">
              Datos del comprador y lo que ve en su portal.
            </TabsContent>
          </Tabs>
        </div>
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Organismos/PageHeader" } satisfies Meta

export default meta

export const Ejemplos: StoryObj = { render: () => <PageHeaderDoc /> }
