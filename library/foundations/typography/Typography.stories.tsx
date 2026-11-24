import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc, TokenName } from "../docs/FoundationDoc"

const voices = [
  {
    name: "Recoleta",
    className: "font-display",
    token: "--font-display",
    lede: "Titula. Le da a BuildOn su voz cálida. Solo en títulos, aperturas y el dato que decide.",
  },
  {
    name: "Google Sans Flex",
    className: "font-ui",
    token: "--font-ui",
    lede: "Opera. Todo lo que se lee y se toca: tablas, formularios, botones, ayudas.",
  },
] as const

const roles = [
  { id: "display", sample: "Seguí tus obras en un solo lugar", spec: "Recoleta · 48 / 50", uses: "Landing, bienvenida. Una por pantalla." },
  { id: "title", sample: "Torre Alamo · Unidades", spec: "Recoleta · 28 / 29", uses: "Título de pantalla." },
  { id: "heading", sample: "Avance por rubro", spec: "Recoleta · 24 / 29", uses: "Título de bloque o de diálogo." },
  { id: "metric", sample: "45,5%", spec: "Recoleta · 36 / 38 · cifras tabulares", uses: "El dato que decide: avance, totales." },
  { id: "section", sample: "Tareas pendientes", spec: "Google Sans · 18 / 25 · 500", uses: "Título de sección dentro de una card o panel." },
  { id: "reading", sample: "Cargá el avance de cada tarea y el equipo lo certifica desde la obra.", spec: "Google Sans · 16 / 24 · medida 65ch", uses: "Textos largos, landing." },
  { id: "body", sample: "Colocación de cerámicos en baño principal", spec: "Google Sans · 14 / 20", uses: "Cuerpo de operación: tablas, formularios, listas." },
  { id: "label", sample: "Fecha de inicio", spec: "Google Sans · 14 / 20 · 500", uses: "Nombre de campo, botón, dato destacado en fila." },
  { id: "meta", sample: "Cargado por Juan · 30 jul 2026 · 16:33 h", spec: "Google Sans · 12 / 17", uses: "Fechas, ayudas, meta de fila." },
  { id: "micro", sample: "NUEVO", spec: "Google Sans · 10 / 14 · 500", uses: "Badges y contadores. Nunca un párrafo." },
] as const

const rules = [
  {
    title: "Se pide el rol",
    body: "text-body, text-title. Los tamaños sueltos de Tailwind (text-sm, text-[14px]) no existen en el tema.",
  },
  {
    title: "Recoleta no opera",
    body: "Nunca en botones, campos ni tablas. Ahí siempre Google Sans Flex.",
  },
  {
    title: "Un display por pantalla",
    body: "La apertura es rara. Si hay dos, uno es un title.",
  },
  {
    title: "Números que se comparan, tabulares",
    body: "text-metric ya las trae. En tablas con montos o porcentajes, sumar tabular-nums.",
  },
] as const

function Voices() {
  return (
    <FoundationDoc title="Tipografía · Voces" lede="Dos voces, cada una con su trabajo.">
      <ul className="grid gap-group sm:grid-cols-2">
        {voices.map((voice) => (
          <li key={voice.name} className="flex flex-col gap-snug rounded-surface border border-line bg-canvas-raised p-block">
            {/* Muestra de la voz a tamaño grande: es documentación, no un rol. */}
            <p className={voice.className} style={{ fontSize: "2.5rem", lineHeight: 1.1 }}>
              Aa Ññ 0123
            </p>
            <p className="text-section">{voice.name}</p>
            <p className="text-body text-ink-muted">{voice.lede}</p>
            <TokenName token={voice.token} />
          </li>
        ))}
      </ul>
    </FoundationDoc>
  )
}

function Roles() {
  return (
    <FoundationDoc
      title="Tipografía · Roles"
      lede="Cada rol trae voz, tamaño, interlineado, peso y tracking juntos. Tamaño / interlineado en px: salen de lo que la app más usa hoy (14, 12, 24, 28 y 48), con el interlineado redondeado a un píxel entero."
    >
      <ul className="divide-y divide-line overflow-hidden rounded-surface border border-line bg-canvas-raised">
        {roles.map((role) => (
          <li key={role.id} className="flex flex-col gap-snug p-group lg:flex-row lg:items-baseline lg:gap-block">
            <p className={`text-${role.id} min-w-0 flex-1`}>{role.sample}</p>
            <div className="flex shrink-0 flex-col gap-related lg:w-80">
              <p className="text-label">{role.spec}</p>
              <p className="text-meta text-ink-muted">{role.uses}</p>
              <TokenName token={`text-${role.id}`} />
            </div>
          </li>
        ))}
      </ul>
    </FoundationDoc>
  )
}

function Rules() {
  return (
    <FoundationDoc title="Tipografía · Reglas" lede="Lo que no se negocia.">
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

// Tailwind detecta las clases por texto. Las recetas armadas con `text-${id}` se listan acá
// para que se generen: text-display text-title text-heading text-metric text-section
// text-reading text-body text-label text-meta text-micro

const meta = { title: "Foundations/Tipografía" } satisfies Meta

export default meta

export const Voces: StoryObj = { render: () => <Voices /> }
export const RolesDeTexto: StoryObj = { name: "Roles", render: () => <Roles /> }
export const Reglas: StoryObj = { render: () => <Rules /> }
