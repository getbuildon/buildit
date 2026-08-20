import { NextResponse } from "next/server"

import { getLandingLeadNotificationRecipients } from "@/lib/email/parseCommaSeparatedEmails"
import { renderLandingLeadEmail } from "@/lib/email/renderLandingLeadEmail"
import { getPublicEmailSendError, sendTransactionalEmail } from "@/lib/email/sendTransactionalEmail"
import {
  buildLandingLeadEmail,
  parseLandingLeadPayload,
} from "@/lib/landing/processLandingLead"

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "Solicitud inválida." },
      { status: 400 },
    )
  }

  const parsed = parseLandingLeadPayload(body)
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: parsed.error },
      { status: 400 },
    )
  }

  const recipients = getLandingLeadNotificationRecipients()
  if (recipients.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "No hay destinatarios configurados (LANDING_LEAD_NOTIFICATION_EMAILS).",
      },
      { status: 503 },
    )
  }

  const emailContent = buildLandingLeadEmail(parsed.value)
  const html = renderLandingLeadEmail({
    emailTitle: emailContent.emailTitle,
    heading: emailContent.heading,
    intro: emailContent.intro,
    rows: emailContent.rows,
  })

  const sendResult = await sendTransactionalEmail({
    to: recipients,
    subject: emailContent.subject,
    html,
  })

  if (!sendResult.ok) {
    console.error("[landing/leads] Error al enviar email:", sendResult.error)

    return NextResponse.json(
      {
        ok: false,
        error: getPublicEmailSendError(sendResult.error, sendResult.code),
      },
      { status: 503 },
    )
  }

  return NextResponse.json({ ok: true })
}
