"use client"

import { useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase/client"

export function useSupabaseBrowser() {
  const [client, setClient] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    setClient(createClient())
  }, [])

  return client
}
