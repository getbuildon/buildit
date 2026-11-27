"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import { useAuth } from "@/context/AuthContextSupabase"
import { alEnviarDeLaCola, leerCola, vaciarCola } from "@/lib/api/cola"
import { apiDisponible } from "@/lib/api/navegador"

const CADA_MS = 60_000

/**
 * Manda lo que quedó cargado en el dispositivo (lib/api/cola.ts): al abrir la app, al
 * volver la señal, al volver a la pestaña y cada minuto mientras quede algo. No dibuja nada.
 */
export function VaciarColaDeEscrituras() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ""

  useEffect(() => {
    // Lo enviado se vuelve a leer antes de salir de la cola: la pantalla no parpadea.
    alEnviarDeLaCola((item) =>
      queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          queryKey[0] === "api" &&
          ((queryKey[2] === "obras" && queryKey[3] === item.obraId) || queryKey[2] === "inicio"),
      }),
    )
    return () => alEnviarDeLaCola(null)
  }, [queryClient])

  useEffect(() => {
    if (!userId || !apiDisponible()) return
    const vaciar = () => void vaciarCola(userId)
    vaciar()
    const alVolver = () => document.visibilityState === "visible" && vaciar()
    window.addEventListener("online", vaciar)
    document.addEventListener("visibilitychange", alVolver)
    const reloj = window.setInterval(() => {
      void leerCola(userId).then((pendientes) => {
        if (pendientes.some((p) => !p.error)) vaciar()
      })
    }, CADA_MS)
    return () => {
      window.removeEventListener("online", vaciar)
      document.removeEventListener("visibilitychange", alVolver)
      window.clearInterval(reloj)
    }
  }, [userId])

  return null
}
