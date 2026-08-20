"use client"

import { useState } from "react"
import { useAppRouteNavigation } from "@/components/navigation/AppRouteLoadingProvider"
import { switchToClientPortal } from "@/lib/auth/loginAccess"
import { writeLoginAudienceCookie } from "@/lib/auth/loginAudience"
import { HOME_LAYOUT } from "@/lib/home/designTokens"

export function HomePortalClientesButton() {
  const { navigate } = useAppRouteNavigation()
  const [pending, setPending] = useState(false)

  const handleClick = async () => {
    if (pending) return
    setPending(true)

    const result = await switchToClientPortal()
    if (!result.ok) {
      setPending(false)
      return
    }

    writeLoginAudienceCookie("cliente")
    navigate(result.redirectTo)
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={pending}
      className={HOME_LAYOUT.topPillButton}
    >
      Portal Clientes
    </button>
  )
}
