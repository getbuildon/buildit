#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { applyEmailLogo } from "./emailTemplateLogo.mjs"

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const templatesDir = path.join(projectRoot, "supabase", "templates")

const TEMPLATE_DEFINITIONS = [
  {
    id: "invite",
    file: "invite.html",
    subject: "Te invitaron a BuildOn",
    subjectKey: "mailer_subjects_invite",
    contentKey: "mailer_templates_invite_content",
  },
  {
    id: "confirmation",
    file: "confirmation.html",
    subject: "Confirmá tu correo en BuildOn",
    subjectKey: "mailer_subjects_confirmation",
    contentKey: "mailer_templates_confirmation_content",
  },
  {
    id: "recovery",
    file: "recovery.html",
    subject: "Restablecé tu contraseña en BuildOn",
    subjectKey: "mailer_subjects_recovery",
    contentKey: "mailer_templates_recovery_content",
  },
  {
    id: "magic_link",
    file: "magic_link.html",
    subject: "Tu enlace de acceso a BuildOn",
    subjectKey: "mailer_subjects_magic_link",
    contentKey: "mailer_templates_magic_link_content",
  },
]

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  const contents = fs.readFileSync(filePath, "utf8")

  for (const line of contents.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const separatorIndex = trimmed.indexOf("=")
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

function resolveProjectRef() {
  if (process.env.SUPABASE_PROJECT_REF?.trim()) {
    return process.env.SUPABASE_PROJECT_REF.trim()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!supabaseUrl) return null

  try {
    const hostname = new URL(supabaseUrl).hostname
    const ref = hostname.split(".")[0]
    return ref || null
  } catch {
    return null
  }
}

function readTemplatePayload() {
  const payload = {}

  for (const template of TEMPLATE_DEFINITIONS) {
    const filePath = path.join(templatesDir, template.file)

    if (!fs.existsSync(filePath)) {
      throw new Error(`No se encontró la plantilla: ${filePath}`)
    }

    payload[template.subjectKey] = template.subject
    payload[template.contentKey] = applyEmailLogo(
      fs.readFileSync(filePath, "utf8"),
      projectRoot,
    )
  }

  return payload
}

function printUsage() {
  console.log(`
Sincroniza las plantillas HTML locales con Supabase Auth (Management API).

Uso:
  node scripts/sync-supabase-email-templates.mjs [--dry-run]

Variables requeridas:
  SUPABASE_ACCESS_TOKEN   Token personal de https://supabase.com/dashboard/account/tokens

Variables opcionales:
  SUPABASE_PROJECT_REF    Ref del proyecto (default: derivado de NEXT_PUBLIC_SUPABASE_URL)
  NEXT_PUBLIC_SUPABASE_URL

El logo se incrusta en base64 al sincronizar para que funcione en mails enviados.

Ejemplo:
  SUPABASE_ACCESS_TOKEN=sbp_... npm run sync:email-templates
`)
}

async function main() {
  const args = new Set(process.argv.slice(2))

  if (args.has("--help") || args.has("-h")) {
    printUsage()
    return
  }

  loadEnvFile(path.join(projectRoot, ".env.local"))
  loadEnvFile(path.join(projectRoot, ".env"))

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim()
  const projectRef = resolveProjectRef()
  const dryRun = args.has("--dry-run")

  if (!accessToken) {
    console.error("Falta SUPABASE_ACCESS_TOKEN.")
    printUsage()
    process.exit(1)
  }

  if (!projectRef) {
    console.error(
      "No se pudo resolver el project ref. Definí SUPABASE_PROJECT_REF o NEXT_PUBLIC_SUPABASE_URL.",
    )
    process.exit(1)
  }

  const payload = readTemplatePayload()

  console.log(`Proyecto: ${projectRef}`)
  console.log(`Plantillas: ${TEMPLATE_DEFINITIONS.map((item) => item.id).join(", ")}`)

  if (dryRun) {
    console.log("\n[dry-run] Payload listo. No se envió nada al Management API.")
    for (const template of TEMPLATE_DEFINITIONS) {
      const bytes = Buffer.byteLength(payload[template.contentKey], "utf8")
      console.log(`  - ${template.id}: "${template.subject}" (${bytes} bytes)`)
    }
    return
  }

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  )

  const bodyText = await response.text()
  let bodyJson = null

  if (bodyText) {
    try {
      bodyJson = JSON.parse(bodyText)
    } catch {
      bodyJson = bodyText
    }
  }

  if (!response.ok) {
    console.error(`Error ${response.status} al sincronizar plantillas:`)
    console.error(typeof bodyJson === "string" ? bodyJson : JSON.stringify(bodyJson, null, 2))
    process.exit(1)
  }

  console.log("\nPlantillas sincronizadas correctamente.")
  console.log("Verificá en: Authentication → Email Templates del dashboard de Supabase.")
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
