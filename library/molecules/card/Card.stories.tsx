import type { Meta, StoryObj } from "@storybook/react-vite"
import { Building2, Ellipsis, Plus } from "lucide-react"
import { DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Badge } from "../../atoms/badge/Badge"
import { Button } from "../../atoms/button/Button"
import { IconButton } from "../../atoms/button/IconButton"
import { Progress } from "../../atoms/progress/Progress"
import { Tag } from "../../atoms/tag/Tag"
import { Accordion, AccordionItem } from "../accordion/Accordion"
import { EmptyState } from "../empty-state/EmptyState"
import { Card, CardBody, CardFooter, CardHeader } from "./Card"

const cardRules = [
  { title: "Una card, un tema", body: "Una obra, un indicador, un bloque de configuración. No una card adentro de otra." },
  { title: "Toda la card se toca, o nada", body: "interactive con asChild sobre el link. No un link chiquito escondido en una card que parece tocable." },
  { title: "El título es un título", body: "CardHeader usa h3 por defecto (as=\"h2\" si es el primer nivel de la pantalla)." },
] as const

function CardDoc() {
  return (
    <FoundationDoc kicker="Moléculas" title="Card" lede="Contenedor de un bloque. Reemplaza las 56 cards armadas a mano con radios, bordes y sombras distintas.">
      <div className="grid gap-group md:grid-cols-2">
        <Card>
          <CardHeader
            title="Torre Alamo"
            description="48 unidades · Av. Siempreviva 742"
            action={<IconButton icon={Ellipsis} label="Opciones de Torre Alamo" tooltip={false} />}
          />
          <CardBody>
            <div className="flex items-end justify-between">
              <p className="text-metric">45,5%</p>
              <Badge tone="ok">A tiempo</Badge>
            </div>
            <Progress value={45.5} label="Avance de Torre Alamo" />
          </CardBody>
          <CardFooter>
            <Tag tone="azul">Albañilería</Tag>
            <Tag tone="violeta">Eléctrica</Tag>
          </CardFooter>
        </Card>
        <Card variant="interactive" asChild>
          <a href="#obra">
            <CardHeader title="Barrio Los Álamos" description="Click en toda la card" />
            <CardBody>
              <Progress value={12} label="Avance de Barrio Los Álamos" tone="caution" />
              <p className="text-meta text-ink-muted">12% · 4 días de atraso</p>
            </CardBody>
          </a>
        </Card>
        <Card variant="hint">
          <CardHeader title="Facturación del mes" description={'variant="hint": halo de las cards del backoffice'} />
          <CardBody>
            <p className="text-metric">$ 1.284.000</p>
          </CardBody>
        </Card>
      </div>
      <DocSection title="Reglas">
        <DocRules rules={cardRules} />
      </DocSection>
    </FoundationDoc>
  )
}

const emptyRules = [
  { title: "Qué falta y cómo resolverlo", body: "«Todavía no hay unidades» + «Cargá las unidades para seguir el avance» + el botón." },
  { title: "Distinto de un error", body: "Vacío es normal (todavía no hay). Si algo falló, Notice de peligro." },
  { title: "Sin resultados de búsqueda", body: "Decir qué se buscó y ofrecer limpiar el filtro." },
] as const

function EmptyDoc() {
  return (
    <FoundationDoc kicker="Moléculas" title="EmptyState" lede="Cuando no hay nada para mostrar.">
      <div className="grid gap-group md:grid-cols-2">
        <Card>
          <EmptyState
            icon={Building2}
            title="Todavía no hay unidades"
            description="Cargá las unidades de la obra para empezar a seguir el avance de cada una."
            action={
              <Button>
                <Plus className="size-icon-sm" aria-hidden /> Cargar unidades
              </Button>
            }
          />
        </Card>
        <Card>
          <EmptyState
            size="compact"
            title="Sin resultados para «4Z»"
            description="Probá con otro identificador o limpiá la búsqueda."
            action={
              <Button variant="outline" size="compact">
                Limpiar búsqueda
              </Button>
            }
          />
        </Card>
      </div>
      <DocSection title="Reglas">
        <DocRules rules={emptyRules} />
      </DocSection>
    </FoundationDoc>
  )
}

function AccordionDoc() {
  return (
    <FoundationDoc kicker="Moléculas" title="Accordion" lede="Secciones que se abren y se cierran. Reemplaza AnimatedCollapsible, con teclado y lector de pantalla.">
      <Accordion type="multiple" defaultValue={["albanileria"]} className="max-w-reading">
        <AccordionItem value="albanileria" title="Albañilería" meta="8 tareas · 62%">
          Mampostería, revoques y contrapisos de las unidades del piso 1 al 12.
        </AccordionItem>
        <AccordionItem value="electrica" title="Instalación eléctrica" meta="5 tareas · 30%">
          Cañerías, cableado y tableros por unidad.
        </AccordionItem>
        <AccordionItem value="sanitaria" title="Instalación sanitaria" meta="6 tareas · 12%">
          Agua fría y caliente, desagües y artefactos.
        </AccordionItem>
      </Accordion>
    </FoundationDoc>
  )
}

const meta = { title: "Moléculas/Card" } satisfies Meta

export default meta

export const Variantes: StoryObj = { render: () => <CardDoc /> }
export const EmptyStateStory: StoryObj = { name: "EmptyState", render: () => <EmptyDoc /> }
export const AccordionStory: StoryObj = { name: "Accordion", render: () => <AccordionDoc /> }
