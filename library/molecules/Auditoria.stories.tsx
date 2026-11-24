import type { Meta, StoryObj } from "@storybook/react-vite"
import { DocRules, DocSection, FoundationDoc } from "../foundations/docs/FoundationDoc"

/* Relevamiento de la app del 2026-11-18 (app/ y components/). */

const good = [
  { title: "Diálogos y selects sobre Radix", body: "Dialog (19 usos), AlertDialog, Select y Popover ya usan Radix: el foco y el teclado vienen bien de base." },
  { title: "Los avisos se anuncian", body: "El toast actual tiene aria-live y role=\"status\": el lector de pantalla los lee." },
  { title: "Fechas en español", body: "El calendario y el date picker usan el idioma español." },
] as const

const findings = [
  {
    title: "Los errores de los campos se esconden",
    today: "8 campos muestran el error solo al pasar el mouse por un ícono (FieldErrorTooltip). En el celular no se ve y el lector de pantalla no lo asocia al campo.",
    fix: "Field: el error escrito debajo, conectado al campo con aria-describedby y aria-invalid.",
  },
  {
    title: "Diálogos armados a mano",
    today: "11 pantallas arman su propio velo (fixed inset-0) y 4 marcan role=\"dialog\" a mano: el foco puede escaparse y Escape no siempre cierra.",
    fix: "Dialog y ConfirmDialog sobre Radix: foco encerrado, Escape y vuelta del foco al botón que lo abrió.",
  },
  {
    title: "La cruz de cerrar es chica e invisible con teclado",
    today: "Mide 20 px y saca el contorno de foco.",
    fix: "IconButton de 44 tocables y con foco visible.",
  },
  {
    title: "Confirmaciones genéricas",
    today: "ConfirmActionDialog usa el botón naranja para todo (también para borrar) y el foco arranca en la acción.",
    fix: "ConfirmDialog con tono danger, verbo en el botón, foco en Cancelar y espera si la acción es async.",
  },
  {
    title: "Cards y vacíos sin base",
    today: "56 cards a mano (radio 14 o 16, sombras distintas) y unos 64 mensajes de «No hay…» escritos cada uno a su manera.",
    fix: "Card con encabezado, cuerpo y pie; EmptyState que dice qué falta y cómo resolverlo.",
  },
  {
    title: "Pestañas y segmentados a mano",
    today: "Una sola lista de pestañas con role=\"tablist\"; los segmentados (estado de hitos y otros) son botones sueltos sin semántica de grupo.",
    fix: "Tabs y Segmented sobre Radix: flechas, selección anunciada, una opción siempre elegida.",
  },
  {
    title: "Selects nativos y desplegables propios",
    today: "6 <select> nativos con estilos propios y un NestedSelect de ~300 líneas.",
    fix: "Select con grupos para listas cortas y Combobox con búsqueda para las largas.",
  },
  {
    title: "Colapsables sin teclado",
    today: "AnimatedCollapsible (9 usos) anima el alto a mano y no informa si está abierto.",
    fix: "Accordion: aria-expanded, teclado y animación que respeta reduced-motion.",
  },
] as const

const second = [
  {
    title: "Fechas solo con el calendario",
    today: "13 selectores de fecha que no dejan escribir (24 clics para ir dos años atrás), con el reacomodo apagado (el calendario puede quedar cortado) y un CSS propio de 143 líneas.",
    fix: "DatePicker: se escribe o se elige, con límites, teclado y sin salirse de la pantalla. DateRangePicker con atajos y Aplicar.",
  },
  {
    title: "Seis formas de subir archivos",
    today: "Fotos de avance, novedades del portal, logos, planos, avatar: cada una con su vista previa, su arrastre y sus validaciones.",
    fix: "FileField: un solo campo con validación en español, vista previa, estado de subida y cámara en el celular. Comprimir y subir queda afuera.",
  },
  {
    title: "Desplegable anidado propio",
    today: "NestedSelect: ~300 líneas para un select con grupos y opción personalizada.",
    fix: "Combobox (búsqueda sin tildes, grupos, descripción) y Select con grupos.",
  },
  {
    title: "Edición en el lugar con colores sueltos",
    today: "InlineEditInput arma bordes y anillos con hex propios y no maneja guardado ni error.",
    fix: "InlineEdit: Enter guarda, Escape cancela, spinner mientras guarda y error escrito si falla.",
  },
] as const

function Auditoria() {
  return (
    <FoundationDoc
      kicker="Moléculas"
      title="Auditoría"
      lede="Qué moléculas tiene hoy la app, qué está bien, qué está mal y cómo lo resuelve la librería. Relevamiento del 18 de noviembre de 2026."
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
      <DocSection title="Segunda tanda">
        <ol className="grid gap-group lg:grid-cols-2">
          {second.map((item) => (
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
    </FoundationDoc>
  )
}

const meta = { title: "Moléculas/Auditoría" } satisfies Meta

export default meta

export const Resumen: StoryObj = { render: () => <Auditoria /> }
