import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { isSupabaseConfigured } from "@/lib/auth/config"

export async function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase no está configurado")
  }

  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  )
}
