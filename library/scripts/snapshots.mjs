#!/usr/bin/env node
/*
 * Capturas automáticas de la librería (regresión visual).
 *
 * Saca una foto de cada página del catálogo, en claro y en oscuro (y las pantallas
 * también en celular), y la compara píxel por píxel con la versión aprobada.
 *
 *   npm run library:snapshots          compara contra las aprobadas
 *   npm run library:snapshots:update   aprueba lo actual como nueva referencia
 *
 * Usa el Chrome instalado en la máquina (no descarga navegadores). Para que las fotos
 * sean siempre iguales: sin animaciones, con «menos movimiento» y esperando las fuentes.
 * Las diferencias quedan en library/snapshots/__diff__ con la zona cambiada en rojo.
 */
import { execFileSync } from "node:child_process"
import { createReadStream, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createServer } from "node:http"
import { extname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import pixelmatch from "pixelmatch"
import { chromium } from "playwright-core"
import { PNG } from "pngjs"

const here = fileURLToPath(new URL(".", import.meta.url))
const library = resolve(here, "..")
const root = resolve(library, "..")
const staticDir = join(library, "storybook-static")
const baselineDir = join(library, "snapshots")
const diffDir = join(baselineDir, "__diff__")
const update = process.argv.includes("--update")
const skipBuild = process.argv.includes("--no-build")
const only = process.argv.find((arg) => arg.startsWith("--only="))?.slice(7)

const viewports = {
  escritorio: { width: 1280, height: 900 },
  celular: { width: 390, height: 844 },
}
const themes = ["claro", "oscuro"]

// Congela todo lo que se mueve: animaciones, transiciones, el cursor de texto.
const freezeCss = `
  *, *::before, *::after {
    animation-play-state: paused !important;
    animation-delay: 0s !important;
    animation-duration: 0s !important;
    transition: none !important;
    caret-color: transparent !important;
  }
`

const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".ttf": "font/ttf", ".ico": "image/x-icon" }

function serve(dir) {
  return new Promise((done) => {
    const server = createServer((request, response) => {
      const path = decodeURIComponent(new URL(request.url, "http://x").pathname)
      const file = join(dir, path === "/" ? "index.html" : path)
      if (!file.startsWith(dir) || !existsSync(file)) {
        response.writeHead(404).end()
        return
      }
      response.writeHead(200, { "content-type": mime[extname(file)] ?? "application/octet-stream" })
      createReadStream(file).pipe(response)
    })
    server.listen(0, "127.0.0.1", () => done(server))
  })
}

function slug(text) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()
}

async function main() {
  if (!skipBuild) {
    console.log("Armando el catálogo…")
    execFileSync("npx", ["storybook", "build", "-c", "library/.storybook", "-o", "library/storybook-static", "--quiet"], { cwd: root, stdio: "ignore" })
  }
  const index = JSON.parse(readFileSync(join(staticDir, "index.json"), "utf8"))
  let stories = Object.values(index.entries).filter((entry) => entry.type === "story")
  if (only) stories = stories.filter((story) => story.id.includes(only))

  const server = await serve(staticDir)
  const base = `http://127.0.0.1:${server.address().port}`
  const browser = await chromium.launch({ channel: "chrome" })
  mkdirSync(baselineDir, { recursive: true })
  rmSync(diffDir, { recursive: true, force: true })

  const results = { iguales: 0, nuevas: 0, distintas: [] }
  for (const story of stories) {
    const isScreen = story.title.startsWith("Pantallas/")
    for (const [viewportName, viewport] of Object.entries(viewports)) {
      if (viewportName === "celular" && !isScreen) continue
      for (const theme of themes) {
        const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce", locale: "es-AR", timezoneId: "America/Argentina/Buenos_Aires" })
        const page = await context.newPage()
        await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme}`, { waitUntil: "networkidle" })
        await page.addStyleTag({ content: freezeCss })
        // Esperar a que estén las letras: si una foto sale con la tipografía de reemplazo,
        // toda la página da distinta. Se piden explícitamente las que usa la librería.
        await page.evaluate(async () => {
          await Promise.all(
            ["400", "500", "600"].map((weight) => document.fonts.load(`${weight} 16px "Google Sans Flex"`)).concat(document.fonts.load("400 16px Recoleta")),
          )
          await document.fonts.ready
        })
        await page.waitForTimeout(150)
        const name = `${slug(story.id)}--${theme}--${viewportName}.png`
        const shot = PNG.sync.read(await page.screenshot({ fullPage: true }))
        await context.close()

        const baselinePath = join(baselineDir, name)
        if (update || !existsSync(baselinePath)) {
          writeFileSync(baselinePath, PNG.sync.write(shot))
          results.nuevas += 1
          continue
        }
        const baseline = PNG.sync.read(readFileSync(baselinePath))
        if (baseline.width !== shot.width || baseline.height !== shot.height) {
          results.distintas.push(`${name}: cambió el tamaño (${baseline.width}×${baseline.height} → ${shot.width}×${shot.height})`)
          mkdirSync(diffDir, { recursive: true })
          writeFileSync(join(diffDir, name), PNG.sync.write(shot))
          continue
        }
        const diff = new PNG({ width: shot.width, height: shot.height })
        const changed = pixelmatch(baseline.data, shot.data, diff.data, shot.width, shot.height, { threshold: 0.1 })
        if (changed === 0) {
          results.iguales += 1
        } else {
          results.distintas.push(`${name}: ${changed} píxeles distintos`)
          mkdirSync(diffDir, { recursive: true })
          writeFileSync(join(diffDir, name), PNG.sync.write(diff))
        }
      }
    }
  }

  await browser.close()
  server.close()

  console.log(`\nIguales: ${results.iguales} · Nuevas o actualizadas: ${results.nuevas} · Distintas: ${results.distintas.length}`)
  if (results.distintas.length) {
    console.log(results.distintas.map((line) => `  · ${line}`).join("\n"))
    console.log(`\nLas diferencias están en ${diffDir}. Si el cambio es el buscado: npm run library:snapshots:update`)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
