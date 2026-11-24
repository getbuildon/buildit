import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc } from "../foundations/docs/FoundationDoc"

const layouts = [
  {
    title: "WorkspaceLayout",
    body: "La obra, el backoffice y la empresa. Menú a la izquierda (desde 1024 px), barra con menú en el celular, encabezado, barra de lista, contenido y columna lateral opcional. Ancho de página (1280) o de lectura (720, configuración).",
  },
  {
    title: "HomeLayout",
    body: "Sin menú lateral: el inicio con las obras, la empresa, el portal de clientes. Barra arriba y contenido centrado.",
  },
  {
    title: "AuthLayout",
    body: "Ingresar, crear cuenta, recuperar contraseña, aceptar invitación. Dos mitades desde 1024 px (misma proporción que hoy); en el celular, solo el formulario.",
  },
  {
    title: "WizardLayout",
    body: "Un proceso en pasos a pantalla completa: crear una obra. Pasos al costado, paso actual al centro, botones fijos abajo.",
  },
] as const

const rules = [
  { title: "Solo ubican", body: "Una estructura tiene lugares (menú, encabezado, contenido), no componentes. La pantalla pone cada organismo en su lugar. Misma regla que Rootsy." },
  { title: "Saltar al contenido", body: "Todas traen el link «Saltar al contenido» como primer elemento: con Tab se llega al contenido sin recorrer el menú. Hoy la app no lo tiene en ninguna pantalla." },
  { title: "Un solo <main>", body: "Con id, para el salto y para que el lector de pantalla encuentre el contenido principal." },
  { title: "El scroll es del contenido", body: "En la estructura de trabajo, el menú queda fijo y scrollea solo el contenido, como hoy." },
] as const

const findings = [
  { title: "Sin «Saltar al contenido»", body: "Con teclado o lector de pantalla hay que pasar por todo el menú en cada pantalla (WCAG 2.4.1)." },
  { title: "Cada sección arma su estructura", body: "La obra, la empresa y el backoffice tienen cada una su shell, su skeleton y sus márgenes (px-4, px-6, px-12)." },
  { title: "Márgenes que no coinciden", body: "El contenido arranca en 16, 24 o 48 px según la sección. Las estructuras usan el mismo margen que crece con la pantalla (16, 24, 32)." },
] as const

function EstructurasDoc() {
  return (
    <FoundationDoc
      kicker="Estructuras"
      title="Estructuras de página"
      lede="Las cuatro formas de pantalla de BuildOn. Mirá cada una armada en «Pantallas», en claro y en oscuro, y achicá la ventana para verlas en el celular."
    >
      <DocSection title="Las cuatro">
        <DocRules rules={layouts} />
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={rules} />
      </DocSection>
      <DocSection title="Lo que hay hoy en la app">
        <DocRules rules={findings} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Estructuras/Guía" } satisfies Meta

export default meta

export const Guia: StoryObj = { name: "Las cuatro", render: () => <EstructurasDoc /> }
