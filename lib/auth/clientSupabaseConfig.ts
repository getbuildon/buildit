import type { PublicSupabaseConfig } from "@/lib/auth/publicSupabaseConfig"
import { readPublicSupabaseConfigFromEnv } from "@/lib/auth/publicSupabaseConfig"

let injectedConfig: PublicSupabaseConfig | null | undefined

export function injectClientSupabaseConfig(config: PublicSupabaseConfig | null) {
  injectedConfig = config
}

export function resolveClientSupabaseConfig(): PublicSupabaseConfig | null {
  if (injectedConfig !== undefined) return injectedConfig
  return readPublicSupabaseConfigFromEnv()
}
