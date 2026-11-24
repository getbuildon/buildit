import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc } from "../../foundations/docs/FoundationDoc"
import { formatPercent } from "../../foundations/format/format"
import { Badge } from "../../atoms/badge/Badge"
import { FloorPlan, FloorPlanCell, type Floor, type FloorUnit, type FloorUnitStatus } from "./FloorPlan"

function statusFor(progress: number, late: boolean): FloorUnitStatus {
  if (progress === 0) return "sin-empezar"
  if (progress === 100) return "terminada"
  return late ? "atrasada" : "a-tiempo"
}

const floors: Floor[] = Array.from({ length: 8 }, (_, index) => {
  const number = 8 - index
  const label = number === 1 ? "PB" : `Piso ${number - 1}`
  return {
    id: `p${number}`,
    label,
    units: ["A", "B", "C", "D", "E", "F"].map((letter, unitIndex) => {
      const progress = Math.max(0, Math.min(100, 118 - number * 14 - unitIndex * 3))
      const name = `${number === 1 ? "PB" : number - 1}${letter}`
      return { id: name, name, progress, status: statusFor(progress, (number + unitIndex) % 5 === 0) }
    }),
  }
})

const statusTone = { "sin-empezar": "neutral", "en-curso": "neutral", "a-tiempo": "ok", atrasada: "caution", bloqueada: "danger", terminada: "ok" } as const
const statusLabel = { "sin-empezar": "Sin empezar", "en-curso": "En curso", "a-tiempo": "A tiempo", atrasada: "Atrasada", bloqueada: "Bloqueada", terminada: "Terminada" } as const

function Example() {
  const [selected, setSelected] = useState<FloorUnit | undefined>(floors[3].units[1])
  return (
    <div className="grid gap-block lg:grid-cols-[minmax(0,1fr)_16rem]">
      <FloorPlan
        label="Plano de Torre Alamo por piso"
        floors={floors}
        selectedId={selected?.id}
        renderLink={(unit) => (
          <a
            href={`#unidad-${unit.id}`}
            onClick={(event) => {
              event.preventDefault()
              setSelected(unit)
            }}
          >
            <FloorPlanCell unit={unit} />
          </a>
        )}
      />
      <aside aria-live="polite" className="flex h-fit flex-col gap-snug rounded-surface border border-line bg-canvas-raised p-group">
        {selected ? (
          <>
            <p className="text-meta text-ink-muted">Unidad</p>
            <p className="text-heading">{selected.name}</p>
            <p className="text-metric">{formatPercent(selected.progress)}</p>
            <Badge tone={statusTone[selected.status]} className="w-fit">
              {statusLabel[selected.status]}
            </Badge>
          </>
        ) : (
          <p className="text-body text-ink-muted">Elegí una unidad.</p>
        )}
      </aside>
    </div>
  )
}

const rules = [
  { title: "El edificio como es", body: "El último piso arriba y la planta baja abajo: se lee igual que la obra." },
  { title: "Estado con color y palabra", body: "El fondo de cada unidad dice su estado; el lector de pantalla lo dice en palabras: «Unidad 3B, 58% de avance, a tiempo»." },
  { title: "Cada unidad es un link", body: "Lleva al detalle de la unidad. Con Tab se recorre piso por piso." },
  { title: "Celular", body: "Los pisos se desplazan de costado; los nombres de los pisos quedan a la izquierda." },
] as const

function FloorPlanDoc() {
  return (
    <FoundationDoc kicker="Organismos" title="Plano por piso" lede="La obra piso por piso, con el avance y el estado de cada unidad. Propio de BuildOn. Tocá una unidad.">
      <Example />
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Organismos/Plano por piso" } satisfies Meta

export default meta

export const Ejemplo: StoryObj = { render: () => <FloorPlanDoc /> }
