export const MOCK_AUTH_EMAIL = "demo@buildit.com"
export const MOCK_AUTH_PASSWORD = "demo123456"
export const MOCK_AUTH_USER_ID = "mock-user-demo"

export const MOCK_SESSION_COOKIE = "build-it-mock-session"

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !key) return false
  if (url.includes("your-project") || key === "your-anon-key") return false
  return true
}

export function authModeLabel(): "mock" | "supabase" {
  return isSupabaseConfigured() ? "supabase" : "mock"
}
