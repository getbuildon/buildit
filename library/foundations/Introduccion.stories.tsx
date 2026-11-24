import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc } from "./docs/FoundationDoc"

const catalog = [
  { id: "Color", lede: "Roles en pares claro/oscuro: superficie, tinta, línea, acción, estados, funcionales y tonos para categorías." },
  { id: "Tipografía", lede: "Recoleta titula, Google Sans Flex opera. Se pide el rol, no un px." },
  { id: "Spacing", lede: "Oficios del aire: related, compact, snug, group, block, chapter, stage." },
  { id: "Size", lede: "Alturas de control, íconos, avatares y el mínimo tocable." },
  { id: "Radio", lede: "Compacto, control, superficie y píldora." },
  { id: "Stroke", lede: "Línea fina para bordes, fuerte para selección, trazo de ícono." },
  { id: "Elevación", lede: "Plano por defecto. Halo, cerca, overlay y modal." },
  { id: "Focus", lede: "Anillo naranja solo con teclado." },
  { id: "Motion", lede: "Tres tiempos y dos curvas. Reduced-motion apaga." },
  { id: "Stacking", lede: "Un solo origen de z-index." },
  { id: "Grilla", lede: "Anchos de página, lectura y diálogo; márgenes que crecen." },
  { id: "Iconografía", lede: "Lucide, cuatro tamaños, trazo 1.75." },
  { id: "Formato", lede: "Plata, números, m² y fechas en es-AR y hora de Buenos Aires." },
] as const

const rules = [
  {
    title: "Se pide el oficio",
    body: "Un componente pide bg-action, p-group o rounded-control. Nunca un hex, un px suelto ni un paso de rampa.",
  },
  {
    title: "Solo existen los roles",
    body: "El tema borra la paleta y las escalas por defecto de Tailwind: bg-slate-500, text-sm o rounded-lg no compilan a nada.",
  },
  {
    title: "Nace del relevamiento",
    body: "Cada valor sale de lo que BuildOn ya usa (2026-11-18). Lo que estaba repetido con variaciones se unificó en un rol.",
  },
  {
    title: "Claro y oscuro desde el día uno",
    body: "Cada color es un par. El modo lo decide data-theme (claro, oscuro o sistema) en la página o en un contenedor. Los componentes no cambian.",
  },
  {
    title: "Accesible y pixel perfect",
    body: "Todo texto pasa WCAG AA (4.5:1) en los dos modos. Medidas e interlineados caen en píxeles enteros y crecen si la persona agranda la letra.",
  },
  {
    title: "No toca la app todavía",
    body: "La app no importa estas foundations. Se adoptan pantalla por pantalla cuando se decida.",
  },
] as const

function Introduccion() {
  return (
    <FoundationDoc
      kicker="BuildOn · Librería"
      title="Foundations"
      lede="Las reglas visuales de base. Todo lo que se construya arriba (átomos, moléculas, pantallas) pide estos roles. Alineadas al criterio de la librería de Rootsy, con el stack de BuildOn: Tailwind y Radix."
    >
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
      <DocSection title="Catálogo">
        <ul className="grid gap-group sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((item) => (
            <li key={item.id} className="flex flex-col gap-related rounded-surface border border-line bg-canvas-raised p-group">
              <p className="text-section">{item.id}</p>
              <p className="text-body text-ink-muted">{item.lede}</p>
            </li>
          ))}
        </ul>
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Foundations/Introducción" } satisfies Meta

export default meta

export const Resumen: StoryObj = { render: () => <Introduccion /> }
