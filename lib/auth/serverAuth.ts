import { createClient } from "@/utils/supabase/server"

export async function getServerSessionUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user?.email) return null
  return { id: user.id, email: user.email }
}
