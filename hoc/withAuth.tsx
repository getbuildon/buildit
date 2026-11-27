"use client"

import { useEffect, type ComponentType, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContextSupabase"

import {
  PORTAL_CLIENTE_PATH,
  getLoginAudienceFromDocument,
  loginPathForAudience,
} from "@/lib/auth/loginAudience"

/**
 * Mientras se lee la sesión o se cambia de pantalla no se muestra ningún texto
 * («Cargando sesión…», «Redirigiendo…»): se muestra el esqueleto de la pantalla, si la
 * página lo da, o el fondo vacío. El lector de pantalla igual sabe que está cargando.
 */
function EnEspera({ children }: { children?: ReactNode }) {
  if (children) return <>{children}</>
  return <div className="min-h-dvh bg-background" role="status" aria-busy="true" aria-label="Cargando" />
}

type Opciones = {
  /** Lo que se ve mientras se lee la sesión: el esqueleto de la pantalla. */
  cargando?: ReactNode
}

export default function withAuth<P extends object>(Component: ComponentType<P>, opciones: Opciones = {}) {
  function WithAuthGuard(props: P) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (typeof window === "undefined" || loading) return
      const audience = getLoginAudienceFromDocument()
      if (!user) {
        router.replace(loginPathForAudience(audience ?? "equipo"))
        return
      }
      if (audience === "cliente") {
        router.replace(PORTAL_CLIENTE_PATH)
      }
    }, [user, loading, router])

    if (loading) return <EnEspera>{opciones.cargando}</EnEspera>

    // Se está yendo a otra pantalla (al login o al portal): fondo vacío, sin texto.
    if (!user || getLoginAudienceFromDocument() === "cliente") return <EnEspera />

    return <Component {...props} />
  }

  WithAuthGuard.displayName = `withAuth(${Component.displayName ?? Component.name ?? "Page"})`
  return WithAuthGuard
}
