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
import { isSupabaseConfigured } from "@/lib/auth/config"
import type { AppUser } from "@/lib/auth/types"
import { createClient } from "@/utils/supabase/client"

export type AuthContextValue = {
  user: AppUser | null
  loading: boolean
  authMode: "mock" | "supabase"
  logOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const authMode = isSupabaseConfigured() ? "supabase" : "mock"

  const refreshSession = async () => {
    const sessionUser = await getClientSessionUser()
    setUser(sessionUser)
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      void refreshSession().finally(() => setLoading(false))
      return
    }

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
    <AuthContext.Provider
      value={{ user, loading, authMode, logOut, refreshSession }}
    >
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
