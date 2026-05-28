"use client"

import { useEffect, type ComponentType } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContextSupabase"
import { Spinner } from "@/components/ui/spinner"

const HOME_PATH = "/home"

function RedirectingFallback({ message }: { message: string }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-foreground"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner className="size-8 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  )
}

export function withGuestAuth<P extends object>(Component: ComponentType<P>) {
  function WithGuestGuard(props: P) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (loading || !user) return
      router.replace(HOME_PATH)
    }, [user, loading, router])

    if (loading) {
      return <RedirectingFallback message="Cargando sesión…" />
    }

    if (user) {
      return <RedirectingFallback message="Redirigiendo…" />
    }

    return <Component {...props} />
  }

  WithGuestGuard.displayName = `withGuestAuth(${Component.displayName ?? Component.name ?? "Page"})`
  return WithGuestGuard
}
