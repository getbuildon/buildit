type SendTransactionalEmailInput = {
  to: string[]
  subject: string
  html: string
}

type SendTransactionalEmailResult =
  | { ok: true }
  | {
      ok: false
      error: string
      code?: "missing_api_key" | "missing_recipients" | "provider_error"
    }

function parseResendError(body: string): string | null {
  if (!body.trim()) return null

  try {
    const parsed = JSON.parse(body) as { message?: string }
    return parsed.message?.trim() || null
  } catch {
    return body.trim()
  }
}

export function getPublicEmailSendError(
  error: string,
  code?: string,
): string {
  if (code === "missing_api_key") {
    return "El servidor no tiene configurada RESEND_API_KEY."
  }

  if (code === "missing_recipients") {
    return "No hay destinatarios configurados (BACKOFFICE_ALLOWED_EMAILS)."
  }

  const resendMessage = parseResendError(error)
  if (resendMessage) {
    return `Error de envío: ${resendMessage}`
  }

  return "No se pudo enviar la solicitud. Intentá de nuevo más tarde."
}

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput,
): Promise<SendTransactionalEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "BuildOn <noreply@getbuildon.com>"

  if (!apiKey) {
    return {
      ok: false,
      code: "missing_api_key",
      error: "RESEND_API_KEY no está configurada en el servidor.",
    }
  }

  if (input.to.length === 0) {
    return {
      ok: false,
      code: "missing_recipients",
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
      code: "provider_error",
      error: body || `Resend respondió con error ${response.status}.`,
    }
  }

  return { ok: true }
}
