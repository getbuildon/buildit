export type PublicSupabaseConfig = {
  url: string
  anonKey: string
}

function isPlaceholderConfig(url: string, anonKey: string): boolean {
  return url.includes("your-project") || anonKey === "your-anon-key"
}

function looksLikeSecretKey(anonKey: string): boolean {
  return anonKey.startsWith("sb_secret_") || anonKey.includes("service_role")
}

export function readPublicSupabaseConfigFromEnv(): PublicSupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !anonKey) return null
  if (isPlaceholderConfig(url, anonKey)) return null
  if (looksLikeSecretKey(anonKey)) return null

  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null
  } catch {
    return null
  }

  return { url, anonKey }
}

export function getSupabaseProjectHost(config: PublicSupabaseConfig): string {
  try {
    return new URL(config.url).host
  } catch {
    return config.url
  }
}
