"use client"

import { useQueryClient } from "@tanstack/react-query"
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns"
import { AlertTriangle, BadgeCheck, Clock, CloudOff, Eye, Info, ListTodo, MessageCircle, ShieldCheck } from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@/library/atoms/badge/Badge"
import { Button } from "@/library/atoms/button/Button"
import { IconButton } from "@/library/atoms/button/IconButton"
import { Checkbox } from "@/library/atoms/checkbox/Checkbox"
import { Icon } from "@/library/atoms/icon/Icon"
import { Textarea } from "@/library/atoms/input/Input"
import { Label } from "@/library/atoms/label/Label"
import { Skeleton } from "@/library/atoms/skeleton/Skeleton"
import { cn } from "@/library/lib/cn"
import { DatePicker } from "@/library/molecules/date-picker/DatePicker"
import { Dialog, DialogContent } from "@/library/molecules/dialog/Dialog"
import { EmptyState } from "@/library/molecules/empty-state/EmptyState"
import { Field } from "@/library/molecules/field/Field"
import { Segmented } from "@/library/molecules/segmented/Segmented"
import { Select, SelectItem } from "@/library/molecules/select/Select"

import type { CertificacionesData, CertificacionTask } from "@/app/project/[projectId]/certificaciones/actions"
import { DetalleDeTrabajo } from "@/components/obra/DetalleDeTrabajo"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContextSupabase"
import { formatArgentinaTaskDate, formatArgentinaTaskTime } from "@/lib/datetime/argentinaDateTime"
import { invalidateProjectProgress } from "@/lib/project/invalidateProjectQueries"
import { certificarAvances } from "@/lib/projects/certificar"
import type { Pendiente } from "@/lib/projects/colaDeTrabajo"

/**
 * Certificaciones armado con la librería BuildOn: es «Pantallas/Obra/Certificaciones ·
 * Como hoy» del catálogo con los datos de verdad. Pendientes y certificadas, filtros por
 * fecha y miembro, certificar una o varias (con notas) y ver el detalle de cada tarea.
 */

const TODOS = "todos"
const POR_PAGINA = 8
const ENVOLTORIO = "flex flex-col gap-group py-compact sm:gap-block sm:py-block"

type Estado = "pending" | "certified"

/** De quién es la tarea en el filtro: quien certificó (certificadas) o quien la cargó. */
const miembroDe = (t: CertificacionTask) => (t.status === "certified" ? (t.certifiedById ?? t.authorId) : t.authorId)
const fechaDe = (t: CertificacionTask) => (t.status === "certified" ? (t.certifiedAt ?? t.occurredAt) : t.occurredAt)

function espera(t: CertificacionTask) {
  const dias = t.daysPending
  if (t.isUrgent) return { tono: "danger" as const, larga: `${dias} d. (urgente)`, corta: `${dias}d urg.` }
  if (dias >= 4) return { tono: "caution" as const, larga: `${dias} días`, corta: `${dias}d` }
  return { tono: "neutral" as const, larga: dias === 1 ? "1 día" : `${dias} días`, corta: `${dias}d` }
}

function Recuadro({ icono, tono, valor, etiqueta }: { icono: typeof ListTodo; tono: "info" | "danger"; valor: number; etiqueta: string }) {
  return (
    <div className="flex flex-1 flex-col gap-snug rounded-control border border-line bg-canvas-raised px-group py-snug shadow-hint sm:flex-row sm:items-center sm:gap-group sm:py-4.25">
      <div className="flex items-center gap-snug">
        <span
          className={cn(
            "flex size-7.75 shrink-0 items-center justify-center rounded-control",
            tono === "info" ? "bg-fn-info-canvas text-fn-info" : "bg-fn-danger-canvas text-fn-danger",
          )}
        >
          <Icon icon={icono} />
        </span>
        <span className="text-metric-compact">{valor}</span>
      </div>
      <span className="text-body">{etiqueta}</span>
    </div>
  )
}

