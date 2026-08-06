"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"

import {
  isAuthSetupAllowedPath,
  resolvePendingAuthSetupPath,
} from "@/lib/auth/pendingAuthSetup"
import { createClient } from "@/utils/supabase/client"

export function PendingAuthSetupGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const checkedPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (isAuthSetupAllowedPath(pathname)) return
    if (checkedPathRef.current === pathname) return

    checkedPathRef.current = pathname

    const supabase = createClient()

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return

      const destination = resolvePendingAuthSetupPath(user.user_metadata)
      if (!destination) return

      router.replace(destination)
    })
  }, [pathname, router])

  return null
}
