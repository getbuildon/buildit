import fs from "node:fs"
import path from "node:path"

export const EMAIL_LOGO_PLACEHOLDER = "__BUILDON_EMAIL_LOGO_SRC__"

export const EMAIL_LOGO_FILE = "logo-build-on-email.png"

export function getEmailLogoPath(projectRoot) {
  return path.join(projectRoot, "public", EMAIL_LOGO_FILE)
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

export function applyEmailLogo(html, projectRoot) {
  if (!html.includes(EMAIL_LOGO_PLACEHOLDER)) {
    return html
  }

  return html.replaceAll(
    EMAIL_LOGO_PLACEHOLDER,
    getEmailLogoDataUri(projectRoot),
  )
}
