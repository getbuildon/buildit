"use client"

import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  CircleEllipsis,
  ImageOff,
  Search,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@/library/atoms/badge/Badge"
import { Button } from "@/library/atoms/button/Button"
import { Icon } from "@/library/atoms/icon/Icon"
import { Progress } from "@/library/atoms/progress/Progress"
import { Skeleton } from "@/library/atoms/skeleton/Skeleton"
import { formatPercent } from "@/library/foundations/format/format"
import { Accordion, AccordionItem } from "@/library/molecules/accordion/Accordion"
import { Dialog, DialogContent } from "@/library/molecules/dialog/Dialog"
import { EmptyState } from "@/library/molecules/empty-state/EmptyState"
import { InputGroup } from "@/library/molecules/input-group/InputGroup"
import { Segmented } from "@/library/molecules/segmented/Segmented"

import type { UnitDetailData } from "@/app/project/[projectId]/unidades/actions"
import { DetalleDeTrabajo } from "@/components/obra/DetalleDeTrabajo"
import { useProjectNavigation } from "@/components/project-shell/ProjectNavigationContext"
import { invalidateProjectProgress } from "@/lib/project/invalidateProjectQueries"
import { projectHref } from "@/lib/project/routes"
import type { Pendiente } from "@/lib/projects/colaDeTrabajo"
import {
  matchesUnitTaskFilter,
  type UnitDetailTaskFilter,
  type UnitDetailTaskItem,
  type UnitDetailTaskStatus,
} from "@/lib/projects/unitDetailTasks"

/**
 * El detalle de una unidad armado con la librería BuildOn (la librería no tenía esta
 * pantalla: sigue el estilo de las otras de la obra). Mismo contenido que antes: nivel,
 * unidad y tipo, avance y tareas certificadas, el plano, y las tareas por grupo con
 * filtro por estado y búsqueda. Tocar una tarea abre su detalle.
 */

const TAREAS_POR_TANDA = 3
const TARJETA = "rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block"
const ENVOLTORIO = "flex flex-col gap-group py-compact sm:gap-block sm:py-block"

const ESTADO: Record<UnitDetailTaskStatus, { etiqueta: string; tono: "neutral" | "ok" | "info" | "caution" | "danger"; icono: LucideIcon }> = {
  pending: { etiqueta: "Sin iniciar", tono: "neutral", icono: CircleEllipsis },
  completed: { etiqueta: "Completada", tono: "ok", icono: CheckCircle2 },
  certified: { etiqueta: "Certificada", tono: "info", icono: ShieldCheck },
  in_progress: { etiqueta: "En Proceso", tono: "caution", icono: CircleDashed },
  blocked: { etiqueta: "Bloqueado", tono: "danger", icono: AlertTriangle },
}

const FILTROS: { value: UnitDetailTaskFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "completed", label: "Completadas" },
  { value: "certified", label: "Certificadas" },
  { value: "in_progress", label: "En Proceso" },
  { value: "blocked", label: "Bloqueadas" },
]

function filtrar(tareas: UnitDetailTaskItem[], filtro: UnitDetailTaskFilter, busqueda: string) {
  const q = busqueda.trim().toLowerCase()
  return tareas.filter(
    (t) =>
      matchesUnitTaskFilter(t.status, filtro) &&
      (!q || t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.rubroName.toLowerCase().includes(q)),
  )
}

function FilaDeTarea({ tarea, pendiente, alAbrir }: { tarea: UnitDetailTaskItem; pendiente?: Pendiente; alAbrir: (id: string) => void }) {
  const estado = ESTADO[tarea.status]
  const sinEnviar = pendiente && !pendiente.error
  const abrible = Boolean(tarea.entryId) && !(pendiente && !pendiente.soloCertificacion)
  const contenido = (
    <>
      <span className="w-12 shrink-0 font-mono text-meta text-ink-muted">{tarea.code}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-related">
        <span className="flex flex-wrap items-center gap-x-compact gap-y-related">
          <span className="text-body text-ink">{tarea.name}</span>
          <span className="text-meta text-ink-subtle">{tarea.rubroName}</span>
        </span>
        {tarea.authorName && tarea.formattedMeta ? (
          <span className="text-meta text-ink-muted">
            {tarea.authorName} • {tarea.formattedMeta}
          </span>
        ) : null}
      </span>
      <span className="flex shrink-0 flex-wrap items-center justify-end gap-compact">
        {sinEnviar ? (
          <Badge tone="neutral" className="rounded-compact">
            Sin enviar
          </Badge>
        ) : null}
        <Badge tone={estado.tono} icon={estado.icono} className="rounded-compact">
          {estado.etiqueta}
        </Badge>
      </span>
    </>
  )
  const clases = "flex w-full items-center gap-snug border-t border-line px-group py-snug text-left first:border-t-0"
  return (
    <li>
      {abrible ? (
        <button type="button" onClick={() => alAbrir(tarea.entryId!)} className={`focus-ring state-veil cursor-pointer ${clases}`}>
          {contenido}
        </button>
      ) : (
        <div className={clases}>{contenido}</div>
      )}
    </li>
  )
}

