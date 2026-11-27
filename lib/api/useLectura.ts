"use client"

import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query"

import { guardarCopia, leerCopia } from "@/lib/api/disco"
import { ErrorDeApi, pedirALaApi } from "@/lib/api/navegador"

type ConVersion<T> = ({ sinCambios: true } | ({ sinCambios?: undefined } & T)) & { version: string }

type OpcionesDeLectura = {
  /** Clave de TanStack (lib/api/claves.ts). Un hecho, una clave. */
  clave: readonly unknown[]
  /** Ruta del servidor de datos, sin parámetros (`/arranque`). */
  ruta: string
  userId: string
  /** Cuánto vale lo leído antes de volver a preguntar. */
  frescoMs: number
  habilitada?: boolean
}

/**
 * Lectura con copia en el dispositivo:
 *  1. pinta al instante lo que quedó guardado (si hay);
 *  2. le pregunta al servidor mandando la versión guardada: si no cambió, el servidor
 *     contesta "sin cambios" y no manda nada;
 *  3. si cambió, actualiza la pantalla y la copia;
 *  4. sin señal, queda lo guardado y la consulta marca error para que la pantalla avise.
 *
 * `data` puede venir de la copia aunque `isError` sea true: la pantalla se dibuja con
 * `data` y usa `isError` solo para avisar o para ofrecer Reintentar cuando no hay nada.
 */
export function useLectura<T extends object>(opciones: OpcionesDeLectura): UseQueryResult<T, ErrorDeApi> {
  const { clave, ruta, userId, frescoMs, habilitada = true } = opciones
  const queryClient = useQueryClient()
  const claveDeDisco = clave.join("/")

  return useQuery<T, ErrorDeApi>({
    queryKey: clave,
    enabled: habilitada && Boolean(userId),
    staleTime: frescoMs,
    // En memoria media hora después de salir de la pantalla: volver muestra el contenido al
    // instante, sin el esqueleto de leer la copia del disco.
    gcTime: 30 * 60_000,
    // Corre aunque el navegador diga "sin conexión": hay que llegar a leer la copia.
    networkMode: "always",
    // Sin reintentos en lo que no se arregla solo (sesión, permisos, no existe); con espera creciente en el resto.
    retry: (intentos, error) => error.esDeRed && error.status !== 0 && intentos < 2,
    retryDelay: (intento) => Math.min(1_000 * 2 ** intento, 8_000),
    refetchOnReconnect: "always",
    queryFn: async ({ signal }) => {
      const copia = await leerCopia<T>(userId, claveDeDisco)
      if (copia && queryClient.getQueryData(clave) === undefined) {
        queryClient.setQueryData(clave, copia.datos)
      }
      const desde = copia ? `?desde=${encodeURIComponent(copia.version)}` : ""
      const respuesta = await pedirALaApi<ConVersion<T>>(`${ruta}${desde}`, { signal })
      if (respuesta.sinCambios) {
        if (copia) return copia.datos
        // El servidor dijo "sin cambios" pero la copia ya no está: se pide entero.
        const entera = await pedirALaApi<ConVersion<T>>(ruta, { signal })
        if (entera.sinCambios) throw new ErrorDeApi(502, "respuesta", "Algo salió mal. Probá de nuevo.")
        return guardar(entera)
      }
      return guardar(respuesta)

      function guardar(nueva: T & { version: string }): T {
        const { version, ...datos } = nueva
        void guardarCopia(userId, claveDeDisco, version, datos)
        return datos as unknown as T
      }
    },
  })
}
