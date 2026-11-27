"use client"

import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query"

import { guardarCopia, leerCopia } from "@/lib/api/disco"
import { ErrorDeApi } from "@/lib/api/navegador"

/**
 * Como useLectura, pero la lectura es una función de la app (una server action) en vez de
 * una ruta del servidor de datos. Para las pantallas de administración (Equipo, Clientes)
 * cuyo armado depende de varias fuentes (planes, catálogos) y no vale duplicarlo:
 *  1. pinta al instante lo guardado en el dispositivo;
 *  2. lee de nuevo y guarda la copia;
 *  3. sin señal queda lo guardado y la consulta marca error (status 0) para avisar.
 */
export function useLecturaConCopia<T>(opciones: {
  clave: readonly unknown[]
  leer: () => Promise<T>
  userId: string
  frescoMs: number
  habilitada?: boolean
}): UseQueryResult<T, ErrorDeApi> {
  const { clave, leer, userId, frescoMs, habilitada = true } = opciones
  const queryClient = useQueryClient()
  const claveDeDisco = clave.join("/")

  return useQuery<T, ErrorDeApi>({
    queryKey: clave,
    enabled: habilitada && Boolean(userId),
    staleTime: frescoMs,
    networkMode: "always",
    retry: (intentos, error) => error.status !== 0 && error.esDeRed && intentos < 1,
    refetchOnReconnect: "always",
    queryFn: async () => {
      const copia = await leerCopia<T>(userId, claveDeDisco)
      if (copia && queryClient.getQueryData(clave) === undefined) queryClient.setQueryData(clave, copia.datos)
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        throw new ErrorDeApi(0, "red", "Sin conexión.")
      }
      let datos: T
      try {
        datos = await leer()
      } catch (error) {
        // Una server action sin red falla con un error de fetch: es «sin señal».
        const sinRed = error instanceof TypeError || (typeof navigator !== "undefined" && navigator.onLine === false)
        throw new ErrorDeApi(sinRed ? 0 : 500, sinRed ? "red" : "error", error instanceof Error ? error.message : "Algo salió mal.")
      }
      void guardarCopia(userId, claveDeDisco, "local", datos)
      return datos
    },
  })
}