function Tarjeta({
  tarea,
  marcada,
  alMarcar,
  alCertificar,
  alVer,
  puedeCertificar,
  pendiente,
}: {
  tarea: CertificacionTask
  marcada: boolean
  alMarcar: (valor: boolean) => void
  alCertificar: () => void
  alVer: () => void
  puedeCertificar: boolean
  pendiente?: Pendiente
}) {
  const certificada = tarea.status === "certified"
  const nivel = espera(tarea)
  return (
    <li className="flex flex-col gap-compact rounded-control border border-line bg-canvas-raised p-snug sm:p-3.25">
      <div className="flex flex-col gap-snug sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-snug">
          {puedeCertificar && !certificada ? (
            <Checkbox
              checked={marcada}
              onCheckedChange={(v) => alMarcar(v === true)}
              aria-label={`Elegir ${tarea.taskName}, ${tarea.floorName} ${tarea.unitLabel}`}
              className="mt-0.5"
            />
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-compact">
            <div className="flex flex-col gap-related">
              <div className="flex flex-wrap items-center gap-x-compact gap-y-related">
                <span className="font-mono text-meta text-ink-muted">{tarea.taskCode}</span>
                <h3 className="text-body">{tarea.taskName}</h3>
                <span className="text-meta text-ink-muted">{tarea.rubroName}</span>
              </div>
              <p className="flex flex-wrap items-center gap-x-compact text-meta">
                <span>{tarea.floorName}</span>
                <span aria-hidden>•</span>
                <span>{tarea.unitLabel}</span>
                <span aria-hidden>•</span>
                <span>{certificada ? `Completado por ${tarea.authorName}` : tarea.authorName}</span>
                <span aria-hidden>•</span>
                <span>
                  {certificada
                    ? `${formatArgentinaTaskDate(tarea.occurredAt)} · ${formatArgentinaTaskTime(tarea.occurredAt)}`
                    : `${tarea.formattedDate} · ${tarea.formattedTime}`}
                </span>
              </p>
            </div>
            {tarea.comment ? (
              <p className="flex items-center gap-related text-meta text-ink-muted">
                <Icon icon={MessageCircle} className="shrink-0" />
                <span className="line-clamp-1">
                  <span className="sr-only">Comentario: </span>
                  {tarea.comment}
                </span>
              </p>
            ) : null}
          </div>
        </div>
        <div className={cn("flex items-center gap-compact", certificada ? "w-full sm:w-auto" : "justify-end")}>
          {pendiente && !pendiente.error ? (
            <Badge tone="neutral" icon={CloudOff} className="rounded-control">
              Sin enviar
            </Badge>
          ) : null}
          {certificada ? (
            <div className="flex min-w-0 flex-1 items-center gap-compact rounded-control bg-fn-info-canvas p-compact text-fn-info sm:w-40 sm:flex-none">
              <Icon icon={ShieldCheck} />
              <div className="min-w-0">
                <p className="truncate text-meta">
                  <span className="sr-only">Certificó </span>
                  {tarea.certifiedByName ?? tarea.authorName}
                </p>
                <p className="truncate text-micro font-regular">
                  {tarea.formattedDate} · {tarea.formattedTime}
                </p>
              </div>
            </div>
          ) : (
            <>
              <Badge tone={nivel.tono} icon={Clock} className="rounded-control">
                <span aria-hidden className="sm:hidden">
                  {nivel.corta}
                </span>
                <span className="max-sm:sr-only">
                  <span className="sr-only">Espera: </span>
                  {nivel.larga}
                </span>
              </Badge>
              {puedeCertificar ? (
                <Button size="compact" onClick={alCertificar}>
                  <Icon icon={BadgeCheck} size="xs" /> Certificar
                  <span className="sr-only"> {tarea.taskName}</span>
                </Button>
              ) : null}
            </>
          )}
          <IconButton icon={Eye} label={`Ver detalle de ${tarea.taskName}`} variant="ghost" size="compact" className="bg-canvas-track" onClick={alVer} />
        </div>
      </div>
      {pendiente?.error ? (
        <p role="alert" className="rounded-compact bg-fn-danger-canvas px-snug py-compact text-meta text-fn-danger">
          No se pudo certificar: {pendiente.error}
        </p>
      ) : null}
    </li>
  )
}

function DialogoDeCertificar({
  tareas,
  alCerrar,
  alConfirmar,
  enviando,
  error,
}: {
  tareas: CertificacionTask[]
  alCerrar: () => void
  alConfirmar: (nota: string) => void
  enviando: boolean
  error: string | null
}) {
  const [nota, setNota] = useState("")
  const una = tareas.length === 1 ? tareas[0] : undefined
  return (
    <Dialog open={tareas.length > 0} onOpenChange={(abierto) => !abierto && !enviando && alCerrar()}>
      <DialogContent
        title={una ? "Certificar Tarea" : "Certificar Tareas"}
        description="Revisá la información antes de confirmar. Esta acción impacta en el avance de obra y no se puede deshacer."
        footer={
          <>
            <Button variant="outline" disabled={enviando} onClick={alCerrar}>
              Cancelar
            </Button>
            <Button loading={enviando} loadingLabel="Certificando" onClick={() => alConfirmar(nota)}>
              <Icon icon={BadgeCheck} /> Confirmar Certificación
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-snug">
          <div className="rounded-control bg-canvas-sunken px-group py-snug">
            {una ? (
              <>
                <p className="text-label">{una.taskName}</p>
                <dl className="mt-related flex flex-wrap gap-x-snug gap-y-related text-meta">
                  {[
                    ["Nivel", una.floorName],
                    ["Unidad", una.unitLabel],
                    ["Rubro", una.rubroName],
                    ["Completado por", una.authorName],
                  ].map(([termino, valor]) => (
                    <div key={termino} className="flex gap-related">
                      <dt className="text-ink-muted">{termino}:</dt>
                      <dd className="font-medium">{valor}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <>
                <p className="text-label">Tareas seleccionadas</p>
                <ul className="mt-compact flex max-h-40 flex-col gap-related overflow-y-auto text-body">
                  {tareas.map((t) => (
                    <li key={t.entryId} className="flex items-center gap-compact">
                      <Icon icon={BadgeCheck} size="xs" className="text-action-text" />
                      <span className="truncate">
                        {t.taskName} ({t.floorName} - {t.unitLabel})
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <Field label={una ? "Notas de Certificación" : "Notas de Certificación (aplica a todas)"} optional>
            <Textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Observaciones sobre el trabajo verificado…" />
          </Field>
          {error ? (
            <p role="alert" className="text-body text-fn-danger">
              {error}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export type CertificacionesProps = {
  projectId: string
  data: CertificacionesData
  pendientes?: Map<string, Pendiente>
  aviso?: string | null
}

export function Certificaciones({ projectId, data, pendientes, aviso }: CertificacionesProps) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { tasks, members, canCertify } = data

  const [desde, setDesde] = useState<Date | undefined>(() => startOfMonth(new Date()))
  const [hasta, setHasta] = useState<Date | undefined>(() => endOfMonth(new Date()))
  const [miembro, setMiembro] = useState(TODOS)
  const [estado, setEstado] = useState<Estado>("pending")
  const [elegidas, setElegidas] = useState<Set<string>>(new Set())
  const [pagina, setPagina] = useState(1)
  const [aCertificar, setACertificar] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [abierta, setAbierta] = useState<string | null>(null)

  const pendientesDeCertificar = tasks.filter((t) => t.status === "pending")
  const urgentes = pendientesDeCertificar.filter((t) => t.isUrgent).length
  const certificadas = tasks.filter((t) => t.status === "certified").length

  const lista = useMemo(
    () =>
      tasks
        .filter((t) => {
          if (t.status !== estado) return false
          if (miembro !== TODOS && miembroDe(t) !== miembro) return false
          const fecha = new Date(fechaDe(t))
          if (desde && fecha < startOfDay(desde)) return false
          if (hasta && fecha > endOfDay(hasta)) return false
          return true
        })
        .sort((a, b) => new Date(fechaDe(a)).getTime() - new Date(fechaDe(b)).getTime()),
    [tasks, estado, miembro, desde, hasta],
  )
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA))
  const actual = Math.min(pagina, paginas)
  const visibles = lista.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA)
  const elegibles = lista.filter((t) => t.status === "pending").map((t) => t.entryId)
  const todas = elegibles.length > 0 && elegibles.every((id) => elegidas.has(id))
  const algunas = elegibles.some((id) => elegidas.has(id))
  const elegidasPendientes = [...elegidas].filter((id) => pendientesDeCertificar.some((t) => t.entryId === id))
  const tareasACertificar = aCertificar.map((id) => tasks.find((t) => t.entryId === id)).filter((t): t is CertificacionTask => Boolean(t))

  const confirmar = async (nota: string) => {
    if (!user) return
    setEnviando(true)
    setError(null)
    const resultado = await certificarAvances({ projectId, userId: user.id, avanceIds: aCertificar, nota })
    setEnviando(false)
    if (!resultado.ok) {
      setError(resultado.error)
      toast.error(resultado.error)
      return
    }
    void invalidateProjectProgress(queryClient, projectId)
    setElegidas((previas) => {
      const siguientes = new Set(previas)
      aCertificar.forEach((id) => siguientes.delete(id))
      return siguientes
    })
    setACertificar([])
    toast.success(
      resultado.enCola
        ? "Certificación guardada en este dispositivo. Se envía cuando vuelva la señal."
        : resultado.cantidad === 1
          ? "Tarea certificada exitosamente"
          : `${resultado.cantidad} tareas certificadas exitosamente`,
    )
  }

  return (
    <div className={ENVOLTORIO}>
      {aviso ? <p role="status" className="rounded-control bg-canvas-sunken px-group py-snug text-meta text-ink-muted">{aviso}</p> : null}
      <div className="flex flex-col gap-compact">
        <h1 className="text-headline">Certificación de Tareas</h1>
        <p className="text-body text-ink-muted">
          {estado === "pending"
            ? `${pendientesDeCertificar.length} ${pendientesDeCertificar.length === 1 ? "tarea pendiente" : "tareas pendientes"} de certificación`
            : `${certificadas} ${certificadas === 1 ? "tarea certificada" : "tareas certificadas"}`}
        </p>
      </div>

      {estado === "pending" ? (
        <div className="flex flex-col gap-snug sm:flex-row">
          <Recuadro icono={ListTodo} tono="info" valor={pendientesDeCertificar.length} etiqueta="Pendientes" />
          <Recuadro icono={Info} tono="danger" valor={urgentes} etiqueta="Urgentes (+7 días)" />
        </div>
      ) : null}

      <div className="flex flex-col gap-snug">
        <section aria-labelledby="lista-cert" className="flex flex-col gap-group rounded-surface border border-line bg-canvas-raised p-group shadow-hint">
          <h2 id="lista-cert" className="sr-only">
            {estado === "pending" ? "Tareas pendientes" : "Tareas certificadas"}
          </h2>
          <div className="grid grid-cols-1 gap-snug sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Desde">
              <DatePicker value={desde} max={hasta} onChange={(f) => (setDesde(f), setPagina(1))} size="compact" />
            </Field>
            <Field label="Hasta">
              <DatePicker value={hasta} min={desde} onChange={(f) => (setHasta(f), setPagina(1))} size="compact" />
            </Field>
            <Field label="Miembro">
              <Select value={miembro} onValueChange={(v) => (setMiembro(v), setPagina(1))} size="compact">
                <SelectItem value={TODOS}>Todos</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {m.name}
                  </SelectItem>
                ))}
              </Select>
            </Field>
            <div className="flex flex-col gap-compact">
              <p className="text-label">Estado</p>
              <Segmented
                size="compact"
                label="Estado"
                value={estado}
                onValueChange={(v) => {
                  setEstado(v as Estado)
                  setElegidas(new Set())
                  setPagina(1)
                }}
                options={[
                  { value: "pending", label: "Pendientes" },
                  { value: "certified", label: "Certificadas" },
                ]}
                className="w-full [&>*]:flex-1"
              />
            </div>
          </div>

          {estado === "pending" && canCertify ? (
            <div className="flex flex-col gap-snug sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-compact">
                <Checkbox
                  id="elegir-todas"
                  checked={todas ? true : algunas ? "indeterminate" : false}
                  disabled={elegibles.length === 0}
                  onCheckedChange={() =>
                    setElegidas((previas) => {
                      const siguientes = new Set(previas)
                      elegibles.forEach((id) => (todas ? siguientes.delete(id) : siguientes.add(id)))
                      return siguientes
                    })
                  }
                />
                <Label htmlFor="elegir-todas" variant="option">
                  Seleccionar todas
                </Label>
              </div>
              {elegidasPendientes.length > 0 ? (
                <Button size="compact" className="w-full sm:w-auto" onClick={() => (setError(null), setACertificar(elegidasPendientes))}>
                  <Icon icon={BadgeCheck} size="xs" /> Certificar ({elegidasPendientes.length})
                </Button>
              ) : null}
            </div>
          ) : null}

          {visibles.length === 0 ? (
            <p role="status" className="rounded-control border border-dashed border-line px-group py-10 text-center text-body text-ink-muted">
              {estado === "pending"
                ? "No hay tareas pendientes de certificación para los filtros seleccionados."
                : "No hay tareas certificadas para los filtros seleccionados."}
            </p>
          ) : (
            <ul className="flex flex-col gap-compact">
              {visibles.map((t) => (
                <Tarjeta
                  key={t.entryId}
                  tarea={t}
                  puedeCertificar={canCertify}
                  pendiente={pendientes?.get(t.entryId)}
                  marcada={elegidas.has(t.entryId)}
                  alMarcar={(valor) =>
                    setElegidas((previas) => {
                      const siguientes = new Set(previas)
                      if (valor) siguientes.add(t.entryId)
                      else siguientes.delete(t.entryId)
                      return siguientes
                    })
                  }
                  alCertificar={() => (setError(null), setACertificar([t.entryId]))}
                  alVer={() => setAbierta(t.entryId)}
                />
              ))}
            </ul>
          )}
        </section>

        {lista.length > 0 ? (
          <div className="flex flex-col items-center gap-snug sm:flex-row sm:justify-between">
            <p role="status" className="text-meta text-ink-muted">
              Mostrando {visibles.length} de {lista.length} {lista.length === 1 ? "tarea" : "tareas"}
            </p>
            {paginas > 1 ? (
              <nav aria-label="Páginas" className="flex flex-wrap items-center gap-related">
                <Button variant="outline" size="compact" disabled={actual === 1} onClick={() => setPagina(actual - 1)}>
                  Anterior
                </Button>
                {Array.from({ length: paginas }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-current={n === actual ? "page" : undefined}
                    aria-label={`Página ${n}`}
                    onClick={() => setPagina(n)}
                    className={cn(
                      "focus-ring motion-color grid size-8 cursor-pointer place-items-center rounded-control text-label",
                      n === actual ? "bg-action text-action-ink" : "border border-line-strong text-ink hover:bg-surface-hover",
                    )}
                  >
                    {n}
                  </button>
                ))}
                <Button variant="outline" size="compact" disabled={actual === paginas} onClick={() => setPagina(actual + 1)}>
                  Siguiente
                </Button>
              </nav>
            ) : null}
          </div>
        ) : null}
      </div>

      <DialogoDeCertificar
        key={aCertificar.join(",")}
        tareas={tareasACertificar}
        alCerrar={() => setACertificar([])}
        alConfirmar={(nota) => void confirmar(nota)}
        enviando={enviando}
        error={error}
      />

      <DetalleDeTrabajo
        // Lo que todavía no llegó al servidor no tiene detalle (salvo una certificación pendiente).
        open={abierta !== null && !(pendientes?.get(abierta) && !pendientes.get(abierta)?.soloCertificacion)}
        onOpenChange={(v) => !v && setAbierta(null)}
        projectId={projectId}
        entryId={abierta}
        onEntryIdChange={setAbierta}
        onSaved={() => void invalidateProjectProgress(queryClient, projectId)}
      />
    </div>
  )
}

/** Certificaciones mientras carga. */
export function CertificacionesCargando() {
  return (
    <div role="status" aria-busy className={ENVOLTORIO}>
      <span className="sr-only">Cargando las certificaciones…</span>
      <div className="flex flex-col gap-compact">
        <Skeleton className="h-8 w-[min(100%,280px)]" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="flex flex-col gap-snug sm:flex-row">
        <Skeleton className="h-16 flex-1" />
        <Skeleton className="h-16 flex-1" />
      </div>
      <div className="flex flex-col gap-group rounded-surface border border-line bg-canvas-raised p-group shadow-hint">
        <div className="grid grid-cols-1 gap-snug sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  )
}

export function CertificacionesError({ reintentar }: { reintentar: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="No pudimos cargar las certificaciones"
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
