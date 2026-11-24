import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc, TokenTable } from "../docs/FoundationDoc"

const controls = [
  { token: "--size-control-height-compact · h-control-compact", title: "Alto compacto · 36", uses: "Tablas, toolbars, filtros.", className: "h-control-compact" },
  { token: "--size-control-height · h-control", title: "Alto default · 44", uses: "Formularios, diálogos. Coincide con el mínimo tocable.", className: "h-control" },
  { token: "--size-control-height-large · h-control-large", title: "Alto grande · 52", uses: "Landing, acción principal de una pantalla.", className: "h-control-large" },
  { token: "--size-hit · size-hit", title: "Mínimo tocable · 44", uses: "Todo lo que se toca, aunque el dibujo sea más chico.", className: "h-hit" },
] as const

const icons = [
  { token: "--size-icon-xs · size-icon-xs", title: "Ícono 12", uses: "Dentro de badges y chips.", className: "size-icon-xs" },
  { token: "--size-icon-sm · size-icon-sm", title: "Ícono 16", uses: "El cuerpo del sistema: ícono con texto.", className: "size-icon-sm" },
  { token: "--size-icon-md · size-icon-md", title: "Ícono 20", uses: "Botón grande, navegación.", className: "size-icon-md" },
  { token: "--size-icon-lg · size-icon-lg", title: "Ícono 24", uses: "Ícono solo, estado vacío.", className: "size-icon-lg" },
] as const

const avatars = [
  { token: "--size-avatar-sm · size-avatar-sm", title: "Avatar 32", uses: "Listas, filas de tabla.", className: "size-avatar-sm" },
  { token: "--size-avatar-md · size-avatar-md", title: "Avatar 40", uses: "Header, tarjetas de miembro.", className: "size-avatar-md" },
  { token: "--size-avatar-lg · size-avatar-lg", title: "Avatar 48", uses: "Ficha de persona.", className: "size-avatar-lg" },
] as const

const rules = [
  {
    title: "Tres alturas de control",
    body: "Hoy hay controles de 32, 35, 36, 40, 41, 42, 44, 45 y 46 px. Se unifican en 36, 44 y 52.",
  },
  {
    title: "El blanco no se achica",
    body: "Un botón de ícono puede dibujar 16 px, pero lo tocable mide 44.",
  },
] as const

function SizeRoles() {
  return (
    <FoundationDoc title="Size" lede="Alturas de control, íconos y avatares. Se piden por nombre: h-control, size-icon-sm.">
      <DocSection title="Controles">
        <TokenTable
          rows={controls.map((row) => ({
            ...row,
            sample: <span className={`block w-32 rounded-control border border-line-strong bg-canvas-sunken ${row.className}`} />,
          }))}
        />
      </DocSection>
      <DocSection title="Íconos">
        <TokenTable
          rows={icons.map((row) => ({ ...row, sample: <span className={`block rounded-compact bg-ink ${row.className}`} /> }))}
        />
      </DocSection>
      <DocSection title="Avatares">
        <TokenTable
          rows={avatars.map((row) => ({ ...row, sample: <span className={`block rounded-pill bg-action-soft ring-1 ring-line ${row.className}`} /> }))}
        />
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Foundations/Size" } satisfies Meta

export default meta

export const Roles: StoryObj = { render: () => <SizeRoles /> }
