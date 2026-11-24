import { useMemo, type ReactNode } from "react"

/* Piezas para documentar foundations en Storybook. No se exportan a la app. */

export function FoundationDoc({
  kicker = "Foundations",
  title,
  lede,
  children,
}: {
  kicker?: string
  title: string
  lede: string
  children: ReactNode
}) {
  return (
    <article className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto flex max-w-page flex-col gap-chapter px-(--layout-margin) py-chapter">
        <header className="flex flex-col gap-snug">
          <p className="text-label text-action-text">{kicker}</p>
          <h1 className="text-display animate-enter">{title}</h1>
          <p className="text-reading text-ink-muted">{lede}</p>
        </header>
        {children}
      </div>
    </article>
  )
}

export function DocSection({ title, lede, children }: { title: string; lede?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-group">
      <div className="flex flex-col gap-related">
        <h2 className="text-heading">{title}</h2>
        {lede ? <p className="text-body text-ink-muted">{lede}</p> : null}
      </div>
      {children}
    </section>
  )
}

export type Rule = { title: string; body: string }

export function DocRules({ rules }: { rules: readonly Rule[] }) {
  return (
    <ol className="grid gap-group sm:grid-cols-2">
      {rules.map((rule) => (
        <li key={rule.title} className="flex flex-col gap-compact rounded-surface border border-line bg-canvas-raised p-group">
          <h3 className="text-section">{rule.title}</h3>
          <p className="text-body text-ink-muted">{rule.body}</p>
        </li>
      ))}
    </ol>
  )
}

export type TokenRow = {
  token: string
  title: string
  uses: string
  sample?: ReactNode
}

/** Tabla de roles: muestra, nombre, para qué sirve y el token que se pide. */
export function TokenTable({ rows, sampleWidth = "w-40" }: { rows: readonly TokenRow[]; sampleWidth?: string }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-surface border border-line bg-canvas-raised">
      {rows.map((row) => (
        <li key={row.token} className="flex flex-col gap-snug p-group sm:flex-row sm:items-center sm:gap-block">
          {row.sample !== undefined ? (
            <div className={`flex shrink-0 items-center ${sampleWidth}`}>{row.sample}</div>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-related">
            <p className="text-label">{row.title}</p>
            <p className="text-meta text-ink-muted">{row.uses}</p>
          </div>
          <TokenName token={row.token} />
        </li>
      ))}
    </ul>
  )
}

export function TokenName({ token }: { token: string }) {
  return (
    <code className="shrink-0 rounded-compact bg-canvas-sunken px-compact py-related font-mono text-meta text-ink-muted">
      {token}
    </code>
  )
}

/** Lee el valor resuelto de una variable CSS (sirve para mostrar el hex real). */
export function useCssVar(name: string): string {
  // Storybook renderiza solo en el navegador: se puede leer el DOM al renderizar.
  return useMemo(
    () => (typeof document === "undefined" ? "" : getComputedStyle(document.documentElement).getPropertyValue(name).trim()),
    [name],
  )
}

function toHex(n: number) {
  return Math.round(Math.min(1, Math.max(0, n)) * 255)
    .toString(16)
    .padStart(2, "0")
}

/**
 * Color final de un rol, ya resuelto (light-dark, color-mix) en el modo pedido.
 * Si es translúcido (los fondos suaves en oscuro), se compone sobre canvas-raised:
 * es el color que se ve sobre una card. Devuelve hex.
 * Mide con un elemento de prueba porque los roles son pares light-dark().
 */
export function resolveColor(token: string, theme?: "claro" | "oscuro"): string | null {
  if (typeof document === "undefined") return null
  const read = (cssColor: string) => {
    const probe = document.createElement("span")
    if (theme) probe.dataset.theme = theme
    probe.style.color = cssColor
    document.body.appendChild(probe)
    const value = getComputedStyle(probe).color
    probe.remove()
    return parseColor(value)
  }
  const color = read(`var(${token})`)
  if (!color) return null
  if (color.alpha < 1) {
    const base = read("var(--color-canvas-raised)")
    if (!base) return null
    const mix = color.rgb.map((c, i) => c * color.alpha + base.rgb[i] * (1 - color.alpha))
    return `#${mix.map(toHex).join("")}`
  }
  return `#${color.rgb.map(toHex).join("")}`
}

/** rgb()/rgba() o color(srgb …) a canales 0–1 y alfa. */
function parseColor(value: string): { rgb: number[]; alpha: number } | null {
  const rgb = value.match(/^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/)
  if (rgb) return { rgb: [rgb[1], rgb[2], rgb[3]].map((c) => Number(c) / 255), alpha: rgb[4] === undefined ? 1 : Number(rgb[4]) }
  const srgb = value.match(/^color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.]+))?\)$/)
  if (srgb) return { rgb: [srgb[1], srgb[2], srgb[3]].map(Number), alpha: srgb[4] === undefined ? 1 : Number(srgb[4]) }
  return null
}

export function useResolvedColor(token: string, theme?: "claro" | "oscuro"): string | null {
  return useMemo(() => resolveColor(token, theme), [token, theme])
}

function channel(c: number) {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string) {
  const h = hex.replace("#", "")
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(h.slice(i, i + 2), 16)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Contraste WCAG entre dos hex de 6 dígitos. null si alguno no es hex. */
export function contrast(a: string | null, b: string | null): number | null {
  if (!a || !b || !/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return null
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

export function ContrastBadge({ ratio }: { ratio: number | null }) {
  if (ratio == null) return null
  const level = ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA grande" : "No pasa"
  const tone =
    ratio >= 4.5
      ? "bg-fn-ok-canvas text-fn-ok"
      : ratio >= 3
        ? "bg-fn-caution-canvas text-fn-caution"
        : "bg-fn-danger-canvas text-fn-danger"
  return (
    <span className={`rounded-pill px-compact py-related text-micro ${tone}`}>
      {ratio.toFixed(1)}:1 · {level}
    </span>
  )
}

/** Fila de ejemplos con su nombre: variantes, tamaños, estados. */
export function DocExamples({ items }: { items: readonly { name: string; note?: string; node: ReactNode }[] }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-surface border border-line bg-canvas-raised">
      {items.map((item) => (
        <li key={item.name} className="flex flex-col gap-snug p-group sm:flex-row sm:items-center sm:gap-block">
          <div className="flex shrink-0 flex-col gap-related sm:w-56">
            <p className="text-label">{item.name}</p>
            {item.note ? <p className="text-meta text-ink-muted">{item.note}</p> : null}
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-snug">{item.node}</div>
        </li>
      ))}
    </ul>
  )
}
