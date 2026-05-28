const AUTH_TIMEOUT_MESSAGE =
  "El servidor de autenticación no respondió a tiempo. Verificá tu conexión e intentá de nuevo."

const AUTH_NETWORK_MESSAGE =
  "No pudimos conectar con el servidor de autenticación. Revisá la configuración de Supabase en Vercel."

export function mapAuthError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    if (error.message === AUTH_TIMEOUT_MESSAGE) return AUTH_TIMEOUT_MESSAGE
    if (isNetworkErrorMessage(error.message)) return AUTH_NETWORK_MESSAGE
    return mapSupabaseMessage(error.message, fallback)
  }
  return fallback
}

function isNetworkErrorMessage(message: string): boolean {
  const msg = message.toLowerCase()
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network request failed") ||
    msg.includes("load failed") ||
    msg.includes("fetch failed")
  )
}

function mapSupabaseMessage(message: string, fallback: string): string {
  const msg = message.toLowerCase()
  if (isNetworkErrorMessage(msg)) return AUTH_NETWORK_MESSAGE
  if (msg.includes("email not confirmed")) {
    return "Confirmá tu correo antes de ingresar. Revisá tu bandeja de entrada."
  }
  if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
    return "Correo electrónico o contraseña incorrectos"
  }
  if (msg.includes("user already registered")) {
    return "Ya existe una cuenta con ese correo. Probá iniciar sesión."
  }
  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return "Se alcanzó el límite de envío de correos. Esperá unos minutos e intentá de nuevo."
  }
  if (msg.includes("invalid api key") || msg.includes("api key")) {
    return "La clave de Supabase configurada no es válida. Revisá NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel."
  }
  return message || fallback
}

export function withAuthTimeout<T>(
  promise: Promise<T>,
  ms = 15000,
  message = AUTH_TIMEOUT_MESSAGE,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms)
    }),
  ])
}
