import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocExamples, DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { Skeleton } from "../skeleton/Skeleton"
import { Spinner } from "./Spinner"

const spinnerRules = [
  { title: "En español", body: "Anuncia «Cargando» (o lo que se le pase). El de la app decía «Loading»." },
  { title: "Para esperas cortas", body: "Un botón que guarda, un dato que se actualiza. Si se carga una pantalla o una lista, Skeleton." },
  { title: "Con menos movimiento, más lento", body: "Si la persona pidió menos movimiento, gira despacio en vez de desaparecer: igual tiene que saber que algo pasa." },
] as const

function SpinnerDoc() {
  return (
    <FoundationDoc kicker="Átomos" title="Spinner" lede="Algo se está haciendo.">
      <DocSection title="Tamaños">
        <DocExamples
          items={[
            { name: "xs · sm · md · lg", node: (["xs", "sm", "md", "lg"] as const).map((size) => <Spinner key={size} size={size} />) },
            {
              name: "Con texto",
              node: (
                <span className="flex items-center gap-compact text-body text-ink-muted">
                  <Spinner label="Actualizando avance" /> Actualizando avance…
                </span>
              ),
            },
          ]}
        />
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={spinnerRules} />
      </DocSection>
    </FoundationDoc>
  )
}

const skeletonRules = [
  { title: "Con la forma de lo que viene", body: "Las mismas medidas que el contenido: al cargar, nada salta de lugar." },
  { title: "Un solo color", body: "Toma el color del modo (claro u oscuro). Hoy hay que elegir tono claro u oscuro a mano." },
  { title: "Avisar que carga", body: "El contenedor lleva aria-busy=\"true\"; los bloques son decorativos." },
] as const

function SkeletonDoc() {
  return (
    <FoundationDoc kicker="Átomos" title="Skeleton" lede="El lugar de algo que todavía carga.">
      <DocSection title="Formas">
        <DocExamples
          items={[
            { name: "text", node: <Skeleton shape="text" className="w-48 text-body" /> },
            { name: "block", node: <Skeleton className="h-control w-40" /> },
            { name: "circle", node: <Skeleton shape="circle" className="size-avatar-md" /> },
          ]}
        />
      </DocSection>
      <DocSection title="En contexto: card de obra cargando">
        <div aria-busy="true" className="flex max-w-dialog flex-col gap-snug rounded-surface border border-line bg-canvas-raised p-group">
          <div className="flex items-center gap-snug">
            <Skeleton shape="circle" className="size-avatar-md" />
            <div className="flex flex-1 flex-col gap-related">
              <Skeleton shape="text" className="w-1/2 text-section" />
              <Skeleton shape="text" className="w-1/3 text-meta" />
            </div>
          </div>
          <Skeleton className="h-2" />
        </div>
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={skeletonRules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Átomos/Spinner" } satisfies Meta

export default meta

export const Tamaños: StoryObj = { render: () => <SpinnerDoc /> }

export const SkeletonStory: StoryObj = { name: "Skeleton", render: () => <SkeletonDoc /> }
