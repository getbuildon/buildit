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
  getClientSessionUser,
  signOutClient,
} from "@/lib/auth/clientAuth"
import { injectClientSupabaseConfig } from "@/lib/auth/clientSupabaseConfig"
import type { PublicSupabaseConfig } from "@/lib/auth/publicSupabaseConfig"
import type { AppUser } from "@/lib/auth/types"
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
    const sessionUser = await getClientSessionUser()
    setUser(sessionUser)
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
