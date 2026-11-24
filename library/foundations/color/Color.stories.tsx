import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  ContrastBadge,
  DocRules,
  DocSection,
  FoundationDoc,
  TokenTable,
  contrast,
  useCssVar,
  useResolvedColor,
  type TokenRow,
} from "../docs/FoundationDoc"

type Theme = "claro" | "oscuro"

/* ------------------------------------------------------------------ Roles */

type ColorRole = { token: string; title: string; uses: string; on?: string }

const groups: { title: string; lede?: string; roles: ColorRole[] }[] = [
  {
    title: "Superficies",
    lede: "Dónde se apoya todo. En oscuro, lo que está más arriba es más claro.",
    roles: [
      { token: "--color-canvas", title: "Lienzo", uses: "Fondo de pantalla. Papel cálido en claro." },
      { token: "--color-canvas-raised", title: "Elevada", uses: "Card, panel, tabla." },
      { token: "--color-canvas-overlay", title: "Overlay", uses: "Menú, popover, diálogo. En oscuro, un paso más clara que la elevada." },
      { token: "--color-canvas-sunken", title: "Hundida", uses: "Campo deshabilitado, zona de apoyo." },
      { token: "--color-canvas-inverse", title: "Inversa", uses: "Tooltip." },
    ],
  },
  {
    title: "Tinta",
    lede: "Texto e íconos. El contraste se mide sobre el lienzo del modo elegido.",
    roles: [
      { token: "--color-ink", title: "Tinta", uses: "Texto principal.", on: "--color-canvas" },
      { token: "--color-ink-muted", title: "Tinta secundaria", uses: "Ayudas, meta, labels secundarios.", on: "--color-canvas" },
      { token: "--color-ink-subtle", title: "Tinta sutil", uses: "Placeholder e íconos de apoyo. Pasa 4.5:1 igual: un placeholder también se lee.", on: "--color-canvas" },
      { token: "--color-ink-disabled", title: "Tinta deshabilitada", uses: "Texto de control deshabilitado. WCAG no le exige contraste: se ve apagado a propósito." },
      { token: "--color-ink-inverse", title: "Tinta inversa", uses: "Texto sobre la superficie inversa.", on: "--color-canvas-inverse" },
    ],
  },
  {
    title: "Línea",
    roles: [
      { token: "--color-line", title: "Línea", uses: "Borde de card y campo, divisor." },
      { token: "--color-line-strong", title: "Línea fuerte", uses: "Hover de campo, separador que tiene que verse." },
    ],
  },
  {
    title: "Acción",
    lede: "El naranja de marca no cambia. Lleva tinta oscura encima: 6:1 en los dos modos.",
    roles: [
      { token: "--color-action", title: "Acción", uses: "Botón principal, selección, progreso." },
      { token: "--color-action-hover", title: "Acción hover", uses: "Mouse encima." },
      { token: "--color-action-pressed", title: "Acción apretada", uses: "Mientras se aprieta." },
      { token: "--color-action-ink", title: "Tinta sobre acción", uses: "Texto e ícono del botón principal.", on: "--color-action" },
      { token: "--color-action-soft", title: "Acción suave", uses: "Fondo de ítem activo, chip elegido." },
      { token: "--color-action-text", title: "Texto de acción", uses: "Link y texto naranja.", on: "--color-canvas" },
    ],
  },
  {
    title: "Foco y velo",
    roles: [
      { token: "--color-focus-ring", title: "Anillo de foco", uses: "Foco con teclado." },
      { token: "--color-scrim", title: "Velo", uses: "Detrás de un diálogo." },
      { token: "--color-skeleton", title: "Skeleton", uses: "Bloques de carga." },
    ],
  },
]

function Swatch({ token }: { token: string }) {
  return <span className="block h-avatar-md w-full rounded-control border border-line" style={{ background: `var(${token})` }} />
}

function RoleValue({ role }: { role: ColorRole }) {
  const value = useResolvedColor(role.token)
  const base = useResolvedColor(role.on ?? "--color-canvas")
  return (
    <span className="flex flex-wrap items-center gap-related">
      <span className="font-mono text-meta text-ink-muted">{value ?? "translúcido"}</span>
      {role.on ? <ContrastBadge ratio={contrast(value, base)} /> : null}
    </span>
  )
}

