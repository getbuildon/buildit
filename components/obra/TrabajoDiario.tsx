"use client"

import { useQueryClient } from "@tanstack/react-query"
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns"
import { AlertTriangle, Calendar, CloudOff, Plus, X } from "lucide-react"
import { useMemo, useState } from "react"

import { Badge, type BadgeProps } from "@/library/atoms/badge/Badge"
import { Button } from "@/library/atoms/button/Button"
import { Icon } from "@/library/atoms/icon/Icon"
import { Skeleton } from "@/library/atoms/skeleton/Skeleton"
import { DatePicker } from "@/library/molecules/date-picker/DatePicker"
import { EmptyState } from "@/library/molecules/empty-state/EmptyState"
import { Field } from "@/library/molecules/field/Field"
import { Select, SelectItem } from "@/library/molecules/select/Select"

import { CargarAvance } from "@/components/obra/CargarAvance"
import { DetalleDeTrabajo } from "@/components/obra/DetalleDeTrabajo"
import type {
  TrabajoDiarioData,
  TrabajoDiarioTask,
  TrabajoDiarioTaskStatus,
} from "@/app/project/[projectId]/trabajo-diario/actions"
import { useToast } from "@/components/ui/toast"
import { descartarDeLaCola } from "@/lib/api/cola"
import type { Pendiente } from "@/lib/projects/colaDeTrabajo"
import { formatArgentinaTodayLabel } from "@/lib/datetime/argentinaDateTime"
import { invalidateProjectProgress } from "@/lib/project/invalidateProjectQueries"
import { getUnitDisplayLabel, getUnitDisplayTitle } from "@/lib/projects/cargarAvance"
import { getFloorDisplayLabel } from "@/lib/projects/floorLabels"

/**
 * Trabajo diario armado con la librería BuildOn: es «Pantallas/Obra/Trabajo diario · Como
 * hoy» del catálogo con los datos de verdad. Lista de trabajos cargados con filtros por
 * fecha, nivel y unidad; «Cargar nuevo avance» y el detalle de cada trabajo todavía usan
 * las piezas de antes (se migran aparte).
 */

const TODOS_LOS_NIVELES = "todos-los-niveles"
const TODAS_LAS_UNIDADES = "todas-las-unidades"

const TONO_DEL_ESTADO: Record<TrabajoDiarioTaskStatus, NonNullable<BadgeProps["tone"]>> = {
  Completado: "ok",
  "En Proceso": "caution",
  Bloqueado: "danger",
  Certificada: "info",
}

const ENVOLTORIO = "flex flex-col gap-group py-compact sm:gap-block sm:py-block"

/** Un trabajo cargado que no llegó al servidor por un problema de datos: se ve el motivo y se puede descartar. */
function NoSeEnvio({ pendiente }: { pendiente: Pendiente }) {
  const [seguro, setSeguro] = useState(false)
  return (
    <span className="flex flex-col gap-related rounded-compact bg-fn-danger-canvas px-snug py-compact text-meta text-fn-danger sm:flex-row sm:items-center sm:justify-between">
      <span>No se pudo enviar: {pendiente.error}</span>
      <Button
        variant={seguro ? "danger" : "ghost"}
        size="compact"
        onClick={() => (seguro ? void descartarDeLaCola(pendiente.envioId) : setSeguro(true))}
      >
        {seguro ? "Sí, descartar esta carga" : "Descartar"}
      </Button>
    </span>
  )
}

