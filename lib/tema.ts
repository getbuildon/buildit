/**
 * Modo claro u oscuro de las pantallas que ya usan la librería BuildOn.
 * Se guarda en este dispositivo y se aplica en <html data-theme>, que es lo que leen los
 * colores de la librería (ver library/foundations/roles.css). Las pantallas viejas no
 * usan esos colores, así que siguen claras hasta que pasen a la librería.
 */
export const temas = ["claro", "oscuro", "sistema"] as const
export type Tema = (typeof temas)[number]

export const CLAVE_DEL_TEMA = "buildon:tema"
const EVENTO = "buildon:tema"

const esTema = (valor: unknown): valor is Tema => temas.includes(valor as Tema)

// Lo elegido en esta visita, por si el dispositivo no deja guardar (modo privado).
let elegidoEnLaVisita: Tema | null = null

export function temaGuardado(): Tema {
  if (elegidoEnLaVisita) return elegidoEnLaVisita
  try {
    const guardado = localStorage.getItem(CLAVE_DEL_TEMA)
    if (esTema(guardado)) return guardado
  } catch {
    // Sin almacenamiento: claro.
  }
  return "claro"
}

export function elegirTema(tema: Tema) {
  elegidoEnLaVisita = tema
  try {
    localStorage.setItem(CLAVE_DEL_TEMA, tema)
  } catch {
    // Sin almacenamiento (modo privado): vale para esta visita.
  }
  if (!document.documentElement.dataset.temaForzado) document.documentElement.dataset.theme = tema
  window.dispatchEvent(new Event(EVENTO))
}

/**
 * Las pantallas que todavía no pasaron a la librería tienen colores fijos de modo claro:
 * mientras se ven, toda la página (menús y ventanas incluidos) queda en claro.
 * Al salir de ellas vuelve el modo elegido.
 */
export function forzarClaro(forzar: boolean) {
  const html = document.documentElement
  if (forzar) {
    html.dataset.temaForzado = "claro"
    html.dataset.theme = "claro"
  } else {
    delete html.dataset.temaForzado
    html.dataset.theme = temaGuardado()
  }
}

export function escucharTema(alCambiar: () => void) {
  window.addEventListener(EVENTO, alCambiar)
  return () => window.removeEventListener(EVENTO, alCambiar)
}

/**
 * Corre en <head> antes de pintar, así no hay un parpadeo claro al abrir en oscuro.
 * Es texto: se inserta tal cual en un <script>.
 */
export const SCRIPT_DEL_TEMA = `try{var t=localStorage.getItem(${JSON.stringify(CLAVE_DEL_TEMA)});if(t==="claro"||t==="oscuro"||t==="sistema")document.documentElement.dataset.theme=t}catch(e){}`
