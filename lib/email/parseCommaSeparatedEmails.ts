export function parseCommaSeparatedEmails(raw: string | undefined): string[] {
  if (!raw?.trim()) return []

  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function getLandingLeadNotificationRecipients(): string[] {
  return parseCommaSeparatedEmails(process.env.BACKOFFICE_ALLOWED_EMAILS)
}