function ColorRoles() {
  return (
    <FoundationDoc
      title="Color · Roles"
      lede="Se pide el rol, nunca el hex ni el paso de la rampa: bg-canvas-raised, text-ink-muted, border-line, bg-action. Cambiá el modo arriba (Modo) para verlos en oscuro."
    >
      {groups.map((group) => (
        <DocSection key={group.title} title={group.title} lede={group.lede}>
          <TokenTable
            rows={group.roles.map<TokenRow>((role) => ({
              token: role.token,
              title: role.title,
              uses: role.uses,
              sample: (
                <span className="flex w-full flex-col gap-compact">
                  <Swatch token={role.token} />
                  <RoleValue role={role} />
                </span>
              ),
            }))}
          />
        </DocSection>
      ))}
    </FoundationDoc>
  )
}

/* ------------------------------------------------------------------ Estados */

const surfaceStates = [
  { token: "--color-surface-hover", title: "Hover", uses: "Fila, ítem de menú, card clickeable con el mouse encima." },
  { token: "--color-surface-pressed", title: "Apretado", uses: "Mientras se aprieta." },
  { token: "--color-surface-selected", title: "Elegido", uses: "Fila o ítem seleccionado, pestaña activa." },
] as const

const stateRules = [
  {
    title: "Un velo, no un color",
    body: "Hover y apretado son un velo de tinta (5% y 9%). Sirven sobre cualquier superficie y en los dos modos, sin definir un hover por cada fondo.",
  },
  {
    title: "Elegido es naranja suave",
    body: "La selección usa el tono de la marca, para que no se confunda con el hover.",
  },
  {
    title: "Deshabilitado no es un color",
    body: "Es opacidad (--state-disabled-opacity) sobre el estado normal: ver Focus.",
  },
] as const

