import { cookies } from "next/headers"
import { isSupabaseConfigured, MOCK_SESSION_COOKIE } from "@/lib/auth/config"
import { readMockUserFromCookieValue } from "@/lib/auth/mockSession"
import { createClient } from "@/utils/supabase/server"

export async function getServerSessionUser() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user?.email) return null
    return { uid: user.id, email: user.email }
  }

  const cookieStore = await cookies()
  const mockUser = readMockUserFromCookieValue(
    cookieStore.get(MOCK_SESSION_COOKIE)?.value,
  )
  if (!mockUser) return null
  return { uid: mockUser.id, email: mockUser.email }
}
