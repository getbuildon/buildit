import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc, TokenTable } from "../docs/FoundationDoc"

const widths = [
  { token: "--layout-page · max-w-page", title: "Página · 1280", uses: "Ancho máximo de una pantalla.", w: "max-w-page" },
  { token: "--layout-reading · max-w-reading", title: "Lectura · 720", uses: "Texto largo, formulario de una columna.", w: "max-w-reading" },
  { token: "--layout-dialog-wide · max-w-dialog-wide", title: "Diálogo ancho · 560", uses: "Diálogo con formulario.", w: "max-w-dialog-wide" },
  { token: "--layout-dialog · max-w-dialog", title: "Diálogo · 480", uses: "Diálogo por defecto.", w: "max-w-dialog" },
  { token: "--layout-dialog-narrow · max-w-dialog-narrow", title: "Diálogo angosto · 448", uses: "Confirmar una acción.", w: "max-w-dialog-narrow" },
] as const

const breakpoints = [
  { token: "sm:", title: "sm · 640", uses: "Teléfono horizontal y tablets chicas. Márgenes de 16 a 24." },
  { token: "md:", title: "md · 768", uses: "Tablet." },
  { token: "lg:", title: "lg · 1024", uses: "Laptop. Márgenes de 32." },
  { token: "xl:", title: "xl · 1280", uses: "Escritorio: la página llega a su ancho máximo." },
  { token: "2xl:", title: "2xl · 1536", uses: "Pantallas grandes." },
] as const

const rules = [
  { title: "El margen crece solo", body: "px-(--layout-margin) da 16, 24 o 32 según el ancho. No se repite sm:px-6 lg:px-8 en cada pantalla." },
  { title: "Los breakpoints son los de Tailwind", body: "La app ya los usa en más de 600 lugares; cambiarlos no aporta y rompe." },
] as const

function LayoutRoles() {
  return (
    <FoundationDoc title="Grilla" lede="Anchos con nombre, márgenes que crecen con la pantalla y los cortes de Tailwind.">
      <DocSection title="Anchos">
        <ul className="flex flex-col gap-compact">
          {widths.map((row) => (
            <li key={row.token} className={`flex flex-col gap-related rounded-control border border-line bg-action-soft p-snug ${row.w}`}>
              <span className="text-label">{row.title}</span>
              <span className="text-meta text-ink-muted">{row.uses}</span>
              <code className="font-mono text-meta text-ink-muted">{row.token}</code>
            </li>
          ))}
        </ul>
      </DocSection>
      <DocSection title="Cortes">
        <TokenTable rows={breakpoints} />
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Foundations/Grilla" } satisfies Meta

export default meta

export const Anchos: StoryObj = { render: () => <LayoutRoles /> }