function ColorStates() {
  return (
    <FoundationDoc
      title="Color · Estados"
      lede="Cómo se ve una superficie cuando se la toca: hover, apretada y elegida. Pasá el mouse por la lista."
    >
      <TokenTable
        rows={surfaceStates.map((state) => ({
          ...state,
          sample: (
            <span className="block h-control w-full rounded-control border border-line bg-canvas-raised">
              <span className="block size-full rounded-control" style={{ background: `var(${state.token})` }} />
            </span>
          ),
        }))}
      />
      <DocSection title="En contexto">
        <ul className="max-w-dialog overflow-hidden rounded-surface border border-line bg-canvas-overlay shadow-overlay">
          {["Editar unidad", "Duplicar", "Asignar cliente", "Archivar"].map((item, index) => (
            <li key={item}>
              <button
                type="button"
                className={`focus-ring motion-color flex h-control w-full items-center px-group text-body hover:bg-surface-hover active:bg-surface-pressed ${
                  index === 0 ? "bg-surface-selected text-action-text" : ""
                }`}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={stateRules} />
      </DocSection>
    </FoundationDoc>
  )
}

/* ------------------------------------------------------------------ Funcionales */

const states = [
  { id: "ok", title: "Listo", example: "Tarea certificada", button: "Certificar", uses: "Aprobado, a tiempo, guardado." },
  { id: "caution", title: "Atención", example: "Avance pendiente de revisión", button: "Revisar", uses: "Pendiente, demora, falta algo." },
  { id: "danger", title: "Peligro", example: "Avance rechazado", button: "Borrar", uses: "Error, rechazo, borrar." },
  { id: "info", title: "Información", example: "Hay una nueva versión del plano", button: "Ver", uses: "Novedad, ayuda, dato neutro." },
] as const

function StateContrast({ id }: { id: (typeof states)[number]["id"] }) {
  const ink = useResolvedColor(`--color-fn-${id}`)
  const canvas = useResolvedColor(`--color-fn-${id}-canvas`)
  const solid = useResolvedColor(`--color-fn-${id}-solid`)
  const solidInk = useResolvedColor(`--color-fn-${id}-solid-ink`)
  return (
    <span className="flex flex-wrap gap-related">
      <ContrastBadge ratio={contrast(ink, canvas)} />
      <ContrastBadge ratio={contrast(solidInk, solid)} />
    </span>
  )
}

function ColorFunctional() {
  return (
    <FoundationDoc
      title="Color · Funcionales"
      lede="Cada estado trae texto, fondo y línea (aviso suave) y un sólido con su tinta (botón o badge lleno). Siempre con palabra o ícono: el color solo no alcanza."
    >
      <ul className="grid gap-group sm:grid-cols-2">
        {states.map((state) => (
          <li key={state.id} className="flex flex-col gap-snug rounded-surface border border-line bg-canvas-raised p-group">
            <div
              className="rounded-control border px-snug py-compact text-label"
              style={{
                color: `var(--color-fn-${state.id})`,
                background: `var(--color-fn-${state.id}-canvas)`,
                borderColor: `var(--color-fn-${state.id}-line)`,
              }}
            >
              {state.example}
            </div>
            <span
              className="inline-flex h-control-compact w-fit items-center rounded-control px-group text-label"
              style={{ background: `var(--color-fn-${state.id}-solid)`, color: `var(--color-fn-${state.id}-solid-ink)` }}
            >
              {state.button}
            </span>
            <div className="flex flex-wrap items-center justify-between gap-compact">
              <p className="text-section">{state.title}</p>
              <StateContrast id={state.id} />
            </div>
            <p className="text-body text-ink-muted">{state.uses}</p>
            <code className="font-mono text-meta text-ink-muted">
              --color-fn-{state.id} · -canvas · -line · -solid · -solid-ink
            </code>
          </li>
        ))}
      </ul>
    </FoundationDoc>
  )
}

/* ------------------------------------------------------------------ Tonos */

const tones = [
  { id: "naranja", label: "Naranja" },
  { id: "azul", label: "Azul" },
  { id: "verde", label: "Verde" },
  { id: "amarillo", label: "Amarillo" },
  { id: "rojo", label: "Rojo" },
  { id: "violeta", label: "Violeta" },
  { id: "turquesa", label: "Turquesa" },
  { id: "rosa", label: "Rosa" },
] as const

const chart = [62, 48, 81, 35, 57, 70, 44, 52]

const toneRules = [
  {
    title: "Se guarda el nombre",
    body: "Un rubro guarda «verde», no #17a481. La paleta se puede afinar sin tocar los datos. Mismo criterio que Rootsy, Linear y Square.",
  },
  {
    title: "No son estados",
    body: "Los tonos identifican (este rubro, esta serie). Aprobado, pendiente o rechazado usan los funcionales.",
  },
  {
    title: "Contraste garantizado",
    body: "Tinta sobre fondo ≥ 4.5:1 y sólido contra la superficie ≥ 3:1, en claro y en oscuro.",
  },
  {
    title: "Orden fijo en gráficos",
    body: "Las series toman los tonos en este orden. Una serie no cambia de color entre gráficos.",
  },
] as const

function ToneChip({ id, label }: (typeof tones)[number]) {
  const ink = useResolvedColor(`--color-tono-${id}-tinta`)
  const bg = useResolvedColor(`--color-tono-${id}-fondo`)
  return (
    <li className="flex flex-col gap-compact">
      <span
        className="inline-flex h-control-compact items-center gap-related rounded-pill px-snug text-label"
        style={{ background: `var(--color-tono-${id}-fondo)`, color: `var(--color-tono-${id}-tinta)` }}
      >
        <span className="size-icon-xs rounded-pill" style={{ background: `var(--color-tono-${id}-solido)` }} />
        {label}
      </span>
      <ContrastBadge ratio={contrast(ink, bg)} />
    </li>
  )
}

function ColorTones() {
  return (
    <FoundationDoc
      title="Color · Tonos"
      lede="Ocho tonos con nombre para categorías y gráficos: rubros, unidades, series del panel. Cada uno trae fondo, tinta y sólido, en claro y en oscuro."
    >
      <DocSection title="Etiquetas">
        <ul className="flex flex-wrap gap-snug">
          {tones.map((tone) => (
            <ToneChip key={tone.id} {...tone} />
          ))}
        </ul>
      </DocSection>
      <DocSection title="Gráfico" lede="El sólido de cada tono, en orden.">
        <div className="flex h-48 items-end gap-compact rounded-surface border border-line bg-canvas-raised p-group">
          {tones.map((tone, index) => (
            <span
              key={tone.id}
              className="flex-1 rounded-t-compact"
              style={{ height: `${chart[index]}%`, background: `var(--color-tono-${tone.id}-solido)` }}
              title={tone.label}
            />
          ))}
        </div>
      </DocSection>
      <DocSection title="Reglas">
        <DocRules rules={toneRules} />
      </DocSection>
    </FoundationDoc>
  )
}

/* ------------------------------------------------------------------ Rampas */

const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
const ramps = [
  { id: "hormigon", title: "Hormigón", lede: "Neutros del modo claro: texto, líneas y superficies." },
  { id: "noche", title: "Hormigón noche", lede: "Neutros del modo oscuro. Igual que en claro, 50 es fondo y 950 es tinta." },
  { id: "ladrillo", title: "Ladrillo", lede: "La marca: acción y foco." },
  { id: "brote", title: "Brote", lede: "Listo, aprobado, a tiempo." },
  { id: "casco", title: "Casco", lede: "Atención, demora, pendiente." },
  { id: "alarma", title: "Alarma", lede: "Error, rechazo, borrar." },
  { id: "plano", title: "Plano", lede: "Informa." },
] as const

function RampStep({ ramp, step }: { ramp: string; step?: number }) {
  const token = step === undefined ? `--buildon-${ramp}` : `--buildon-${ramp}-${step}`
  const value = useCssVar(token)
  // La etiqueta usa negro o blanco, el que tenga más contraste con la muestra.
  const onDark = (contrast(value, "#ffffff") ?? 0) >= (contrast(value, "#000000") ?? 0)
  return (
    <li
      className="flex min-h-20 flex-col justify-end gap-related rounded-control p-compact"
      style={{ background: `var(${token})`, color: onDark ? "var(--buildon-blanco)" : "var(--buildon-negro)" }}
    >
      <span className="text-micro">{step ?? ramp}</span>
      <span className="text-micro">{value}</span>
    </li>
  )
}

function ColorRamps() {
  return (
    <FoundationDoc
      title="Color · Rampas"
      lede="Los valores crudos. Los componentes no los piden: existen para que los roles tengan de dónde salir. Los pasos que BuildOn ya usaba quedaron exactos; los demás se interpolaron."
    >
      {ramps.map((ramp) => (
        <DocSection key={ramp.id} title={ramp.title} lede={ramp.lede}>
          <ol className="grid grid-cols-4 gap-compact sm:grid-cols-6 lg:grid-cols-11">
            {steps.map((step) => (
              <RampStep key={step} ramp={ramp.id} step={step} />
            ))}
          </ol>
        </DocSection>
      ))}
      <DocSection title="Fuera de rampa">
        <ol className="grid grid-cols-2 gap-compact sm:grid-cols-4">
          <RampStep ramp="papel" />
          <RampStep ramp="blanco" />
          <RampStep ramp="negro" />
          <RampStep ramp="noche-profunda" />
        </ol>
      </DocSection>
    </FoundationDoc>
  )
}

/* ------------------------------------------------------------------ Contraste */

const pairs = [
  { fg: "--color-ink", bg: "--color-canvas", uses: "Texto principal" },
  { fg: "--color-ink-muted", bg: "--color-canvas", uses: "Texto secundario" },
  { fg: "--color-ink-muted", bg: "--color-canvas-overlay", uses: "Texto secundario en un menú" },
  { fg: "--color-ink-subtle", bg: "--color-canvas", uses: "Placeholder" },
  { fg: "--color-action-text", bg: "--color-canvas", uses: "Link naranja" },
  { fg: "--color-action-ink", bg: "--color-action", uses: "Botón principal" },
  { fg: "--color-action-ink", bg: "--color-action-pressed", uses: "Botón principal apretado" },
  { fg: "--color-fn-danger", bg: "--color-canvas", uses: "Error sobre lienzo" },
  { fg: "--color-fn-danger-solid-ink", bg: "--color-fn-danger-solid", uses: "Botón Borrar" },
  { fg: "--color-ink-inverse", bg: "--color-canvas-inverse", uses: "Tooltip" },
] as const

function PairCell({ fg, bg, theme }: { fg: string; bg: string; theme: Theme }) {
  const a = useResolvedColor(fg, theme)
  const b = useResolvedColor(bg, theme)
  return (
    <span data-theme={theme} className="flex items-center gap-snug rounded-control bg-canvas p-compact">
      <span
        className="flex h-control-compact w-28 shrink-0 items-center justify-center rounded-control border border-line text-label"
        style={{ color: `var(${fg})`, background: `var(${bg})` }}
      >
        Avance 45%
      </span>
      <ContrastBadge ratio={contrast(a, b)} />
    </span>
  )
}

function ColorContrast() {
  return (
    <FoundationDoc
      title="Color · Contraste"
      lede="WCAG AA pide 4.5:1 para texto y 3:1 para texto grande e íconos. Cada par se mide en claro y en oscuro."
    >
      <ul className="divide-y divide-line overflow-hidden rounded-surface border border-line bg-canvas-raised">
        {pairs.map((pair) => (
          <li key={`${pair.fg}-${pair.bg}`} className="flex flex-col gap-snug p-group lg:flex-row lg:items-center lg:gap-block">
            <span className="flex flex-1 flex-col gap-related">
              <span className="text-label">{pair.uses}</span>
              <span className="font-mono text-meta text-ink-muted">
                {pair.fg} sobre {pair.bg}
              </span>
            </span>
            <PairCell {...pair} theme="claro" />
            <PairCell {...pair} theme="oscuro" />
          </li>
        ))}
      </ul>
    </FoundationDoc>
  )
}

/* ------------------------------------------------------------------ Cruce */

function SamplePanel({ theme }: { theme: Theme }) {
  return (
    <div data-theme={theme} className="flex flex-1 flex-col gap-group rounded-surface bg-canvas p-block text-ink">
      <p className="text-label text-ink-muted">{theme === "claro" ? "Claro" : "Oscuro"}</p>
      <div className="flex flex-col gap-group rounded-surface border border-line bg-canvas-raised p-group shadow-near">
        <div className="flex items-start justify-between gap-group">
          <div className="flex flex-col gap-related">
            <p className="text-heading">Torre Alamo</p>
            <p className="text-meta text-ink-muted">48 unidades · Av. Siempreviva 742</p>
          </div>
          <span className="rounded-pill bg-fn-ok-canvas px-compact py-related text-micro text-fn-ok">A tiempo</span>
        </div>
        <div className="flex items-end justify-between gap-group">
          <p className="text-metric">45,5%</p>
          <p className="text-meta text-ink-muted">avance de obra</p>
        </div>
        <div className="h-compact overflow-hidden rounded-pill bg-canvas-sunken">
          <div className="h-full w-[45.5%] rounded-pill bg-action" />
        </div>
        <div className="flex flex-wrap gap-related">
          <span className="rounded-pill bg-tono-azul-fondo px-compact py-related text-micro text-tono-azul-tinta">Albañilería</span>
          <span className="rounded-pill bg-tono-violeta-fondo px-compact py-related text-micro text-tono-violeta-tinta">Eléctrica</span>
          <span className="rounded-pill bg-tono-turquesa-fondo px-compact py-related text-micro text-tono-turquesa-tinta">Sanitaria</span>
        </div>
        <div className="rounded-control border border-fn-caution-line bg-fn-caution-canvas px-snug py-compact text-label text-fn-caution">
          3 avances pendientes de revisión
        </div>
        <div className="flex flex-wrap gap-snug">
          <button type="button" className="focus-ring motion-press motion-color h-control rounded-control bg-action px-group text-label text-action-ink hover:bg-action-hover active:bg-action-pressed">
            Certificar
          </button>
          <button type="button" className="focus-ring motion-color h-control rounded-control border border-line bg-canvas-raised px-group text-label hover:bg-surface-hover">
            Ver detalle
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-related rounded-surface border border-line bg-canvas-overlay p-snug shadow-overlay">
        <p className="text-label">Menú</p>
        <p className="rounded-control bg-surface-selected px-compact py-related text-body text-action-text">Editar obra</p>
        <p className="rounded-control px-compact py-related text-body">Duplicar</p>
        <p className="rounded-control px-compact py-related text-body text-fn-danger">Archivar</p>
      </div>
    </div>
  )
}

function ColorCruce() {
  return (
    <FoundationDoc
      title="Color · Cruce"
      lede="La misma pantalla en los dos modos, una al lado de la otra. Los componentes no cambian: solo cambia data-theme en el contenedor."
    >
      <div className="flex flex-col gap-group lg:flex-row">
        <SamplePanel theme="claro" />
        <SamplePanel theme="oscuro" />
      </div>
    </FoundationDoc>
  )
}

const meta = { title: "Foundations/Color" } satisfies Meta

export default meta

export const Roles: StoryObj = { render: () => <ColorRoles /> }
export const Estados: StoryObj = { render: () => <ColorStates /> }
export const Funcionales: StoryObj = { render: () => <ColorFunctional /> }
export const Tonos: StoryObj = { render: () => <ColorTones /> }
export const Rampas: StoryObj = { render: () => <ColorRamps /> }
export const Contraste: StoryObj = { render: () => <ColorContrast /> }
export const Cruce: StoryObj = { render: () => <ColorCruce /> }
