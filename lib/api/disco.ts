"use client"

/**
 * Copia en el dispositivo (IndexedDB) de lo que la app leyó del servidor.
 * Es una COPIA, nunca el origen: sirve para pintar al instante y para trabajar sin
 * señal; el servidor siempre manda. Todo falla en silencio: si el disco no anda,
 * la app sigue funcionando con la red.
 */
const BASE = "buildon"
const VERSION = 1
const TIENDA_LECTURA = "lectura"

/** En iPhone (WebKit) IndexedDB a veces no contesta nunca: no se espera más que esto. */
const ABRIR_MS = 4_000

export type Copia<T> = {
  /** Versión que dio el servidor: se le manda de vuelta para saber si cambió. */
  version: string
  datos: T
  /** Cuándo se guardó (hora del dispositivo, solo informativa). */
  guardado: number
}

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Sin disco local."))
      return
    }
    let listo = false
    const corte = setTimeout(() => {
      listo = true
      reject(new Error("El disco local no contestó."))
    }, ABRIR_MS)
    const pedido = indexedDB.open(BASE, VERSION)
    pedido.onupgradeneeded = () => {
      const db = pedido.result
      if (!db.objectStoreNames.contains(TIENDA_LECTURA)) db.createObjectStore(TIENDA_LECTURA)
    }
    pedido.onsuccess = () => {
      const db = pedido.result
      if (listo) {
        db.close()
        return
      }
      listo = true
      clearTimeout(corte)
      db.onversionchange = () => db.close()
      resolve(db)
    }
    const fallar = (motivo: string) => () => {
      if (listo) return
      listo = true
      clearTimeout(corte)
      reject(pedido.error ?? new Error(motivo))
    }
    pedido.onerror = fallar("No se pudo abrir el disco local.")
    pedido.onblocked = fallar("El disco local está bloqueado por otra pestaña.")
  })
}

function enTienda<T>(
  modo: IDBTransactionMode,
  trabajo: (tienda: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return abrir().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        try {
          const pedido = trabajo(db.transaction(TIENDA_LECTURA, modo).objectStore(TIENDA_LECTURA))
          pedido.onsuccess = () => resolve(pedido.result)
          pedido.onerror = () => reject(pedido.error ?? new Error("Falló el disco local."))
        } catch (error) {
          reject(error)
        } finally {
          db.close()
        }
      }),
  )
}

/** La clave lleva a la persona adelante: en un dispositivo compartido nadie ve la copia de otro. */
function claveDe(userId: string, clave: string): string {
  return `${userId}|${clave}`
}

export async function leerCopia<T>(userId: string, clave: string): Promise<Copia<T> | null> {
  try {
    const valor = await enTienda<Copia<T> | undefined>("readonly", (t) => t.get(claveDe(userId, clave)))
    return valor && typeof valor.version === "string" ? valor : null
  } catch {
    return null
  }
}

export async function guardarCopia<T>(userId: string, clave: string, version: string, datos: T): Promise<void> {
  try {
    const copia: Copia<T> = { version, datos, guardado: Date.now() }
    await enTienda("readwrite", (t) => t.put(copia, claveDe(userId, clave)))
  } catch {
    /* sin disco: la app sigue con la red */
  }
}

/** Al cerrar sesión: no queda nada de la persona en el dispositivo. */
export async function borrarCopias(): Promise<void> {
  try {
    await enTienda("readwrite", (t) => t.clear())
  } catch {
    /* nada que borrar */
  }
}
