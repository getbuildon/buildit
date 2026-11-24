import type { Meta, StoryObj } from "@storybook/react-vite"
import { Building2, CalendarDays, CircleCheck, ClipboardList, HardHat, Ruler, TriangleAlert, Users } from "lucide-react"
import { DocRules, DocSection, FoundationDoc } from "../docs/FoundationDoc"

const sample = [
  { Icon: Building2, name: "Obra" },
  { Icon: ClipboardList, name: "Tareas" },
  { Icon: CircleCheck, name: "Certificado" },
  { Icon: TriangleAlert, name: "Atención" },
  { Icon: Users, name: "Equipo" },
  { Icon: CalendarDays, name: "Fecha" },
  { Icon: Ruler, name: "Superficie" },
  { Icon: HardHat, name: "Operador" },
] as const

const sizes = ["size-icon-xs", "size-icon-sm", "size-icon-md", "size-icon-lg"] as const

const rules = [
  { title: "Un solo set: Lucide", body: "Es el que ya usa la app. No se mezclan íconos de otros sets." },
  { title: "Trazo 1.75", body: "Todos los íconos con strokeWidth var(--icon-stroke). Hoy conviven 1, 1.25, 1.5, 1.75, 2 y 2.5." },
  { title: "El tamaño va con el texto", body: "Con texto de cuerpo, icon-sm (16). Solo, icon-lg (24). En badges, icon-xs (12)." },
  { title: "El color es el del texto", body: "currentColor. Un ícono no se pinta aparte salvo que sea un estado (fn-*)." },
  { title: "Ícono solo, con nombre", body: "Un botón que es solo ícono lleva aria-label." },
] as const

function IconographyRoles() {
  return (
    <FoundationDoc title="Iconografía" lede="El set, el trazo y los cuatro tamaños.">
      <DocSection title="Tamaños">
        <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-surface border border-line bg-canvas-raised">
          {sizes.map((size) => (
            <li key={size} className="flex flex-wrap items-center gap-block p-group">
              <code className="w-32 font-mono text-meta text-ink-muted">{size}</code>
              {sample.map(({ Icon, name }) => (
                <Icon key={name} className={size} style={{ strokeWidth: "var(--icon-stroke)" }} aria-hidden />
              ))}
            </li>
          ))}
        </ul>
      </DocSection>
      <DocSection title="Con texto" lede="icon-sm con text-body y gap related.">
        <ul className="flex flex-wrap gap-block">
          {sample.map(({ Icon, name }) => (
            <li key={name} className="flex items-center gap-related text-body">
              <Icon className="size-icon-sm text-ink-muted" style={{ strokeWidth: "var(--icon-stroke)" }} aria-hidden />
              {name}
            </li>
          ))}
        </ul>
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Foundations/Iconografía" } satisfies Meta

export default meta

export const Roles: StoryObj = { render: () => <IconographyRoles /> }
