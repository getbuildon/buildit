import { NextResponse } from "next/server"
import { readPublicSupabaseConfigFromEnv } from "@/lib/auth/publicSupabaseConfig"
import { createClient } from "@/utils/supabase/server"

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/home"
  return raw
}

export async function GET(request: Request) {
  const config = readPublicSupabaseConfigFromEnv()
  const { searchParams, origin } = new URL(request.url)

  if (!config) {
    return NextResponse.redirect(`${origin}/login?error=config`)
  }

  const code = searchParams.get("code")
  const next = safeNextPath(searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=callback`)
}
