"use client"

import { useEffect, useState } from "react"

import { escucharCola, leerCola, type EscrituraEnCola } from "@/lib/api/cola"

/** Lo cargado en esta obra que todavía no llegó al servidor. Se actualiza solo. */
export function useColaDeObra(userId: string, obraId: string): EscrituraEnCola[] {
  const [items, setItems] = useState<EscrituraEnCola[]>([])
  useEffect(() => {
    if (!userId) return
    let vivo = true
    const leer = () => {
      void leerCola(userId, obraId).then((lista) => {
        if (vivo) setItems(lista)
      })
    }
    leer()
    const dejar = escucharCola(leer)
    return () => {
      vivo = false
      dejar()
    }
  }, [userId, obraId])
  return items
}
