import { createBrowserClient } from "@supabase/ssr"
import { resolveClientSupabaseConfig } from "@/lib/auth/clientSupabaseConfig"

export function createClient() {
  const config = resolveClientSupabaseConfig()
  if (!config) {
    throw new Error("Supabase no está configurado")
  }

  return createBrowserClient(config.url, config.anonKey)
}
