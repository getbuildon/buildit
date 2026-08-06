type SendTransactionalEmailInput = {
  to: string[]
  subject: string
  html: string
}

type SendTransactionalEmailResult =
  | { ok: true }
  | { ok: false; error: string }

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput,
): Promise<SendTransactionalEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "BuildOn <info@getbuildon.com>"

  if (!apiKey) {
    return {
      ok: false,
      error: "RESEND_API_KEY no está configurada en el servidor.",
    }
  }

  if (input.to.length === 0) {
    return {
      ok: false,
      error: "No hay destinatarios configurados (BACKOFFICE_ALLOWED_EMAILS).",
    }
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    return {
      ok: false,
      error: body || `Resend respondió con error ${response.status}.`,
    }
  }

  return { ok: true }
}
