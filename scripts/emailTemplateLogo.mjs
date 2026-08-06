import fs from "node:fs"
import path from "node:path"

export const EMAIL_LOGO_PLACEHOLDER = "__BUILDON_EMAIL_LOGO_SRC__"

export const EMAIL_LOGO_FILE = "logo-build-on-email.png"

export function loadEnvFile(filePath) {
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

export function loadProjectEnv(projectRoot) {
  loadEnvFile(path.join(projectRoot, ".env.local"))
  loadEnvFile(path.join(projectRoot, ".env"))
}

export function resolveEmailLogoSiteOrigin(projectRoot) {
  loadProjectEnv(projectRoot)

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured) return configured.replace(/\/$/, "")

  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel}`

  return null
}

export function getEmailLogoPath(projectRoot) {
  return path.join(projectRoot, "public", EMAIL_LOGO_FILE)
}

export function getEmailLogoPublicUrl(projectRoot) {
  const origin = resolveEmailLogoSiteOrigin(projectRoot)

  if (!origin) {
    throw new Error(
      "Definí NEXT_PUBLIC_SITE_URL (ej. https://getbuildon.com) para el logo en emails. Gmail y Outlook no muestran imágenes embebidas en base64.",
    )
  }

  const logoPath = getEmailLogoPath(projectRoot)
  if (!fs.existsSync(logoPath)) {
    throw new Error(
      `No se encontró ${logoPath}. Corré: npm run generate:email-logo`,
    )
  }

  return `${origin}/${EMAIL_LOGO_FILE}`
}

export function getEmailLogoDataUri(projectRoot) {
  const logoPath = getEmailLogoPath(projectRoot)

  if (!fs.existsSync(logoPath)) {
    throw new Error(
      `No se encontró ${logoPath}. Corré: npm run generate:email-logo`,
    )
  }

  const base64 = fs.readFileSync(logoPath).toString("base64")
  return `data:image/png;base64,${base64}`
}

export function getEmailLogoSrc(projectRoot, { requirePublicUrl = true } = {}) {
  if (requirePublicUrl) {
    return getEmailLogoPublicUrl(projectRoot)
  }

  const origin = resolveEmailLogoSiteOrigin(projectRoot)
  if (origin) {
    return `${origin}/${EMAIL_LOGO_FILE}`
  }

  console.warn(
    "[email] NEXT_PUBLIC_SITE_URL no definida; usando base64 (Gmail/Outlook lo bloquean).",
  )
  return getEmailLogoDataUri(projectRoot)
}

export function applyEmailLogo(html, projectRoot, options) {
  if (!html.includes(EMAIL_LOGO_PLACEHOLDER)) {
    return html
  }

  return html.replaceAll(
    EMAIL_LOGO_PLACEHOLDER,
    getEmailLogoSrc(projectRoot, options),
  )
}
