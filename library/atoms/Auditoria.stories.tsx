import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc } from "../foundations/docs/FoundationDoc"

/* Relevamiento de la app del 2026-11-18 (app/ y components/). */

const good = [
  { title: "Los botones de solo ícono tienen nombre", body: "Los 28 llevan aria-label. El lector de pantalla los puede anunciar." },
  { title: "Casi todos los botones tienen type", body: "211 de 215. Pocos riesgos de enviar un formulario sin querer." },
  { title: "Buena base técnica", body: "Radix para diálogos, popovers y selects; variantes con cva; imágenes con next/image. La librería sigue el mismo camino." },
  { title: "Las casillas a mano son accesibles", body: "Usan role=\"checkbox\" y aria-checked. El problema es que hay tres distintas, no que estén mal hechas." },
] as const

const findings = [
  {
    title: "El botón del sistema casi no se usa",
    today: "54 botones usan el componente y 215 están armados a mano, con 6 alturas y 4 radios distintos. El componente trae variantes que nadie usa y la que sí se usa tiene los colores escritos a mano.",
    fix: "Button e IconButton con las variantes y tamaños reales (36, 44, 52) y nada escrito a mano.",
  },
  {
    title: "El foco con teclado se borra",
    today: "44 lugares sacan el anillo de foco (ring-0) y 56 el contorno (outline-none). Navegando con Tab no se ve dónde se está. El botón principal también lo saca.",
    fix: "Todos los átomos traen focus-ring. Se ve con teclado y no con el mouse.",
  },
  {
    title: "Texto blanco sobre naranja",
    today: "El botón principal tiene 2,7:1 de contraste. WCAG pide 4,5:1.",
    fix: "Mismo naranja, tinta marrón oscura: 6:1. Se mantiene el brillo naranja del diseño.",
  },
  {
    title: "Tres casillas distintas",
    today: "Certificaciones usa una negra con esquina de 2 px; Clientes y Crear obra, naranjas de 4 px. Cada una armada a mano.",
    fix: "Un Checkbox (Radix) con su estado «algunas» para seleccionar todo, tocable de 24 px.",
  },
  {
    title: "Cuatro tooltips y 28 del navegador",
    today: "HoverTooltip, InfoTooltip, FieldErrorTooltip y RolePermissionTooltip, más 28 title= que no se ven con teclado ni en el celular.",
    fix: "Un Tooltip (Radix) que abre con mouse y con foco y se cierra con Escape.",
  },
  {
    title: "Campos sin etiqueta",
    today: "Cerca de 30 de 110 campos no tienen un label asociado. El lector de pantalla dice «campo de texto» sin decir cuál.",
    fix: "Label con htmlFor y regla en Input: siempre con Label. El placeholder es un ejemplo, no el nombre.",
  },
  {
    title: "El diseño repetido por pantalla",
    today: "11 archivos de «design tokens» por sección (home, login, backoffice, certificaciones, dashboard…), casi 900 líneas con colores y medidas propias.",
    fix: "Las foundations son el único lugar. Al adoptar la librería, esos archivos se borran.",
  },
  {
    title: "Detalles",
    today: "El spinner anuncia «Loading» en inglés. El skeleton pide elegir tono claro u oscuro a mano. Hay avatares de 31, 32, 40 y 64 px.",
    fix: "Spinner en español, Skeleton que toma el modo solo, Avatar de 32, 40 y 48 con iniciales y tono por nombre.",
  },
] as const

const table = [
  ["Button", "Componente poco usado + 215 a mano", "Button: action, outline, ghost, danger, danger-quiet · 36/44/52 · cargando"],
  ["IconButton", "A mano, con nombre", "Nombre obligatorio por tipo, tooltip y tocable de 44"],
  ["Input / Textarea", "Componente + 31 a mano, foco sin anillo", "Mismo aspecto, foco visible, error accesible"],
  ["Label", "Componente + 38 a mano", "Asociado al campo, obligatorio u opcional"],
  ["Checkbox", "3 versiones a mano", "Uno (Radix), con «algunas»"],
  ["Radio", "No hay", "RadioGroup (Radix), con flechas"],
  ["Switch", "No hay", "Switch (Radix)"],
  ["Badge", "Pastillas de estado a mano", "6 tonos, siempre con palabra"],
  ["Tag", "No hay", "8 tonos para rubros y categorías"],
  ["Avatar", "UserAvatar, 4 tamaños", "3 tamaños, iniciales, tono por nombre"],
  ["Progress", "Barras a mano", "Con nombre y % en español, franja mínima"],
  ["Spinner / Skeleton", "Spinner en inglés, skeleton con tono a mano", "En español y con el modo solo"],
  ["Tooltip", "4 variantes + 28 title=", "Uno (Radix)"],
  ["Link, Separator, Icon, VisuallyHidden", "A mano", "Átomos chicos con las reglas del sistema"],
] as const

function Auditoria() {
  return (
    <FoundationDoc
      kicker="Átomos"
      title="Auditoría"
      lede="Qué átomos tiene hoy la app, qué está bien, qué está mal y cómo lo resuelve la librería. Relevamiento del 18 de noviembre de 2026."
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
      <DocSection title="Átomo por átomo">
        <div className="overflow-x-auto rounded-surface border border-line bg-canvas-raised">
          <table className="w-full text-left text-body">
            <thead className="text-label text-ink-muted">
              <tr className="border-b border-line">
                <th className="p-snug">Átomo</th>
                <th className="p-snug">Hoy en la app</th>
                <th className="p-snug">En la librería</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {table.map(([atom, today, lib]) => (
                <tr key={atom}>
                  <td className="p-snug text-label">{atom}</td>
                  <td className="p-snug text-ink-muted">{today}</td>
                  <td className="p-snug">{lib}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>
    </FoundationDoc>
  )
}

const meta = { title: "Átomos/Auditoría" } satisfies Meta

export default meta

export const Resumen: StoryObj = { render: () => <Auditoria /> }
