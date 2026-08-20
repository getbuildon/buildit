export const LOGIN_AUDIENCE_COOKIE = "buildon_login_audience"

export type LoginAudience = "equipo" | "cliente"

export const ACCESO_EQUIPO_PATH = "/acceso-equipo"
export const ACCESO_CLIENTES_PATH = "/acceso-clientes"
export const PORTAL_CLIENTE_PATH = "/portal-cliente"

export function isLoginAudience(value: string | undefined | null): value is LoginAudience {
  return value === "equipo" || value === "cliente"
}

export function readLoginAudienceFromCookieHeader(
  cookieHeader: string | null,
): LoginAudience | null {
  if (!cookieHeader) return null

  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LOGIN_AUDIENCE_COOKIE}=`))

  const value = match?.slice(LOGIN_AUDIENCE_COOKIE.length + 1)
  return isLoginAudience(value) ? value : null
}

export function writeLoginAudienceCookie(audience: LoginAudience) {
  if (typeof document === "undefined") return

  document.cookie = `${LOGIN_AUDIENCE_COOKIE}=${audience}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
}

export function audienceFromAccessPath(pathname: string): LoginAudience | null {
  if (pathname === ACCESO_CLIENTES_PATH || pathname.startsWith(`${ACCESO_CLIENTES_PATH}/`)) {
    return "cliente"
  }
  if (pathname === ACCESO_EQUIPO_PATH || pathname.startsWith(`${ACCESO_EQUIPO_PATH}/`)) {
    return "equipo"
  }
  return null
}

export function getLoginAudienceFromDocument(): LoginAudience | null {
  if (typeof document === "undefined") return null

  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LOGIN_AUDIENCE_COOKIE}=`))

  const value = match?.slice(LOGIN_AUDIENCE_COOKIE.length + 1)
  return isLoginAudience(value) ? value : null
}

export function postLoginPath(audience: LoginAudience) {
  return audience === "cliente" ? PORTAL_CLIENTE_PATH : "/home"
}

export function loginPathForAudience(audience: LoginAudience) {
  return audience === "cliente" ? ACCESO_CLIENTES_PATH : ACCESO_EQUIPO_PATH
}
