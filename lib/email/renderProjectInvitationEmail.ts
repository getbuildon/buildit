import fs from "node:fs"
import path from "node:path"

import { escapeHtml } from "@/lib/email/escapeHtml"
import { getSiteOrigin } from "@/lib/invitations/siteOrigin"

export type ProjectInvitationEmailKind = "team" | "client"

export type ProjectInvitationEmailInput = {
  kind: ProjectInvitationEmailKind
  email: string
  firstName: string
  inviterName: string
  projectName: string
  organizationName: string
  roleLabel: string
  userTypeLabel: string
  unitLabels: string[]
  acceptUrl: string
  expiresAt: Date
}

type InvitationCopy = {
  emailTitle: string
  subject: string
  heading: string
  greeting: string
  intro: string
  ctaLabel: string
  rows: Array<{ label: string; value: string }>
}

let cachedTemplate: string | null = null

function getTemplate(): string {
  if (cachedTemplate) return cachedTemplate

  const templatePath = path.join(
    process.cwd(),
    "lib",
    "email",
    "templates",
    "project-invitation.html",
  )

  cachedTemplate = fs.readFileSync(templatePath, "utf8")
  return cachedTemplate
}

function formatExpiresAt(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date)
}

function renderRows(rows: Array<{ label: string; value: string }>): string {
  return rows
    .map((row, index) => {
      const borderTop = index === 0 ? "" : "border-top: 1px solid #edeef0;"
      return `<tr>
  <td style="padding: 14px 16px; ${borderTop} background-color: #fafafa; width: 38%; vertical-align: top; font-size: 13px; font-weight: 600; line-height: 1.4; color: #43484e;">
    ${escapeHtml(row.label)}
  </td>
  <td style="padding: 14px 16px; ${borderTop} font-size: 14px; line-height: 1.5; color: #18191b; white-space: pre-wrap;">
    ${escapeHtml(row.value.trim() || "—")}
  </td>
</tr>`
    })
    .join("\n")
}

export function buildProjectInvitationEmailCopy(
  input: ProjectInvitationEmailInput,
): InvitationCopy {
  const greeting = input.firstName.trim()
    ? `Hola ${input.firstName.trim()},`
    : "Hola,"
  const organization = input.organizationName.trim()
  const obra = organization
    ? `${input.projectName} de ${organization}`
    : input.projectName

  if (input.kind === "client") {
    return {
      emailTitle: `Te invitaron a seguir ${input.projectName}`,
      subject: `Te invitaron a seguir ${input.projectName} como cliente`,
      heading: "Te invitaron como cliente",
      greeting,
      intro: `${input.inviterName} te invitó a seguir el avance de ${obra}. Confirmá la invitación para ver tus unidades.`,
      ctaLabel: "Ver mi unidad",
      rows: [
        { label: "Obra", value: input.projectName },
        ...(organization ? [{ label: "Empresa", value: organization }] : []),
        { label: "Invitó", value: input.inviterName },
        {
          label: "Unidades",
          value: input.unitLabels.length > 0 ? input.unitLabels.join(", ") : "A confirmar",
        },
      ],
    }
  }

  return {
    emailTitle: `Te invitaron al equipo de ${input.projectName}`,
    subject: `Te invitaron al equipo de ${input.projectName}`,
    heading: "Te invitaron al equipo",
    greeting,
    intro: `${input.inviterName} te invitó a sumarte al equipo de ${obra}. Confirmá la invitación para acceder a la obra.`,
    ctaLabel: "Unirme al equipo",
    rows: [
      { label: "Obra", value: input.projectName },
      ...(organization ? [{ label: "Empresa", value: organization }] : []),
      { label: "Invitó", value: input.inviterName },
      { label: "Tipo", value: input.userTypeLabel },
      { label: "Rol", value: input.roleLabel },
    ],
  }
}

export function renderProjectInvitationEmail(input: ProjectInvitationEmailInput): string {
  const copy = buildProjectInvitationEmailCopy(input)
  const logoUrl = `${getSiteOrigin()}/logo-build-on-email.png`

  return getTemplate()
    .replaceAll("{{EMAIL_TITLE}}", escapeHtml(copy.emailTitle))
    .replaceAll("{{LOGO_URL}}", escapeHtml(logoUrl))
    .replaceAll("{{HEADING}}", escapeHtml(copy.heading))
    .replaceAll("{{GREETING}}", escapeHtml(copy.greeting))
    .replaceAll("{{INTRO}}", escapeHtml(copy.intro))
    .replaceAll("{{ROWS}}", renderRows(copy.rows))
    .replaceAll("{{CTA_LABEL}}", escapeHtml(copy.ctaLabel))
    .replaceAll("{{ACCEPT_URL}}", escapeHtml(input.acceptUrl))
    .replaceAll("{{EXPIRES_AT}}", escapeHtml(formatExpiresAt(input.expiresAt)))
    .replaceAll("{{EMAIL}}", escapeHtml(input.email))
}
