import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc, TokenTable } from "../docs/FoundationDoc"

const roles = [
  { id: "related", px: 4, title: "Relacionado", uses: "Lo que es una sola cosa: ícono y texto, label y valor." },
  { id: "compact", px: 8, title: "Compacto", uses: "Celdas, chips, filas densas." },
  { id: "snug", px: 12, title: "Ajustado", uses: "Inset de campo, gap entre botones." },
  { id: "group", px: 16, title: "Grupo", uses: "Cuerpo de una card, stack de formulario." },
  { id: "block", px: 24, title: "Bloque", uses: "Entre cards y módulos." },
  { id: "chapter", px: 40, title: "Capítulo", uses: "Entre secciones de una pantalla." },
  { id: "stage", px: 64, title: "Escena", uses: "Aire de la vista: landing, estado vacío." },
] as const

const rules = [
  {
    title: "Se pide el oficio",
    body: "p-group, gap-compact, space-y-block. No p-4 ni p-[17px]: la app hoy tiene más de 100 espaciados sueltos en px.",
  },
  {
    title: "La escala numérica es para medidas",
    body: "w-10, min-h-20 siguen para anchos y altos de layout. El aire entre y dentro de piezas se pide por oficio.",
  },
  {
    title: "Dentro y entre",
    body: "Inset (padding) es el aire adentro de un cuerpo. Stack y gap son el aire entre hermanos. El mismo oficio sirve para los tres.",
  },
] as const

function SpacingRoles() {
  return (
    <FoundationDoc
      title="Spacing"
      lede="Siete oficios sobre una escala de 4. Salen de lo que la app más usa hoy: 4, 8, 12, 16 y 24."
    >
      <TokenTable
        rows={roles.map((role) => ({
          token: `--space-${role.id} · p-${role.id}`,
          title: `${role.title} · ${role.px}px`,
          uses: role.uses,
          sample: <span className="block h-icon-sm rounded-compact bg-action" style={{ width: `var(--space-${role.id})` }} />,
        }))}
      />
      <DocSection title="En contexto" lede="Card de tarea: inset group, stack compact, ícono y texto related.">
        <div className="flex max-w-dialog flex-col gap-compact rounded-surface border border-line bg-canvas-raised p-group">
          <p className="text-section">Colocación de cerámicos</p>
          <p className="flex items-center gap-related text-meta text-ink-muted">
            <span className="size-icon-xs rounded-pill bg-fn-caution" /> Pendiente de revisión
          </p>
          <div className="mt-related flex gap-snug">
            <span className="rounded-control bg-action px-group py-compact text-label text-action-ink">Certificar</span>
            <span className="rounded-control border border-line px-group py-compact text-label">Ver detalle</span>
          </div>
        </div>
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Foundations/Spacing" } satisfies Meta

export default meta

export const Oficios: StoryObj = { render: () => <SpacingRoles /> }
