/** Caracteres permitidos mientras se escribe un email. */
const EMAIL_INPUT_PATTERN = /[^a-zA-Z0-9@._+\-]/g

export function sanitizeEmailInput(value: string): string {
  return value.replace(EMAIL_INPUT_PATTERN, "")
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}