function FilaDeTrabajo({
  trabajo,
  pendiente,
  alAbrir,
}: {
  trabajo: TrabajoDiarioTask
  /** Cargado en el dispositivo y todavía no enviado. */
  pendiente?: Pendiente
  alAbrir: () => void
}) {
  const detalle = `trabajo-${trabajo.id}-detalle`
  const contenido = (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-related">
        <span className="flex flex-wrap items-center gap-x-compact gap-y-related">
          <span className="font-mono text-meta text-ink-muted">{trabajo.taskCode}</span>
          <span className="text-body text-ink">{trabajo.name}</span>
          <span className="text-meta text-ink-subtle">{trabajo.category}</span>
        </span>
        <span id={detalle} className="flex flex-wrap items-center gap-x-compact gap-y-0.5 text-meta text-ink-muted">
          <span>{trabajo.floorName}</span>
          <span aria-hidden>•</span>
          <span>{trabajo.unitLabel}</span>
          <span aria-hidden>•</span>
          <span>{trabajo.date}</span>
          <span className="sr-only">, {trabajo.status}</span>
          {pendiente && !pendiente.error ? <span className="sr-only">, sin enviar todavía</span> : null}
        </span>
      </span>
      <span aria-hidden className="flex flex-wrap items-center gap-compact self-start sm:self-center">
        {pendiente && !pendiente.error ? (
          <Badge tone="neutral" icon={CloudOff} className="rounded-compact">
            Sin enviar
          </Badge>
        ) : null}
        <Badge tone={TONO_DEL_ESTADO[trabajo.status]} className="rounded-compact">
          {trabajo.status}
        </Badge>
      </span>
    </>
  )
  const clases =
    "flex w-full flex-col gap-snug rounded-control border border-line p-3.5 text-left sm:flex-row sm:items-center sm:justify-between"

  // Lo que todavía no llegó al servidor no tiene detalle para abrir.
  if (pendiente && !pendiente.soloCertificacion) {
    return (
      <li className="flex flex-col gap-compact">
        <div className={clases}>{contenido}</div>
        {pendiente.error ? <NoSeEnvio pendiente={pendiente} /> : null}
      </li>
    )
  }
  return (
    <li>
      {/* El botón se nombra con la tarea; nivel, unidad, fecha y estado quedan como descripción. */}
      <button
        type="button"
        onClick={alAbrir}
        aria-describedby={detalle}
        className={`focus-ring motion-color cursor-pointer hover:border-line-strong hover:bg-surface-hover ${clases}`}
      >
        {contenido}
      </button>
    </li>
  )
}

