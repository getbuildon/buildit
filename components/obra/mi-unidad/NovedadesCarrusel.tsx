"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

import { IconButton } from "@/library/atoms/button/IconButton"
import { cn } from "@/library/lib/cn"

import type { PortalNewsItem } from "@/lib/projects/portalClientesTypes"

/**
 * Carrusel de novedades del portal: foto a pantalla completa, título y texto encima.
 * Pasa de una a otra con un fundido (las animaciones «portal-news-*» viven en
 * app/globals.css). Con una sola novedad no hay flechas ni puntos para tocar.
 */
export function NovedadesCarrusel({ novedades }: { novedades: PortalNewsItem[] }) {
  const [activa, setActiva] = useState(0)

  if (novedades.length === 0) {
    return (
      <p className="grid h-70 place-items-center rounded-surface border border-line bg-canvas-raised px-block text-center text-body text-ink-muted shadow-hint sm:h-95">
        Todavía no hay novedades publicadas en el portal.
      </p>
    )
  }

  const indice = Math.min(activa, novedades.length - 1)
  const actual = novedades[indice]
  const variasNovedades = novedades.length > 1
  const irA = (siguiente: number) => setActiva((siguiente + novedades.length) % novedades.length)

  return (
    <div
      role="group"
      aria-roledescription="carrusel"
      aria-label="Novedades destacadas"
      className="relative h-70 overflow-hidden rounded-surface shadow-hint sm:h-95"
    >
      {novedades.map((novedad, i) => {
        const esActiva = i === indice
        return (
          <div
            key={novedad.id}
            aria-hidden={!esActiva}
            className={cn(
              "absolute inset-0 overflow-hidden transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]",
              esActiva ? "portal-news-slide-active z-2 opacity-100" : "pointer-events-none z-1 scale-[1.02] opacity-0",
            )}
          >
            {novedad.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={novedad.imageUrl}
                alt={esActiva ? novedad.title : ""}
                className="size-full object-cover will-change-transform"
              />
            ) : (
              <div className="portal-news-slide-fallback size-full bg-linear-135 from-earth to-earth-deep" />
            )}
          </div>
        )
      })}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-3 bg-linear-to-t from-veil-strong via-veil-soft/50 to-transparent"
      />

      {/* Encima de la foto el texto va siempre claro, también con la app en modo claro. */}
      <div data-theme="oscuro" className="relative z-4 flex h-full flex-col justify-end p-block text-on-earth">
        <div key={actual.id} aria-live="polite" aria-atomic className="portal-news-caption-enter">
          <p className="text-meta text-on-earth-muted">
            Novedad {indice + 1} de {novedades.length}
          </p>
          <h3 className="pt-1.5 font-display text-heading sm:text-title">{actual.title}</h3>
          {actual.description ? <p className="max-w-140 pt-compact text-body">{actual.description}</p> : null}
        </div>

        <div className="flex items-center gap-3.5 pt-5">
          {variasNovedades ? (
            <div className="flex items-center gap-1.5">
              {novedades.map((novedad, i) => (
                <button
                  key={novedad.id}
                  type="button"
                  aria-label={`Ir a la novedad ${i + 1}`}
                  aria-current={i === indice ? "true" : undefined}
                  onClick={() => irA(i)}
                  className="focus-ring grid size-6 cursor-pointer place-items-center rounded-pill"
                >
                  <span
                    className={cn(
                      "rounded-pill transition-all duration-300 ease-out",
                      i === indice ? "h-1.25 w-5 bg-action" : "size-1.25 bg-on-earth-muted",
                    )}
                  />
                </button>
              ))}
            </div>
          ) : (
            <span aria-hidden className="h-1.25 w-5 rounded-pill bg-action" />
          )}

          {variasNovedades ? (
            <div className="ml-auto flex gap-1.5">
              <IconButton
                icon={ChevronLeft}
                label="Novedad anterior"
                size="compact"
                tooltip={false}
                onClick={() => irA(indice - 1)}
                className="text-on-earth"
              />
              <IconButton
                icon={ChevronRight}
                label="Novedad siguiente"
                size="compact"
                tooltip={false}
                onClick={() => irA(indice + 1)}
                className="text-on-earth"
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
