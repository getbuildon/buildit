"use client"

import { Building2, CalendarDays } from "lucide-react"
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react"

import { Badge } from "@/library/atoms/badge/Badge"
import { Icon } from "@/library/atoms/icon/Icon"
import { cn } from "@/library/lib/cn"
import { Dialog, DialogContent } from "@/library/molecules/dialog/Dialog"

import { getUnitDisplayCode } from "@/lib/projects/floorLabels"
import type { MiUnidadAssignedUnit } from "@/lib/projects/miUnidadTypes"
import { formatSquareMeters } from "@/lib/projects/structureSurfaceLimits"
import { normalizeUnitType } from "@/lib/projects/unitTypes"

/* Cuánto sigue el scroll al mouse (0 a 1), qué franja de cada borde lleva al extremo y
   desde cuántos píxeles de scroll se muestra el degradé de "hay más". */
const SUAVIDAD_SCROLL = 0.18
const BORDE_SCROLL = 0.14
const MARGEN_DEGRADE = 16

function tituloDeSeccion(cantidad: number, proyecto: string): string {
  const nombre = proyecto.trim()
  if (cantidad <= 1) return nombre ? `Mi unidad en ${nombre}` : "Mi unidad"
  return nombre ? `Mis unidades en ${nombre}` : "Mis unidades"
}

/** «3 ambientes · 72,5 m² · Nivel P1», con lo que haya cargado. */
function datosDeUnidad(unidad: MiUnidadAssignedUnit): string {
  const partes: string[] = []
  if (unidad.roomCount != null && unidad.roomCount > 0) {
    partes.push(unidad.roomCount === 1 ? "1 ambiente" : `${unidad.roomCount} ambientes`)
  }
  if (unidad.squareMeters != null && Number.isFinite(unidad.squareMeters) && unidad.squareMeters > 0) {
    partes.push(formatSquareMeters(unidad.squareMeters))
  }
  if (unidad.floorLabel) partes.push(`Nivel ${unidad.floorLabel}`)
  return partes.join(" · ")
}

const tipoDeUnidad = (unidad: MiUnidadAssignedUnit) => normalizeUnitType(unidad.unitType) ?? unidad.unitType

function Render({ unidad, grande }: { unidad: MiUnidadAssignedUnit; grande?: boolean }) {
  if (unidad.renderUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={unidad.renderUrl}
        alt={`Render de la unidad ${getUnitDisplayCode(unidad)}`}
        className="size-full object-cover"
      />
    )
  }
  return (
    <span className="grid size-full place-items-center bg-canvas-sunken text-ink-subtle">
      <Icon icon={Building2} size={grande ? "lg" : "md"} />
    </span>
  )
}

function DatosDeTarjeta({ unidad, entrega }: { unidad: MiUnidadAssignedUnit; entrega?: string | null }) {
  const tipo = tipoDeUnidad(unidad)
  const datos = datosDeUnidad(unidad)
  return (
    <span className="flex min-w-0 flex-col items-start gap-compact">
      <span className="flex items-center gap-compact">
        <span className="whitespace-nowrap text-reading font-medium text-ink">Unidad {getUnitDisplayCode(unidad)}</span>
        {tipo ? (
          <Badge tone="action" size="compact">
            {tipo}
          </Badge>
        ) : null}
      </span>
      {datos ? <span className="truncate text-body text-ink-muted">{datos}</span> : null}
      {/* En el celular la entrega no entra al costado: va como una línea más. */}
      {entrega ? <span className="text-meta text-ink-muted sm:hidden">Entrega estimada: {entrega}</span> : null}
    </span>
  )
}

const TARJETA =
  "focus-ring motion-color flex cursor-pointer overflow-hidden rounded-surface border border-line bg-canvas-raised text-left shadow-hint hover:border-line-strong"

/**
 * Con varias unidades la fila se corre sola al mover el mouse (hacia el lado donde está
 * el puntero) y muestra un degradé en el borde cuando queda algo escondido.
 */
function useScrollConMouse(activo: boolean, cantidad: number) {
  const contenedorRef = useRef<HTMLDivElement>(null)
  const destinoRef = useRef(0)
  const cuadroRef = useRef(0)
  const [degradeIzquierdo, setDegradeIzquierdo] = useState(false)
  const [degradeDerecho, setDegradeDerecho] = useState(false)

  const actualizarDegrades = useCallback(() => {
    const nodo = contenedorRef.current
    if (!nodo) return
    const maximo = Math.max(0, nodo.scrollWidth - nodo.clientWidth)
    const hayScroll = maximo > MARGEN_DEGRADE
    setDegradeIzquierdo(hayScroll && nodo.scrollLeft > MARGEN_DEGRADE)
    setDegradeDerecho(hayScroll && nodo.scrollLeft < maximo - MARGEN_DEGRADE)
  }, [])

  useEffect(() => {
    const nodo = contenedorRef.current
    if (!activo || !nodo) return
    actualizarDegrades()
    const observador = new ResizeObserver(actualizarDegrades)
    observador.observe(nodo)
    return () => {
      observador.disconnect()
      cancelAnimationFrame(cuadroRef.current)
      cuadroRef.current = 0
    }
  }, [activo, cantidad, actualizarDegrades])

  const alMoverMouse = (evento: MouseEvent<HTMLDivElement>) => {
    const nodo = contenedorRef.current
    if (!nodo || !activo) return
    const maximo = nodo.scrollWidth - nodo.clientWidth
    if (maximo <= 0) return

    const caja = nodo.getBoundingClientRect()
    const proporcion = Math.min(1, Math.max(0, (evento.clientX - caja.left) / caja.width))
    const tramoCentral = 1 - BORDE_SCROLL * 2
    if (proporcion <= BORDE_SCROLL) destinoRef.current = 0
    else if (proporcion >= 1 - BORDE_SCROLL) destinoRef.current = maximo
    else if (tramoCentral > 0) destinoRef.current = ((proporcion - BORDE_SCROLL) / tramoCentral) * maximo

    if (cuadroRef.current) return
    const paso = () => {
      const siguiente = nodo.scrollLeft + (destinoRef.current - nodo.scrollLeft) * SUAVIDAD_SCROLL
      nodo.scrollLeft = siguiente
      actualizarDegrades()
      if (Math.abs(destinoRef.current - siguiente) > 0.4) {
        cuadroRef.current = requestAnimationFrame(paso)
        return
      }
      nodo.scrollLeft = destinoRef.current
      cuadroRef.current = 0
      actualizarDegrades()
    }
    cuadroRef.current = requestAnimationFrame(paso)
  }

  return { contenedorRef, degradeIzquierdo, degradeDerecho, alMoverMouse, actualizarDegrades }
}

