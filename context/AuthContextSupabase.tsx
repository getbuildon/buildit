"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  getDeviceSessionUser,
  signOutClient,
} from "@/lib/auth/clientAuth"
import { borrarCopias } from "@/lib/api/disco"
import { injectClientSupabaseConfig } from "@/lib/auth/clientSupabaseConfig"
import { withAuthTimeout } from "@/lib/auth/mapAuthError"
import type { PublicSupabaseConfig } from "@/lib/auth/publicSupabaseConfig"
import type { AppUser } from "@/lib/auth/types"
import { clearLoginAudience } from "@/lib/auth/loginAudienceActions"
import { createClient } from "@/utils/supabase/client"

export type AuthContextValue = {
  user: AppUser | null
  loading: boolean
  logOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type AuthProviderProps = {
  children: ReactNode
  supabasePublicConfig: PublicSupabaseConfig
}

export function AuthProvider({ children, supabasePublicConfig }: AuthProviderProps) {
  injectClientSupabaseConfig(supabasePublicConfig)

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = async () => {
    // Lee la sesión guardada en el dispositivo (no viaja salvo para renovarla), así la
    // app abre al instante y también sin señal. El servidor valida cada pedido.
    const sessionUser = await withAuthTimeout(getDeviceSessionUser(), 10000).catch(
      () => null,
    )
    setUser((actual) =>
      actual?.id === sessionUser?.id && actual?.email === sessionUser?.email
        ? actual
        : sessionUser,
    )
  }

  useEffect(() => {
    try {
      setSupabase(createClient())
    } catch {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!supabase) return

    let cancelled = false

    const init = async () => {
      try {
        await refreshSession()
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshSession()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [supabase])

  const logOut = async () => {
    await signOutClient()
    await clearLoginAudience()
    // Dispositivo compartido: al salir no queda guardado nada de esta persona.
    await borrarCopias()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, logOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error("useAuth debe usarse dentro de AuthProvider")
  }
  return ctx
}
