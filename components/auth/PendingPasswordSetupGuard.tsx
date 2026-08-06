"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"

import { REGISTER_CONFIRM_PATH } from "@/lib/auth/registerConfirmPath"
import { createClient } from "@/utils/supabase/client"

const ALLOWED_PATH_PREFIXES = [
  REGISTER_CONFIRM_PATH,
  "/login",
  "/register",
  "/auth/",
  "/invite/setup",
  "/recovery-password",
]

function isAllowedPath(pathname: string): boolean {
  return ALLOWED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export function userNeedsPasswordSetup(
  userMetadata: Record<string, unknown> | undefined,
): boolean {
  if (!userMetadata) return false
  if (userMetadata.invitation_id) return false
  return userMetadata.password_setup_required === true
}

export function PendingPasswordSetupGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const checkedPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (isAllowedPath(pathname)) return
    if (checkedPathRef.current === pathname) return

    checkedPathRef.current = pathname

    const supabase = createClient()

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      if (!userNeedsPasswordSetup(user.user_metadata)) return
      router.replace(REGISTER_CONFIRM_PATH)
    })
  }, [pathname, router])

  return null
}