type MisUnidadesProps = {
  unidades: MiUnidadAssignedUnit[]
  proyecto: string
  /** «Abril 2027»; se muestra solo cuando el cliente tiene una unidad. */
  entrega: string | null
}

/**
 * Las unidades del cliente en la obra. Una sola: tarjeta ancha con la entrega estimada.
 * Varias: fila de tarjetas chicas que se desliza. Tocar cualquiera abre su render.
 */
export function MisUnidades({ unidades, proyecto, entrega }: MisUnidadesProps) {
  const varias = unidades.length > 1
  const [abiertaId, setAbiertaId] = useState<string | null>(null)
  const abierta = unidades.find((unidad) => unidad.id === abiertaId) ?? null
  const { contenedorRef, degradeIzquierdo, degradeDerecho, alMoverMouse, actualizarDegrades } = useScrollConMouse(
    varias,
    unidades.length,
  )

  if (unidades.length === 0) {
    return (
      <p className="rounded-surface border border-dashed border-line bg-canvas-raised px-block py-8 text-center text-body text-ink-muted shadow-hint">
        Todavía no tenés una unidad asignada en este proyecto.
      </p>
    )
  }

  const codigoAbierta = abierta ? getUnitDisplayCode(abierta) : ""
  const descripcionAbierta = abierta
    ? [tipoDeUnidad(abierta), datosDeUnidad(abierta)].filter(Boolean).join(" · ")
    : ""

  return (
    <section aria-labelledby="mi-unidad-titulo" className="flex flex-col gap-snug">
      <h2 id="mi-unidad-titulo" className="text-heading text-ink">
        {tituloDeSeccion(unidades.length, proyecto)}
      </h2>

      {varias ? (
        <div className="relative">
          <div
            ref={contenedorRef}
            onMouseMove={alMoverMouse}
            onScroll={actualizarDegrades}
            className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <ul className="flex w-max gap-compact p-compact">
              {unidades.map((unidad) => (
                <li key={unidad.id}>
                  <button type="button" onClick={() => setAbiertaId(unidad.id)} className={cn(TARJETA, "h-20.5 shrink-0")}>
                    <span className="h-full w-20 shrink-0 overflow-hidden">
                      <Render unidad={unidad} />
                    </span>
                    <span className="flex items-center px-4.5">
                      <DatosDeTarjeta unidad={unidad} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {degradeIzquierdo ? (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-compact left-0 w-5 bg-linear-to-r from-canvas to-transparent"
            />
          ) : null}
          {degradeDerecho ? (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-compact right-0 w-5 bg-linear-to-l from-canvas to-transparent"
            />
          ) : null}
        </div>
      ) : (
        <button type="button" onClick={() => setAbiertaId(unidades[0].id)} className={cn(TARJETA, "min-h-28 w-full")}>
          <span className="w-27.5 shrink-0 self-stretch overflow-hidden">
            <Render unidad={unidades[0]} grande />
          </span>
          <span className="flex min-w-0 flex-1 items-center justify-between gap-snug px-4.5 py-snug">
            <DatosDeTarjeta unidad={unidades[0]} entrega={entrega} />
            {entrega ? (
              <span className="hidden shrink-0 items-center gap-compact rounded-control border border-line bg-canvas px-3.25 py-2.25 sm:flex">
                <Icon icon={CalendarDays} size="xs" className="text-ink-muted" />
                <span className="flex flex-col">
                  <span className="text-micro font-regular text-ink-muted">Entrega estimada</span>
                  <span className="text-label text-ink">{entrega}</span>
                </span>
              </span>
            ) : null}
          </span>
        </button>
      )}

      <Dialog
        open={abierta != null}
        onOpenChange={(abrir) => {
          if (!abrir) setAbiertaId(null)
        }}
      >
        {abierta ? (
          <DialogContent size="wide" title={`Unidad ${codigoAbierta}`} description={descripcionAbierta || undefined}>
            <div className="aspect-1054/593 max-h-[min(593px,calc(90vh-140px))] w-full overflow-hidden rounded-control bg-canvas-sunken">
              {abierta.renderUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={abierta.renderUrl}
                  alt={`Render de la unidad ${codigoAbierta}`}
                  className="size-full object-cover"
                />
              ) : (
                <span className="grid size-full place-items-center text-ink-subtle">
                  <Icon icon={Building2} size="lg" />
                </span>
              )}
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </section>
  )
}
