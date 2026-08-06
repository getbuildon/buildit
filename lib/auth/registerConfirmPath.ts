export const REGISTER_CONFIRM_PATH = "/register/confirm"

export function buildRegisterConfirmPath(): string {
  return REGISTER_CONFIRM_PATH
}

export function buildRegisterConfirmCallbackUrl(siteOrigin: string): string {
  const next = encodeURIComponent(REGISTER_CONFIRM_PATH)
  return `${siteOrigin}/auth/callback?next=${next}`
}
