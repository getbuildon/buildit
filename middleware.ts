import { NextResponse, type NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { audienceRedirectPath } from "@/lib/auth/audienceRouteGuard"
import {
  LOGIN_AUDIENCE_COOKIE,
  isLoginAudience,
} from "@/lib/auth/loginAudience"
import { readPublicSupabaseConfigFromEnv } from "@/lib/auth/publicSupabaseConfig"

export async function middleware(request: NextRequest) {
  const config = readPublicSupabaseConfigFromEnv()
  if (!config) {
    return NextResponse.next({ request })
  }

  const audienceCookie = request.cookies.get(LOGIN_AUDIENCE_COOKIE)?.value
  const audience = isLoginAudience(audienceCookie) ? audienceCookie : null
  const redirectTo = audienceRedirectPath(request.nextUrl.pathname, audience)
  if (redirectTo) {
    const url = request.nextUrl.clone()
    url.pathname = redirectTo
    return NextResponse.redirect(url)
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
