#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { applyEmailLogo } from "./emailTemplateLogo.mjs"

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const sourceDir = path.join(projectRoot, "supabase", "templates")
const outputDir = path.join(sourceDir, "generated")

const TEMPLATE_FILES = [
  "invite.html",
  "confirmation.html",
  "recovery.html",
  "magic_link.html",
]

function main() {
  fs.mkdirSync(outputDir, { recursive: true })

  for (const fileName of TEMPLATE_FILES) {
    const sourcePath = path.join(sourceDir, fileName)
    const outputPath = path.join(outputDir, fileName)

    if (!fs.existsSync(sourcePath)) {
      throw new Error(`No se encontró la plantilla: ${sourcePath}`)
    }

    const html = applyEmailLogo(fs.readFileSync(sourcePath, "utf8"), projectRoot)
    fs.writeFileSync(outputPath, html, "utf8")
  }

  console.log(`Plantillas generadas en supabase/templates/generated/ (${TEMPLATE_FILES.length})`)
}

main()
