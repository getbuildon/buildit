"use client"

import { useEffect } from "react"

/**
 * Registra el service worker (public/sw.js) que hace que la app abra sin internet.
 * Solo en la app publicada: en desarrollo se quita, porque guardaría archivos viejos.
 */
export function RegistrarServiceWorker() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return

    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registros) => registros.forEach((registro) => void registro.unregister()))
        .catch(() => {})
      return
    }

    let cancelado = false
    const guardarLoCargado = () => {
      const urls = performance
        .getEntriesByType("resource")
        .map((entrada) => entrada.name)
        .filter((url) => url.startsWith(window.location.origin))
      navigator.serviceWorker.controller?.postMessage({
        tipo: "guardar",
        urls,
        pantalla: window.location.pathname,
      })
    }

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(() => navigator.serviceWorker.ready)
      .then(() => {
        if (cancelado) return
        if (navigator.serviceWorker.controller) guardarLoCargado()
        else navigator.serviceWorker.addEventListener("controllerchange", guardarLoCargado, { once: true })
      })
      .catch(() => {
        /* sin service worker la app funciona igual, solo que no abre sin señal */
      })

    return () => {
      cancelado = true
    }
  }, [])

  return null
}
