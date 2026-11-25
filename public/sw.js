/*
 * Service worker de BuildOn: hace que la app abra sin internet.
 * Guarda SOLO la app (el HTML de las pantallas con sesión y sus archivos fijos),
 * nunca datos: los datos viven en IndexedDB (lib/api/disco.ts) y los maneja la app.
 *
 * Subir VERSION cuando cambie este archivo: al activarse borra las copias viejas.
 */
const VERSION = "1";
const CACHE_APP = `buildon-app-v${VERSION}`;
const CACHE_ARCHIVOS = `buildon-archivos-v${VERSION}`;

/** Pantallas que se pueden abrir sin señal. Su HTML es igual para todos (los datos llegan después). */
const PANTALLAS_SIN_SENAL = ["/home"];

/** Cuánto se espera a la red antes de abrir con lo guardado. */
const ESPERA_MS = 4000;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const nombres = await caches.keys();
      await Promise.all(
        nombres
          .filter((n) => n.startsWith("buildon-") && n !== CACHE_APP && n !== CACHE_ARCHIVOS)
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

function esArchivoFijo(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    /\.(?:png|svg|ico|webp|jpg|jpeg|woff2?|ttf)$/.test(url.pathname)
  );
}

/** Archivos con nombre único por versión: si está guardado, no cambió. */
async function archivoFijo(request) {
  const cache = await caches.open(CACHE_ARCHIVOS);
  const guardado = await cache.match(request);
  if (guardado) return guardado;
  const respuesta = await fetch(request);
  if (respuesta.ok) cache.put(request, respuesta.clone());
  return respuesta;
}

/** Pantalla: primero la red (para tener la última versión); sin red o si tarda, la guardada. */
async function pantalla(request) {
  const cache = await caches.open(CACHE_APP);
  const clave = new URL(request.url).pathname;
  const deLaRed = fetch(request).then((respuesta) => {
    const esHtml = (respuesta.headers.get("content-type") ?? "").includes("text/html");
    if (respuesta.ok && !respuesta.redirected && esHtml) cache.put(clave, respuesta.clone());
    return respuesta;
  });
  const guardada = await cache.match(clave);
  if (!guardada) return deLaRed;
  // Evita un rechazo sin manejar si la red falla después de haber respondido con la copia.
  deLaRed.catch(() => {});
  const tarde = new Promise((resolve) => setTimeout(() => resolve(null), ESPERA_MS));
  const respuesta = await Promise.race([deLaRed.catch(() => null), tarde]);
  return respuesta ?? guardada;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    if (PANTALLAS_SIN_SENAL.includes(url.pathname)) event.respondWith(pantalla(request));
    return;
  }
  if (esArchivoFijo(url)) event.respondWith(archivoFijo(request));
});

/**
 * La primera vez, la página cargó sus archivos antes de que este service worker
 * tomara el control: la página manda la lista y se guardan acá.
 */
self.addEventListener("message", (event) => {
  const datos = event.data;
  if (!datos || datos.tipo !== "guardar" || !Array.isArray(datos.urls)) return;
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_ARCHIVOS);
      await Promise.all(
        datos.urls
          .filter((u) => {
            try {
              const url = new URL(u);
              return url.origin === self.location.origin && esArchivoFijo(url);
            } catch {
              return false;
            }
          })
          .map(async (u) => {
            if (await cache.match(u)) return;
            try {
              const respuesta = await fetch(u);
              if (respuesta.ok) await cache.put(u, respuesta);
            } catch {
              /* se guardará la próxima vez */
            }
          }),
      );
      // La pantalla actual también, para poder abrirla sin señal desde ya.
      if (typeof datos.pantalla === "string" && PANTALLAS_SIN_SENAL.includes(datos.pantalla)) {
        try {
          const respuesta = await fetch(datos.pantalla, { credentials: "same-origin" });
          const esHtml = (respuesta.headers.get("content-type") ?? "").includes("text/html");
          if (respuesta.ok && !respuesta.redirected && esHtml) {
            await (await caches.open(CACHE_APP)).put(datos.pantalla, respuesta);
          }
        } catch {
          /* se guardará la próxima vez */
        }
      }
    })(),
  );
});
