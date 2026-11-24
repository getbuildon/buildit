import type { Meta, StoryObj } from "@storybook/react-vite"
import { Building2, HardHat, Ruler } from "lucide-react"
import { DocExamples, DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Icon, iconSizes } from "../icon/Icon"
import { Separator } from "../separator/Separator"
import { Link } from "./Link"

const linkRules = [
  { title: "Navega", body: "Un link lleva a otro lugar. Si hace algo (guardar, borrar), es un Button." },
  { title: "Afuera, con aviso", body: "external abre en otra pestaña, agrega el ícono y avisa al lector de pantalla." },
  { title: "Con next/link", body: "asChild envuelve el Link de Next para no perder la carga anticipada." },
] as const

function LinkDoc() {
  return (
    <FoundationDoc kicker="Átomos" title="Link" lede="Link de texto.">
      <DocSection title="Variantes">
        <DocExamples
          items={[
            { name: "action", note: "El default.", node: <Link href="#unidades">Ver todas las unidades</Link> },
            {
              name: "ink",
              note: "Dentro de un párrafo.",
              node: (
                <p className="text-body">
                  Revisá los <Link href="#terminos" tone="ink">términos del plan</Link> antes de contratar.
                </p>
              ),
            },
            { name: "external", node: <Link href="https://www.afip.gob.ar" external>Consultar CUIT en ARCA</Link> },
          ]}
        />
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={linkRules} />
      </DocSection>
    </FoundationDoc>
  )
}

function SeparatorDoc() {
  return (
    <FoundationDoc kicker="Átomos" title="Separator" lede="Una línea que separa. Decorativa salvo que marque un corte de sección.">
      <DocExamples
        items={[
          {
            name: "Horizontal",
            node: (
              <div className="flex w-72 flex-col gap-snug text-body">
                <span>Datos de la obra</span>
                <Separator />
                <span>Equipo</span>
              </div>
            ),
          },
          {
            name: "Vertical",
            node: (
              <div className="flex h-6 items-center gap-snug text-meta text-ink-muted">
                <span>48 unidades</span>
                <Separator orientation="vertical" />
                <span>12 pisos</span>
              </div>
            ),
          },
        ]}
      />
    </FoundationDoc>
  )
}

function IconDoc() {
  return (
    <FoundationDoc kicker="Átomos" title="Icon" lede="Un ícono de Lucide con el tamaño y el trazo del sistema. Decorativo salvo que lleve label.">
      <DocExamples
        items={[
          {
            name: "xs · sm · md · lg",
            node: iconSizes.map((size) => <Icon key={size} icon={Building2} size={size} />),
          },
          {
            name: "Con significado",
            note: "label: se anuncia como imagen.",
            node: <Icon icon={HardHat} size="md" label="Operador" />,
          },
          {
            name: "Junto a texto",
            node: (
              <span className="flex items-center gap-related text-body">
                <Icon icon={Ruler} className="text-ink-muted" /> 1.250,5 m²
              </span>
            ),
          },
        ]}
      />
    </FoundationDoc>
  )
}

const meta = { title: "Átomos/Link" } satisfies Meta

export default meta

export const Variantes: StoryObj = { render: () => <LinkDoc /> }
export const SeparatorStory: StoryObj = { name: "Separator", render: () => <SeparatorDoc /> }
export const IconStory: StoryObj = { name: "Icon", render: () => <IconDoc /> }
