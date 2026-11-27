"use client"

import { useEffect, useState, type ComponentType } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContextSupabase"
import {
  audienceFromAccessPath,
  getLoginAudienceFromDocument,
  postLoginPath,
} from "@/lib/auth/loginAudience"

/** Fondo vacío mientras se lee la sesión: sin textos de «Cargando…» ni «Redirigiendo…». */
function EnEspera() {
  return <div className="min-h-dvh bg-background" role="status" aria-busy="true" aria-label="Cargando" />
}

export function withGuestAuth<P extends object>(Component: ComponentType<P>) {
  function WithGuestGuard(props: P) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    // Si el formulario ya se vio (la persona acaba de ingresar acá), queda en pantalla
    // —con su botón «Entrando…»— hasta que aparece el Inicio, sin una pantalla en el medio.
    const [yaSeVio, setYaSeVio] = useState(false)
    if (!yaSeVio && !loading && !user) setYaSeVio(true)

    useEffect(() => {
      if (loading || !user) return
      const audience =
        audienceFromAccessPath(pathname) ??
        getLoginAudienceFromDocument() ??
        "equipo"
      router.replace(postLoginPath(audience))
    }, [user, loading, pathname, router])

    if (!yaSeVio) return <EnEspera />
    return <Component {...props} />
  }

  WithGuestGuard.displayName = `withGuestAuth(${Component.displayName ?? Component.name ?? "Page"})`
  return WithGuestGuard
}
