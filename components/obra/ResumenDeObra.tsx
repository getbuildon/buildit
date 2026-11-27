"use client"

import Link from "next/link"
import type { MouseEvent } from "react"
import { AlertTriangle, CheckCircle2, ClipboardCheck, TrendingUp } from "lucide-react"

import { Button } from "@/library/atoms/button/Button"
import { Skeleton } from "@/library/atoms/skeleton/Skeleton"
import { formatPercent } from "@/library/foundations/format/format"
import { EmptyState } from "@/library/molecules/empty-state/EmptyState"
import { FloorItem, FloorList, FloorListSkeleton, UnitTile } from "@/library/organisms/floor-progress/FloorProgress"
import { MetricCard } from "@/library/organisms/metric/Metric"

import type { DashboardFloor, DashboardStats } from "@/app/project/[projectId]/configuracion/actions"
import { getUnitDisplayCode } from "@/lib/projects/floorLabels"
import { getUnitTypeIcon } from "@/lib/projects/unitTypeIcons"
import { getUnitDashboardLabel } from "@/lib/projects/unitTypes"
import { projectHref } from "@/lib/project/routes"
import { useProjectNavigation } from "@/components/project-shell/ProjectNavigationContext"

/**
 * El Dashboard de la obra armado con la librería BuildOn: es «Pantallas/Obra/Resumen ·
 * Como hoy» del catálogo con los datos de verdad. Mismo contenido que antes: título,
 * cuatro indicadores y el avance por piso (los dos primeros abiertos).
 */

type ResumenDeObraProps = {
  project: { id: string; name: string }
  dashboard: { floors: DashboardFloor[]; stats: DashboardStats }
  /** Aviso arriba del contenido: sin conexión, no se pudo actualizar. */
  aviso?: string | null
}

const CONTENIDO = "flex flex-col gap-block py-compact sm:gap-6 sm:py-block"

export function ResumenDeObra({ project, dashboard, aviso }: ResumenDeObraProps) {
  const { floors, stats } = dashboard
  const { navigate } = useProjectNavigation()
  const abrirUnidad = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    navigate(href)
  }
  return (
    <div className={CONTENIDO}>
      {aviso ? (
        <p role="status" className="rounded-control bg-canvas-sunken px-group py-snug text-meta text-ink-muted">
          {aviso}
        </p>
      ) : null}
      <div className="flex flex-col gap-group sm:gap-block">
        <div className="flex flex-col gap-compact">
          <h1 className="text-headline text-ink">{project.name}</h1>
          <p className="text-meta text-ink-muted sm:text-body">
            {stats.totalFloors} Niveles · {stats.totalUnits} Unidades · Progreso General:{" "}
            {formatPercent(stats.generalProgress)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-snug md:grid-cols-4">
          <MetricCard
            variant="tile"
            tone="info"
            icon={TrendingUp}
            value={formatPercent(stats.generalProgress)}
            label="Progreso General"
            hint="promedio de todas las unidades"
          />
          <MetricCard
            variant="tile"
            tone="ok"
            icon={CheckCircle2}
            value={`${stats.completedUnits}/${stats.totalUnits}`}
            label="Completo"
            hint="unidades terminadas"
          />
          <MetricCard
            variant="tile"
            tone="caution"
            icon={ClipboardCheck}
            value={String(stats.certifiedTasks)}
            label="Tareas certificadas"
            hint={`${stats.certifiedTasksThisWeek} esta semana`}
          />
          <MetricCard
            variant="tile"
            tone="danger"
            icon={AlertTriangle}
            value={stats.blockedTasks == null ? "—" : String(stats.blockedTasks)}
            label="Problemas"
            hint="tareas bloqueadas"
          />
        </div>
      </div>

      {floors.length > 0 ? (
        <section aria-labelledby="pisos" className="flex flex-col">
          <h2 id="pisos" className="sr-only">
            Avance por piso
          </h2>
          <FloorList type="multiple" defaultValue={floors.slice(0, 2).map((floor) => floor.id)}>
            {floors.map((floor) => (
              <FloorItem
                key={floor.id}
                value={floor.id}
                name={floor.name}
                progress={floor.progress}
                unitCount={floor.units.length}
                blockedCount={floor.units.filter((unit) => unit.hasBlockedTasks).length}
              >
                {floor.units.map((unit, index) => (
                  <UnitTile
                    key={unit.id}
                    code={getUnitDisplayCode(unit, index + 1)}
                    type={getUnitDashboardLabel({ unit_type: unit.unit_type, name: unit.name, room_count: unit.room_count })}
                    icon={getUnitTypeIcon(unit.unit_type)}
                    progress={unit.progress}
                    blocked={unit.hasBlockedTasks}
                    link={
                      <Link
                        href={projectHref(project.id, `unidades/${unit.id}`)}
                        onClick={abrirUnidad(projectHref(project.id, `unidades/${unit.id}`))}
                      />
                    }
                  />
                ))}
              </FloorItem>
            ))}
          </FloorList>
        </section>
      ) : null}
    </div>
  )
}

/** El Dashboard mientras carga: la misma pantalla con lugares vacíos. */
export function ResumenDeObraCargando() {
  return (
    <div role="status" aria-busy className={CONTENIDO}>
      <span className="sr-only">Cargando el resumen de la obra…</span>
      <div className="flex flex-col gap-group sm:gap-block">
        <div className="flex flex-col gap-compact">
          <Skeleton className="h-8 w-[min(100%,280px)] sm:h-9 lg:h-10" />
          <Skeleton className="h-4 w-[min(100%,320px)]" />
        </div>
        <div className="grid grid-cols-2 gap-snug md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="flex flex-col gap-group rounded-surface border border-line bg-canvas-raised p-snug shadow-hint sm:gap-block sm:px-group sm:py-4.25"
            >
              <div className="flex items-center gap-snug">
                <Skeleton className="size-7.75 rounded-control" />
                <Skeleton className="h-7 w-14" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-[72%]" />
                <Skeleton className="h-3.5 w-[58%]" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <FloorListSkeleton />
    </div>
  )
}

/** No se pudo cargar y no hay nada para mostrar. */
export function ResumenDeObraError({ reintentar }: { reintentar: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="No pudimos cargar el resumen"
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