function TrabajosCargados({
  data,
  pendientes,
  alAbrir,
}: {
  data: TrabajoDiarioData
  pendientes?: Map<string, Pendiente>
  alAbrir: (id: string) => void
}) {
  const [desde, setDesde] = useState<Date>(() => startOfMonth(new Date()))
  const [hasta, setHasta] = useState<Date>(() => endOfMonth(new Date()))
  const [nivel, setNivel] = useState(TODOS_LOS_NIVELES)
  const [unidad, setUnidad] = useState(TODAS_LAS_UNIDADES)

  const piso = data.floors.find((item) => item.id === nivel)
  const unidades = useMemo(
    () =>
      piso
        ? piso.units.map((u, i) => ({
            id: u.id,
            etiqueta: getUnitDisplayLabel(u, i + 1),
            titulo: getUnitDisplayTitle(u, piso, i + 1),
          }))
        : [],
    [piso],
  )

  const visibles = useMemo(() => {
    const inicio = startOfDay(desde)
    const fin = endOfDay(hasta)
    return data.tasks.filter((t) => {
      if (nivel !== TODOS_LOS_NIVELES && t.floorId !== nivel) return false
      if (unidad !== TODAS_LAS_UNIDADES && t.unitId !== unidad) return false
      if (t.occurredAt) {
        const fecha = new Date(t.occurredAt)
        if (fecha < inicio || fecha > fin) return false
      }
      return true
    })
  }, [data.tasks, desde, hasta, nivel, unidad])

  return (
    <section
      aria-labelledby="trabajos-cargados"
      className="rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block"
    >
      <h2 id="trabajos-cargados" className="mb-group text-section font-regular sm:mb-block">
        Trabajos Cargados
      </h2>
      <div className="mb-group grid grid-cols-1 gap-group sm:mb-block sm:grid-cols-2 md:grid-cols-4">
        <Field label="Desde">
          <DatePicker
            value={desde}
            max={hasta}
            onChange={(fecha) => {
              if (!fecha) return
              setDesde(fecha)
              if (fecha > hasta) setHasta(fecha)
            }}
          />
        </Field>
        <Field label="Hasta">
          <DatePicker
            value={hasta}
            min={desde}
            onChange={(fecha) => {
              if (!fecha) return
              setHasta(fecha)
              if (fecha < desde) setDesde(fecha)
            }}
          />
        </Field>
        <Field label="Nivel">
          <Select
            value={nivel}
            onValueChange={(valor) => {
              setNivel(valor)
              setUnidad(TODAS_LAS_UNIDADES)
            }}
          >
            <SelectItem value={TODOS_LOS_NIVELES}>Todos los niveles</SelectItem>
            {data.floors.map((item) => (
              <SelectItem key={item.id} value={item.id} title={item.name}>
                {getFloorDisplayLabel(item)}
              </SelectItem>
            ))}
          </Select>
        </Field>
        <Field label="Unidad" description={piso ? undefined : "Seleccioná un nivel primero"}>
          <Select
            value={piso ? unidad : undefined}
            onValueChange={setUnidad}
            disabled={!piso}
            placeholder="Todas las unidades"
          >
            <SelectItem value={TODAS_LAS_UNIDADES}>Todas las unidades</SelectItem>
            {unidades.map((u) => (
              <SelectItem key={u.id} value={u.id} title={u.titulo}>
                {u.etiqueta}
              </SelectItem>
            ))}
          </Select>
        </Field>
      </div>
      {visibles.length === 0 ? (
        <p
          role="status"
          className="rounded-control border border-dashed border-line px-group py-8 text-center text-body text-ink-muted"
        >
          No hay trabajos cargados para los filtros seleccionados.
        </p>
      ) : (
        <>
          <p role="status" className="sr-only">
            {visibles.length} {visibles.length === 1 ? "trabajo" : "trabajos"}
          </p>
          <ul className="flex flex-col gap-compact">
            {visibles.map((t) => (
              <FilaDeTrabajo key={t.id} trabajo={t} pendiente={pendientes?.get(t.id)} alAbrir={() => alAbrir(t.id)} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

export type TrabajoDiarioProps = {
  projectId: string
  data: TrabajoDiarioData
  /** Aviso arriba: sin conexión, no se pudo actualizar. */
  aviso?: string | null
  /** Lo cargado en el dispositivo que todavía no llegó al servidor (por id de avance). */
  pendientes?: Map<string, Pendiente>
}

export function TrabajoDiario({ projectId, data, aviso, pendientes }: TrabajoDiarioProps) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [cargando, setCargando] = useState(false)
  const [trabajoAbierto, setTrabajoAbierto] = useState<string | null>(null)
  const [detalleAbierto, setDetalleAbierto] = useState(false)

  const salirDeCargar = () => setCargando(false)

  return (
    <div className={ENVOLTORIO}>
      {aviso ? (
        <p role="status" className="rounded-control bg-canvas-sunken px-group py-snug text-meta text-ink-muted">
          {aviso}
        </p>
      ) : null}
      <div className="flex flex-col gap-group sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-compact">
          <h1 className="text-title">Trabajo Diario</h1>
          <p className="flex items-center gap-compact text-body text-ink-muted">
            <Icon icon={Calendar} />
            {formatArgentinaTodayLabel()}
          </p>
        </div>
        {cargando ? (
          <Button size="large" variant="outline" className="w-full sm:w-auto" onClick={salirDeCargar}>
            <Icon icon={X} /> Cancelar
          </Button>
        ) : (
          <Button size="large" className="w-full sm:w-auto" onClick={() => setCargando(true)}>
            <Icon icon={Plus} size="md" /> Cargar nuevo avance
          </Button>
        )}
      </div>

      {cargando ? (
        <CargarAvance
          projectId={projectId}
          floors={data.floors}
          rubroGroups={data.rubroGroups}
          assignmentsByUnit={data.assignmentsByUnit}
          loadedUnitTaskKeys={data.loadedUnitTaskKeys}
          unitTaskStatuses={data.unitTaskStatuses}
          onClose={salirDeCargar}
          onSaved={(resultado) => {
            salirDeCargar()
            if (resultado?.enCola) toast.success("Guardado en este dispositivo. Se envía solo cuando vuelva la señal.")
            else toast.success("Trabajo diario registrado exitosamente")
          }}
        />
      ) : (
        <TrabajosCargados
          data={data}
          pendientes={pendientes}
          alAbrir={(id) => {
            setTrabajoAbierto(id)
            setDetalleAbierto(true)
          }}
        />
      )}

      <DetalleDeTrabajo
        open={detalleAbierto}
        onOpenChange={setDetalleAbierto}
        projectId={projectId}
        entryId={trabajoAbierto}
        onEntryIdChange={setTrabajoAbierto}
        onSaved={() => void invalidateProjectProgress(queryClient, projectId)}
      />
    </div>
  )
}

/** Trabajo diario mientras carga: la misma pantalla con lugares vacíos. */
export function TrabajoDiarioCargando() {
  return (
    <div role="status" aria-busy className={ENVOLTORIO}>
      <span className="sr-only">Cargando el trabajo diario…</span>
      <div className="flex flex-col gap-group sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-compact">
          <Skeleton className="h-8 w-50" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-control-large w-full rounded-control sm:w-52" />
      </div>
      <div className="flex flex-col gap-group rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block">
        <Skeleton className="h-6 w-45" />
        <div className="grid grid-cols-1 gap-group sm:grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col gap-compact">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-control rounded-control" />
            </div>
          ))}
        </div>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-16 rounded-control" />
        ))}
      </div>
    </div>
  )
}

/** No se pudo cargar y no hay nada guardado para mostrar. */
export function TrabajoDiarioError({ reintentar }: { reintentar: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="No pudimos cargar el trabajo diario"
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
