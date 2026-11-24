/**
 * El anillo de foco es de teclado. Un clic no lo prende.
 *
 * Algunos navegadores pintan :focus-visible también al tocar una casilla, un
 * radio o un campo con el mouse. Esta marca le dice al CSS cuál fue el último
 * gesto: `data-modality="pointer"` apaga el anillo (ver theme.css). Los campos de
 * texto quedan afuera: su foco se ve siempre, se llegue con mouse o con teclado.
 * Mismo criterio que la librería de Rootsy.
 */
const KEYBOARD_KEYS = new Set([
  "Tab",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Enter",
  " ",
  "Escape",
])

function mark(modality: "pointer" | "keyboard") {
  if (document.documentElement.dataset.modality !== modality) {
    document.documentElement.dataset.modality = modality
  }
}

/** Se llama una vez al montar la app. Devuelve la función que lo desarma. */
export function installFocusModality(): () => void {
  const onPointer = () => mark("pointer")
  const onKey = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    if (KEYBOARD_KEYS.has(event.key)) mark("keyboard")
  }
  document.addEventListener("pointerdown", onPointer, true)
  document.addEventListener("keydown", onKey, true)
  return () => {
    document.removeEventListener("pointerdown", onPointer, true)
    document.removeEventListener("keydown", onKey, true)
  }
}
