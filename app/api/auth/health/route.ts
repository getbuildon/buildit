import { NextResponse } from "next/server"
import {
  getSupabaseProjectHost,
  readPublicSupabaseConfigFromEnv,
} from "@/lib/auth/publicSupabaseConfig"

export async function GET() {
  const config = readPublicSupabaseConfigFromEnv()

  if (!config) {
    return NextResponse.json({
      ok: false,
      reason: "missing_config",
      message: "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    })
  }

  const projectHost = getSupabaseProjectHost(config)

  if (!projectHost.endsWith(".supabase.co")) {
    return NextResponse.json({
      ok: false,
      reason: "invalid_supabase_url",
      projectHost,
      message:
        "NEXT_PUBLIC_SUPABASE_URL en Vercel debe ser la URL del proyecto Supabase (https://xxx.supabase.co), no la URL del sitio. Usá NEXT_PUBLIC_SITE_URL para getbuildon.com.",
    })
  }

  try {
    const response = await fetch(`${config.url}/auth/v1/health`, {
      method: "GET",
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      return NextResponse.json({
        ok: false,
        reason: "auth_unreachable",
        projectHost,
        message: "Supabase respondió con error. Revisá la URL y la anon key en Vercel.",
      })
    }

    return NextResponse.json({
      ok: true,
      reason: "ok",
      projectHost,
    })
  } catch {
    return NextResponse.json({
      ok: false,
      reason: "network_error",
      projectHost,
      message: "No se pudo conectar con Supabase desde el servidor.",
    })
  }
}
