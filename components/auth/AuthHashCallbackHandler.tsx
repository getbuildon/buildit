"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

import { RECOVERY_PASSWORD_NEXT } from "@/lib/auth/clientAuth"
import { resolvePendingAuthSetupPath } from "@/lib/auth/pendingAuthSetup"
import { createClient } from "@/utils/supabase/client"

function parseHashParams(hash: string): URLSearchParams {
  const trimmed = hash.startsWith("#") ? hash.slice(1) : hash
  return new URLSearchParams(trimmed)
}

export function AuthHashCallbackHandler() {
  const router = useRouter()
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current || typeof window === "undefined") return

    const hash = window.location.hash
    if (!hash.includes("access_token=")) return

    const params = parseHashParams(hash)
    const accessToken = params.get("access_token")
    const refreshToken = params.get("refresh_token")

    if (!accessToken || !refreshToken) return

    handledRef.current = true

    const supabase = createClient()
    const type = params.get("type")

    void (async () => {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        handledRef.current = false
        router.replace("/login?error=hash_callback")
        return
      }

      let destination = "/home"

      if (type === "recovery") {
        destination = RECOVERY_PASSWORD_NEXT
      } else {
        destination =
          resolvePendingAuthSetupPath(
            (await supabase.auth.getUser()).data.user?.user_metadata,
          ) ?? "/home"
      }

      router.replace(destination)
      window.history.replaceState(null, "", window.location.pathname)
    })()
  }, [router])

  return null
}
