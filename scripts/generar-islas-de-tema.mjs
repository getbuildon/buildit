/**
 * Genera library/foundations/islas.css: las variables de color (y lo que depende de
 * ellas) declaradas de nuevo en cada elemento con data-theme.
 *
 * Por qué: al compilar para producción, Next pasa el CSS por Lightning CSS, que reemplaza
 * light-dark() por un truco para navegadores viejos (Safari < 17.5). Con ese truco, una
 * variable como --color-ink se resuelve donde se declara (:root) y una «isla» oscura dentro
 * de una pantalla clara (la foto del ingreso, el menú inverso) heredaba los colores claros.
 * Declarándolas de nuevo en [data-theme], cada isla calcula sus propios colores.
 *
 * Correr después de cambiar tokens/tokens.css o roles.css:  npm run tema:islas
 */
import { readFileSync, writeFileSync } from "node:fs"

const raiz = new URL("../library/foundations/", import.meta.url)
const leer = (ruta) => readFileSync(new URL(ruta, raiz), "utf8")

/** El cuerpo del primer bloque que empieza con `inicio` (hasta su llave de cierre). */
function bloque(css, inicio) {
  const desde = css.indexOf(inicio)
  if (desde < 0) throw new Error(`No encontré «${inicio}»`)
  let i = css.indexOf("{", desde) + 1
  let nivel = 1
  const comienzo = i
  for (; i < css.length && nivel > 0; i++) {
    if (css[i] === "{") nivel++
    else if (css[i] === "}") nivel--
  }
  return css.slice(comienzo, i - 1)
}

const sinComentarios = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "")
const declaraciones = (cuerpo) =>
  [...sinComentarios(cuerpo).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, nombre, valor]) => [nombre, valor.trim().replace(/\s+/g, " ")])

const todas = [
  ...declaraciones(bloque(leer("tokens/tokens.css"), ":root")),
  ...declaraciones(bloque(leer("roles.css"), "@theme static")),
]
const valorDe = new Map(todas)

// Las que usan light-dark() y, de a pasadas, las que usan alguna de esas.
const dependen = new Set(todas.filter(([, v]) => v.includes("light-dark(")).map(([n]) => n))
for (let cambio = true; cambio; ) {
  cambio = false
  for (const [nombre, valor] of valorDe) {
    if (dependen.has(nombre)) continue
    const usa = [...valor.matchAll(/var\((--[\w-]+)/g)].some(([, v]) => dependen.has(v))
    if (usa) {
      dependen.add(nombre)
      cambio = true
    }
  }
}

const lineas = todas.filter(([n]) => dependen.has(n)).map(([n, v]) => `  ${n}: ${v};`)
const salida = `/* GENERADO por scripts/generar-islas-de-tema.mjs — no editar a mano (npm run tema:islas).
 * Cada elemento con data-theme recalcula sus colores: así una isla oscura dentro de una
 * pantalla clara (o al revés) se ve bien también en el build de producción. */
[data-theme] {
${lineas.join("\n")}
}
`
writeFileSync(new URL("islas.css", raiz), salida)
console.log(`islas.css: ${lineas.length} variables`)
