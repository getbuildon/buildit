import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { readPublicSupabaseConfigFromEnv } from "@/lib/auth/publicSupabaseConfig"

export async function createClient() {
  const config = readPublicSupabaseConfigFromEnv()
  if (!config) {
    throw new Error("Supabase no está configurado")
  }

  const cookieStore = await cookies()

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          /* RSC sin escritura de cookies: el middleware renueva la sesión. */
        }
      },
    },
  })
}
