/**
 * «Saltar al contenido»: el primer elemento de toda pantalla. Invisible hasta que llega
 * el foco con Tab; lleva directo al <main> sin recorrer el menú (WCAG 2.4.1).
 * Hoy la app no lo tiene en ninguna pantalla.
 */
export const MAIN_ID = "contenido"

export function SkipLink() {
  return (
    <a
      href={`#${MAIN_ID}`}
      className="sr-only z-(--z-toast) rounded-control bg-canvas-inverse px-group py-compact text-label text-ink-inverse shadow-overlay focus:not-sr-only focus:fixed focus:top-snug focus:left-snug focus:outline-none focus:[box-shadow:var(--focus-ring)]"
    >
      Saltar al contenido
    </a>
  )
}
