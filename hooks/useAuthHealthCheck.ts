"use client"

import { useEffect, useState } from "react"

type AuthHealthState = {
  checked: boolean
  ok: boolean
  message: string
}

const INITIAL: AuthHealthState = {
  checked: false,
  ok: true,
  message: "",
}

export function useAuthHealthCheck() {
  const [health, setHealth] = useState<AuthHealthState>(INITIAL)

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        const response = await fetch("/api/auth/health", { cache: "no-store" })
        const data = (await response.json()) as {
          ok?: boolean
          message?: string
          projectHost?: string
        }
        if (cancelled) return
        if (data.ok) {
          setHealth({ checked: true, ok: true, message: "" })
          return
        }
        setHealth({
          checked: true,
          ok: false,
          message:
            data.message ??
            "No pudimos verificar la conexión con Supabase. Revisá las variables en Vercel.",
        })
      } catch {
        if (cancelled) return
        setHealth({
          checked: true,
          ok: false,
          message: "No pudimos verificar la conexión con Supabase desde el servidor.",
        })
      }
    }

    void check()
    return () => {
      cancelled = true
    }
  }, [])

  return health
}
