import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc } from "../foundations/docs/FoundationDoc"

/* Relevamiento de la app del 2026-11-18 (app/ y components/). */

const good = [
  { title: "Navegación con aria-current", body: "El menú de la obra marca la sección actual para el lector de pantalla." },
  { title: "Esqueletos de carga por pantalla", body: "Obra, empresa, backoffice e inicio tienen su versión de carga: la pantalla no salta al llegar los datos." },
  { title: "Proceso de creación por pasos", body: "Crear una obra ya está dividido en pasos claros (datos, estructura, rubros, estado, equipo)." },
] as const

const findings = [
  {
    title: "Listas que no son tablas",
    today: "Una sola <table> en toda la app. Unidades, tareas, clientes y obras del backoffice son filas de divs: el lector de pantalla no las puede recorrer por columna, y cada lista ordena y filtra a su manera.",
    fix: "DataTable: tabla de verdad, orden natural en español, selección, acciones por fila, carga y vacío. ListToolbar arriba.",
  },
  {
    title: "Dos menús laterales distintos",
    today: "El de la obra (claro) usa estilos en línea para alto, aire y letra; el del backoffice (oscuro) está armado aparte con #111113.",
    fix: "Sidebar: un componente, dos tonos. El oscuro es el modo oscuro de la librería aplicado al menú.",
  },
  {
    title: "Encabezados con colores sueltos",
    today: "ProjectPageHeader pinta el ícono con un azul escrito a mano (#155dfc) y toma tipos y colores de constantes propias.",
    fix: "PageHeader con volver, estado, acciones y pestañas, todo con roles.",
  },
  {
    title: "La card de obra esconde el avance",
    today: "ProjectCard muestra el porcentaje en un tooltip armado a mano (hover y focus-within) y repite colores de marca.",
    fix: "ProjectCard: avance a la vista con barra, un solo link para toda la card y menú aparte.",
  },
  {
    title: "Configuración sin aviso de cambios",
    today: "Las pantallas de configuración no avisan si hay cambios sin guardar ni dejan descartarlos.",
    fix: "FormSection + FormActions: barra fija con «Tenés cambios sin guardar», Guardar y Descartar.",
  },
] as const

const next = [
  { title: "Gráficos (hecho)", body: "Barras, dona y curva de avance sobre Recharts, con colores que pasan 3:1 y tabla de datos para el lector de pantalla. Hoy el gris de «inactivas» da 2,1:1 y las barras no dicen nada a quien no las ve." },
  { title: "Plano por piso (hecho)", body: "La obra piso por piso con el estado y el avance de cada unidad, cada una con link a su detalle." },
  { title: "Estructuras de página (hecho)", body: "Ver Estructuras: obra, inicio, acceso y crear obra, con pantallas de ejemplo." },
] as const

function Auditoria() {
  return (
    <FoundationDoc
      kicker="Organismos"
      title="Auditoría"
      lede="Qué bloques grandes tiene hoy la app, qué está bien, qué está mal y cómo lo resuelve la librería. Relevamiento del 18 de noviembre de 2026."
    >
      <DocSection title="Lo que está bien">
        <DocRules rules={good} />
      </DocSection>
      <DocSection title="Lo que hay que mejorar">
        <ol className="grid gap-group lg:grid-cols-2">
          {findings.map((item) => (
            <li key={item.title} className="flex flex-col gap-snug rounded-surface border border-line bg-canvas-raised p-group">
              <h3 className="text-section">{item.title}</h3>
              <div className="flex flex-col gap-related">
                <p className="text-micro text-fn-danger">HOY</p>
                <p className="text-body text-ink-muted">{item.today}</p>
              </div>
              <div className="flex flex-col gap-related">
                <p className="text-micro text-fn-ok">EN LA LIBRERÍA</p>
                <p className="text-body">{item.fix}</p>
              </div>
            </li>
          ))}
        </ol>
      </DocSection>
      <DocSection title="Lo que sigue">
        <DocRules rules={next} />
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Organismos/Auditoría" } satisfies Meta

export default meta

export const Resumen: StoryObj = { render: () => <Auditoria /> }
