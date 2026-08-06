import fs from "node:fs"
import path from "node:path"

import { escapeHtml } from "@/lib/email/escapeHtml"
import { getSiteOrigin } from "@/lib/invitations/siteOrigin"

export type LandingLeadEmailRow = {
  label: string
  value: string
}

export type RenderLandingLeadEmailInput = {
  emailTitle: string
  heading: string
  intro: string
  rows: LandingLeadEmailRow[]
  submittedAt?: Date
}

let cachedTemplate: string | null = null

function getTemplate(): string {
  if (cachedTemplate) return cachedTemplate

  const templatePath = path.join(
    process.cwd(),
    "lib",
    "email",
    "templates",
    "landing-lead.html",
  )

  cachedTemplate = fs.readFileSync(templatePath, "utf8")
  return cachedTemplate
}

function renderRows(rows: LandingLeadEmailRow[]): string {
  return rows
    .map((row, index) => {
      const borderTop =
        index === 0 ? "" : "border-top: 1px solid #edeef0;"
      const value = row.value.trim() || "—"

      return `<tr>
  <td style="padding: 14px 16px; ${borderTop} background-color: #fafafa; width: 38%; vertical-align: top; font-size: 13px; font-weight: 600; line-height: 1.4; color: #43484e;">
    ${escapeHtml(row.label)}
  </td>
  <td style="padding: 14px 16px; ${borderTop} font-size: 14px; line-height: 1.5; color: #18191b; white-space: pre-wrap;">
    ${escapeHtml(value)}
  </td>
</tr>`
    })
    .join("\n")
}

function formatSubmittedAt(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date)
}

export function renderLandingLeadEmail(input: RenderLandingLeadEmailInput): string {
  const submittedAt = input.submittedAt ?? new Date()
  const logoUrl = `${getSiteOrigin()}/logo-build-on-email.png`

  return getTemplate()
    .replaceAll("{{EMAIL_TITLE}}", escapeHtml(input.emailTitle))
    .replaceAll("{{LOGO_URL}}", escapeHtml(logoUrl))
    .replaceAll("{{HEADING}}", escapeHtml(input.heading))
    .replaceAll("{{INTRO}}", escapeHtml(input.intro))
    .replaceAll("{{ROWS}}", renderRows(input.rows))
    .replaceAll("{{SUBMITTED_AT}}", escapeHtml(formatSubmittedAt(submittedAt)))
}