function Grupo({
  tareas,
  pendientes,
  alAbrir,
}: {
  tareas: UnitDetailTaskItem[]
  pendientes?: Map<string, Pendiente>
  alAbrir: (id: string) => void
}) {
  const [cuantas, setCuantas] = useState(TAREAS_POR_TANDA)
  return (
    <div className="-mx-group -mb-snug border-t border-line">
      <ul>
        {tareas.slice(0, cuantas).map((t) => (
          <FilaDeTarea key={t.id} tarea={t} pendiente={t.entryId ? pendientes?.get(t.entryId) : undefined} alAbrir={alAbrir} />
        ))}
      </ul>
      {tareas.length > cuantas ? (
        <div className="flex justify-center border-t border-line py-snug">
          <Button variant="ghost" size="compact" onClick={() => setCuantas((n) => n + TAREAS_POR_TANDA)}>
            Cargar más tareas <Icon icon={ChevronDown} size="xs" />
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export type DetalleDeUnidadProps = {
  projectId: string
  data: UnitDetailData
  pendientes?: Map<string, Pendiente>
  aviso?: string | null
}

export function DetalleDeUnidad({ projectId, data, pendientes, aviso }: DetalleDeUnidadProps) {
  const queryClient = useQueryClient()
  const { navigate } = useProjectNavigation()
  const [filtro, setFiltro] = useState<UnitDetailTaskFilter>("all")
  const [busqueda, setBusqueda] = useState("")
  const [abierta, setAbierta] = useState<string | null>(null)
  const [planoAbierto, setPlanoAbierto] = useState(false)
  const volver = projectHref(projectId)

  const grupos = useMemo(
    () => data.groups.map((g) => ({ ...g, visibles: filtrar(g.tasks, filtro, busqueda) })).filter((g) => g.visibles.length > 0),
    [data.groups, filtro, busqueda],
  )
  const plano = data.unit.planUrl

  return (
    <div className={ENVOLTORIO}>
      {aviso ? <p role="status" className="rounded-control bg-canvas-sunken px-group py-snug text-meta text-ink-muted">{aviso}</p> : null}
      <Button asChild variant="ghost" size="compact" className="self-start">
        <Link
          href={volver}
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey) return
            e.preventDefault()
            navigate(volver)
          }}
        >
          <Icon icon={ArrowLeft} size="xs" /> Volver al panel
        </Link>
      </Button>

      <div className="flex flex-col gap-group lg:flex-row">
        <section aria-labelledby="unidad" className={`flex min-w-0 flex-1 flex-col gap-group ${TARJETA}`}>
          <div className="flex flex-wrap items-start justify-between gap-group">
            <div className="min-w-0 flex-1">
              <p className="text-meta text-ink-muted">{data.floor.name}</p>
              <div className="mt-related flex flex-wrap items-center gap-snug">
                <h1 id="unidad" className="text-headline">
                  {data.unit.displayCode}
                </h1>
                <Badge tone="action" className="rounded-pill">
                  {data.unit.typeLabel}
                </Badge>
              </div>
            </div>
            <dl className="flex shrink-0 gap-chapter">
              {/* El término va primero (lo pide <dl>); se muestra abajo del dato. */}
              <div className="flex flex-col-reverse items-center gap-related">
                <dt className="text-meta text-ink-muted">progreso general</dt>
                <dd className="text-metric-compact">{formatPercent(data.progressPercent)}</dd>
              </div>
              <div className="flex flex-col-reverse items-center gap-related">
                <dt className="text-meta text-ink-muted">tareas certificadas</dt>
                <dd className="text-metric-compact">
                  {data.completedTasks}/{data.totalTasks}
                </dd>
              </div>
            </dl>
          </div>
          <div className="flex flex-col gap-compact">
            <p className="text-body">Avance de obra:</p>
            <Progress value={data.progressPercent} label={`Avance de ${data.unit.displayCode}`} tone="stage" />
            <div aria-hidden className="flex justify-between text-meta text-ink-muted">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </section>

        <div className={`flex shrink-0 items-center justify-center lg:size-45 ${TARJETA}`}>
          {plano ? (
            <button
              type="button"
              onClick={() => setPlanoAbierto(true)}
              aria-label={`Ver plano de ${data.unit.displayCode} en tamaño completo`}
              className="focus-ring cursor-zoom-in rounded-control hover:opacity-90"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- planos subidos por la empresa */}
              <img src={plano} alt={`Plano de ${data.unit.displayCode}`} className="size-32 object-contain" />
            </button>
          ) : (
            <div className="flex size-32 flex-col items-center justify-center gap-related rounded-control border border-dashed border-line bg-canvas-sunken text-meta text-ink-muted">
              <Icon icon={ImageOff} />
              Sin planta
            </div>
          )}
        </div>
      </div>

      <section aria-labelledby="tareas-unidad" className={`flex flex-col gap-group ${TARJETA}`}>
        <h2 id="tareas-unidad" className="text-section font-regular">
          Tareas de Construcción
        </h2>
        <div className="flex flex-col gap-snug lg:flex-row lg:items-center lg:justify-between">
          <Segmented size="compact" label="Mostrar tareas" value={filtro} onValueChange={(v) => setFiltro(v as UnitDetailTaskFilter)} options={FILTROS} />
          <InputGroup
            aria-label="Buscar tarea"
            start={<Icon icon={Search} className="text-ink-muted" />}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onClear={() => setBusqueda("")}
            placeholder="Buscar tarea por nombre o código…"
            groupClassName="w-full lg:max-w-80"
          />
        </div>
        {grupos.length === 0 ? (
          <p role="status" className="py-8 text-center text-body text-ink-muted">
            No hay tareas para mostrar con este filtro.
          </p>
        ) : (
          <Accordion type="multiple" defaultValue={[data.groups[0]?.id ?? ""]}>
            {grupos.map((g) => (
              <AccordionItem
                key={g.id}
                value={g.id}
                title={
                  <span className="flex items-center gap-snug">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-control bg-action text-label text-action-ink">{g.index}</span>
                    <span className="flex flex-col">
                      <span className="text-label">{g.name}</span>
                      <span className="text-meta font-regular text-ink-muted">
                        {g.tasks.length} {g.tasks.length === 1 ? "tarea" : "tareas"}
                      </span>
                    </span>
                  </span>
                }
              >
                <Grupo key={`${filtro}|${busqueda}`} tareas={g.visibles} pendientes={pendientes} alAbrir={setAbierta} />
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </section>

      <DetalleDeTrabajo
        open={abierta !== null}
        onOpenChange={(v) => !v && setAbierta(null)}
        projectId={projectId}
        entryId={abierta}
        onEntryIdChange={setAbierta}
        onSaved={() => void invalidateProjectProgress(queryClient, projectId)}
      />

      {plano ? (
        <Dialog open={planoAbierto} onOpenChange={setPlanoAbierto}>
          <DialogContent size="wide" title={`Plano de ${data.unit.displayCode}`} description={data.floor.name}>
            {/* eslint-disable-next-line @next/next/no-img-element -- planos subidos por la empresa */}
            <img src={plano} alt={`Plano de ${data.unit.displayCode}`} className="mx-auto max-h-[min(75vh,720px)] w-full rounded-control bg-canvas-sunken object-contain" />
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  )
}

export function DetalleDeUnidadCargando() {
  return (
    <div role="status" aria-busy className={ENVOLTORIO}>
      <span className="sr-only">Cargando la unidad…</span>
      <Skeleton className="h-8 w-36" />
      <div className="flex flex-col gap-group lg:flex-row">
        <Skeleton className="h-44 flex-1 rounded-surface" />
        <Skeleton className="h-44 rounded-surface lg:w-45" />
      </div>
      <Skeleton className="h-72 rounded-surface" />
    </div>
  )
}

export function DetalleDeUnidadError({ reintentar }: { reintentar: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="No pudimos cargar la unidad"
      description="Puede ser un problema de conexión, o la unidad ya no existe. Probá de nuevo en un momento."
      action={
        <Button variant="outline" onClick={reintentar}>
          Reintentar
        </Button>
      }
      className="min-h-[40vh] justify-center"
    />
  )
}
