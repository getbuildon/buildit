"use client"

import { AlertTriangle, Cloud } from "lucide-react"
import { useMemo, type ReactNode } from "react"

import { Button } from "@/library/atoms/button/Button"
import { Icon } from "@/library/atoms/icon/Icon"
import { Skeleton } from "@/library/atoms/skeleton/Skeleton"
import { EmptyState } from "@/library/molecules/empty-state/EmptyState"

import { HitosDeConstruccion } from "@/components/obra/mi-unidad/HitosDeConstruccion"
import { MisUnidades } from "@/components/obra/mi-unidad/MisUnidades"
import { NovedadesCarrusel } from "@/components/obra/mi-unidad/NovedadesCarrusel"
import type { MiUnidadPageData } from "@/lib/projects/miUnidadTypes"
import type { ProjectWeatherSnapshot } from "@/lib/weather/openMeteo"

/**
 * «Mi Unidad», lo que ve el comprador: saludo, clima de la obra, su unidad (o unidades),
 * las últimas novedades y los hitos de construcción. Es «Pantallas/Obra/Portal Clientes ·
 * Mi Unidad (cliente) · como hoy» del catálogo con los datos de verdad. Solo lectura.
 */

type MiUnidadProps = {
  projectId: string
  data: MiUnidadPageData
  greetingName: string
  /** Arriba de todo: el aviso de vista previa cuando el equipo la mira desde Portal Clientes. */
  topSlot?: ReactNode
}

const CONTENIDO = "flex flex-col gap-group py-compact sm:gap-block sm:py-block"

/** «2027-04-30» → «Abril 2027». */
function mesDeEntrega(fecha: string | null): string | null {
  if (!fecha) return null
  const dia = new Date(`${fecha}T12:00:00`)
  if (Number.isNaN(dia.getTime())) return null
  const mes = dia.toLocaleDateString("es-AR", { month: "long" })
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${dia.getFullYear()}`
}

function Clima({ clima }: { clima: ProjectWeatherSnapshot | null }) {
  if (!clima) return null
  return (
    <div className="flex shrink-0 items-center gap-block self-start rounded-control border border-line bg-canvas-raised px-4.25 py-3.25 shadow-hint sm:self-auto">
      <p className="whitespace-nowrap font-ui text-heading text-ink">
        {clima.temperatureC}°<span className="text-meta text-ink-muted">C</span>
      </p>
      <div className="flex flex-col text-meta">
        <span className="flex items-center gap-related whitespace-nowrap font-medium text-ink">
          <Icon icon={Cloud} size="xs" className="text-ink-muted" /> {clima.city}
        </span>
        <span className="whitespace-nowrap text-ink-muted">{clima.description}</span>
      </div>
    </div>
  )
}

export function MiUnidad({ data, greetingName, topSlot }: MiUnidadProps) {
  const entrega = useMemo(() => mesDeEntrega(data.projectEndDate), [data.projectEndDate])

  return (
    <div className={CONTENIDO}>
      {topSlot}
      <header className="flex flex-col gap-group sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-headline text-ink">
            Hola {greetingName} <span aria-hidden>👋</span>
          </h1>
          <p className="pt-related text-reading text-ink">Seguí el avance de obra en tiempo real.</p>
        </div>
        <Clima clima={data.weather} />
      </header>

      <MisUnidades unidades={data.units} proyecto={data.projectName} entrega={entrega} />

      <section aria-labelledby="novedades-titulo" className="flex flex-col gap-snug">
        <h2 id="novedades-titulo" className="text-heading text-ink">
          Últimas novedades
        </h2>
        <NovedadesCarrusel novedades={data.news} />
      </section>

      <section
        aria-labelledby="hitos-titulo"
        className="rounded-surface border border-line bg-canvas-raised p-block shadow-hint"
      >
        <h2 id="hitos-titulo" className="text-heading text-ink">
          Hitos de Construcción
        </h2>
        <div className="pt-group">
          <HitosDeConstruccion hitos={data.milestones} />
        </div>
      </section>
    </div>
  )
}

export function MiUnidadCargando() {
  return (
    <div role="status" aria-busy className={CONTENIDO}>
      <span className="sr-only">Cargando tu unidad…</span>
      <div className="flex flex-col gap-group sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-compact">
          <Skeleton className="h-9 w-[min(100%,260px)]" />
          <Skeleton className="h-5 w-64 max-w-full" />
        </div>
        <Skeleton className="h-16 w-44" />
      </div>
      <div className="flex flex-col gap-snug">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-28" />
      </div>
      <div className="flex flex-col gap-snug">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-70 sm:h-95" />
      </div>
      <div className="flex flex-col gap-group rounded-surface border border-line bg-canvas-raised p-block shadow-hint">
        <Skeleton className="h-6 w-52" />
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    </div>
  )
}

export function MiUnidadError({ reintentar }: { reintentar: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="No pudimos cargar tu unidad"
      description="Puede ser un problema de conexión. Probá de nuevo en un momento."
      action={
        <Button variant="outline" onClick={reintentar}>
          Reintentar
        </Button>
      }
      className="min-h-[40vh] justify-center"
    />
  )
}
