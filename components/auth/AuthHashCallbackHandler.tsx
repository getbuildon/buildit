"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

import { RECOVERY_PASSWORD_NEXT } from "@/lib/auth/clientAuth"
import { REGISTER_CONFIRM_PATH } from "@/lib/auth/registerConfirmPath"
import { createClient } from "@/utils/supabase/client"

function parseHashParams(hash: string): URLSearchParams {
  const trimmed = hash.startsWith("#") ? hash.slice(1) : hash
  return new URLSearchParams(trimmed)
}

function destinationForAuthHashType(type: string | null): string {
  if (type === "invite") {
    return REGISTER_CONFIRM_PATH
  }

  if (type === "recovery") {
    return RECOVERY_PASSWORD_NEXT
  }

  return "/home"
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
    const destination = destinationForAuthHashType(type)

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

      router.replace(destination)
    })()
  }, [router])

  return null
}
