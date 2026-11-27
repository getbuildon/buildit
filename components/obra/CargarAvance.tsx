"use client"

import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  CircleEllipsis,
  House,
  MapPin,
  X,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import { Badge } from "@/library/atoms/badge/Badge"
import { Button } from "@/library/atoms/button/Button"
import { IconButton } from "@/library/atoms/button/IconButton"
import { Checkbox } from "@/library/atoms/checkbox/Checkbox"
import { Icon } from "@/library/atoms/icon/Icon"
import { Textarea } from "@/library/atoms/input/Input"
import { cn } from "@/library/lib/cn"
import { ConfirmDialog } from "@/library/molecules/confirm-dialog/ConfirmDialog"
import { Dialog, DialogContent } from "@/library/molecules/dialog/Dialog"
import { Field } from "@/library/molecules/field/Field"
import { FileField } from "@/library/molecules/file-field/FileField"
import { Notice } from "@/library/molecules/notice/Notice"
import { Select, SelectItem } from "@/library/molecules/select/Select"

import {
  registerProgressAttachments,
  saveCargarAvance,
  type TrabajoDiarioFloor,
  type TrabajoDiarioRubroGroup,
} from "@/app/project/[projectId]/trabajo-diario/actions"
import { useAuth } from "@/context/AuthContextSupabase"
import { encolarAvance, type EstadoDeTarea } from "@/lib/api/cola"
import { apiDisponible } from "@/lib/api/navegador"
import { invalidateProjectProgress } from "@/lib/project/invalidateProjectQueries"
import {
  analyzeMultiUnitTaskMismatch,
  buildLoadedUnitTaskKeySet,
  CARGAR_AVANCE_STATUS_LABELS,
  createEmptyTaskDraft,
  getAssignedSelectedUnitIdsForTask,
  getDefaultTargetUnitIdsForTask,
  getRubrosForUnits,
  getTasksForRubroAndUnits,
  getUnitDisplayLabel,
  getUnitDisplayTitle,
  getUnitTaskKey,
  hasTaskDraftContent,
  isUnitTaskLoaded,
  revokeAllTaskDrafts,
  sortUnitIdsByDisplayOrder,
  type CargarAvancePhotoDraft,
  type CargarAvanceTaskDraft,
  type CargarAvanceTaskStatus,
} from "@/lib/projects/cargarAvance"
import { getFloorDisplayLabel } from "@/lib/projects/floorLabels"
import { buildAttachmentsForTaskPhotos } from "@/lib/progress/linkProgressPhotos.client"
import { MAX_PHOTOS_PER_TASK } from "@/lib/progress/progressPhotoConfig"
import { compressProgressPhoto } from "@/lib/progress/progressPhotos.client"

/**
 * «Cargar nuevo avance» armado con la librería BuildOn: es «Pantallas/Obra/Cargar avance
 * · Como hoy» del catálogo con los datos de verdad. Mismas reglas que antes: elegir nivel,
 * unidades y rubro; en cada tarea, a qué unidades aplicar, el estado, comentarios y fotos;
 * revisar y confirmar.
 *
 * Guardar: con el servidor de datos, va a la cola del dispositivo (sale con señal, o
 * cuando vuelva); sin él, por las server actions de siempre.
 */

const TONO = { pending: "neutral", in_progress: "caution", completed: "ok", blocked: "danger" } as const
const ICONO: Record<CargarAvanceTaskStatus, LucideIcon> = {
  pending: CircleEllipsis,
  in_progress: CircleDashed,
  completed: CheckCircle2,
  blocked: AlertCircle,
}
const COLOR_DEL_ICONO: Record<CargarAvanceTaskStatus, string> = {
  pending: "text-ink-muted",
  in_progress: "text-fn-caution",
  completed: "text-fn-ok",
  blocked: "text-fn-danger",
}
const OPCIONES_DE_ESTADO: { estado: EstadoDeTarea; activo: string }[] = [
  { estado: "completed", activo: "border-fn-ok-solid bg-fn-ok-canvas text-fn-ok" },
  { estado: "in_progress", activo: "border-fn-caution-solid bg-fn-caution-canvas text-fn-caution" },
  { estado: "blocked", activo: "border-fn-danger-solid bg-fn-danger-canvas text-fn-danger" },
]
const ETIQUETA = CARGAR_AVANCE_STATUS_LABELS
const TARJETA = "rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block"

/* ------------------------------------------------------------------ Piezas */

function TarjetaDeEleccion({
  id,
  icono,
  titulo,
  descripcion,
  children,
}: {
  id: string
  icono: LucideIcon
  titulo: string
  descripcion?: string
  children: ReactNode
}) {
  return (
    <div role="group" aria-labelledby={id} className={TARJETA}>
      <div className="mb-snug flex flex-col gap-related">
        <div className="flex items-center gap-compact">
          <Icon icon={icono} className="text-ink-muted" />
          <h3 id={id} className="text-reading">
            {titulo}
          </h3>
        </div>
        {descripcion ? <p className="text-body text-ink-muted">{descripcion}</p> : null}
      </div>
      {children}
    </div>
  )
}

/** El nombre visible es el corto («PB») y el lector de pantalla suma el completo. */
function Pastilla({
  etiqueta,
  titulo,
  elegida,
  alTocar,
}: {
  etiqueta: string
  titulo: string
  elegida: boolean
  alTocar: () => void
}) {
  const sumaTitulo = !titulo.includes(etiqueta)
  return (
    <button
      type="button"
      onClick={alTocar}
      aria-pressed={elegida}
      title={sumaTitulo ? titulo : undefined}
      className={cn(
        "focus-ring motion-color flex min-h-11 min-w-[calc(50%-4px)] flex-1 cursor-pointer items-center justify-center rounded-control px-snug text-center text-body sm:min-w-22 sm:basis-0",
        elegida ? "bg-action font-medium text-action-ink" : "bg-canvas-track text-ink hover:bg-surface-pressed",
      )}
    >
      <span className="truncate">{etiqueta}</span>
      {sumaTitulo ? <span className="sr-only">, {titulo}</span> : null}
    </button>
  )
}

function UnidadDeLaTarea({
  etiqueta,
  estado,
  marcada,
  deshabilitada,
  alCambiar,
}: {
  etiqueta: string
  estado: CargarAvanceTaskStatus
  marcada: boolean
  deshabilitada: boolean
  alCambiar: (marcada: boolean) => void
}) {
  return (
    <label
      className={cn(
        "motion-color inline-flex items-center gap-compact rounded-control border px-2.5 py-1.5",
        marcada && !deshabilitada ? "border-line-strong bg-canvas-sunken" : "border-line bg-canvas-raised",
        deshabilitada ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-line-strong",
      )}
    >
      <Checkbox checked={marcada} disabled={deshabilitada} onCheckedChange={(v) => alCambiar(v === true)} />
      <span className="text-label">{etiqueta}</span>
      <span aria-hidden className="h-3 w-px bg-line" />
      <Badge tone={TONO[estado]} size="compact" className="rounded-compact">
        <span className="sr-only">estado actual: </span>
        {ETIQUETA[estado]}
      </Badge>
    </label>
  )
}

/** Fotos de una tarea: se comprimen al elegirlas (como antes) y se ven en miniatura. */
function FotosDeLaTarea({
  fotos,
  alCambiar,
}: {
  fotos: CargarAvancePhotoDraft[]
  alCambiar: (fotos: CargarAvancePhotoDraft[]) => void
}) {
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const agregar = async (archivos: File[]) => {
    setError(null)
    if (fotos.length + archivos.length > MAX_PHOTOS_PER_TASK) {
      setError(`Podés agregar hasta ${MAX_PHOTOS_PER_TASK} fotos por tarea.`)
      return
    }
    setProcesando(true)
    try {
      const nuevas = [...fotos]
      for (const archivo of archivos) {
        if (!archivo.type.startsWith("image/")) throw new Error(`«${archivo.name}» no es una imagen.`)
        const comprimida = await compressProgressPhoto(archivo)
        nuevas.push({
          id: crypto.randomUUID(),
          file: comprimida,
          previewUrl: URL.createObjectURL(comprimida),
          fileName: archivo.name,
          fileSize: comprimida.size,
          fileType: comprimida.type || "image/webp",
        })
      }
      alCambiar(nuevas)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudieron procesar las fotos.")
    } finally {
      setProcesando(false)
    }
  }

  return (
    <Field label="Fotos" optional error={error ?? undefined}>
      <FileField
        files={[
          ...fotos.map((f) => ({ id: f.id, name: f.fileName, previewUrl: f.previewUrl })),
          ...(procesando ? [{ id: "procesando", name: "Preparando foto…", status: "uploading" as const }] : []),
        ]}
        onAdd={(archivos) => void agregar(archivos)}
        onRemove={(id) => {
          const foto = fotos.find((f) => f.id === id)
          if (foto) URL.revokeObjectURL(foto.previewUrl)
          alCambiar(fotos.filter((f) => f.id !== id))
        }}
        accept="image/*"
        acceptLabel="JPG, PNG o HEIC"
        multiple
        maxFiles={MAX_PHOTOS_PER_TASK}
        capture="environment"
        disabled={procesando}
      />
    </Field>
  )
}

/* ------------------------------------------------------------------ Pantalla */

export type CargarAvanceProps = {
  projectId: string
  floors: TrabajoDiarioFloor[]
  rubroGroups: TrabajoDiarioRubroGroup[]
  assignmentsByUnit: Record<string, string[]>
  loadedUnitTaskKeys: string[]
  unitTaskStatuses: Record<string, CargarAvanceTaskStatus>
  onClose: () => void
  /** enCola: quedó guardado en el dispositivo y sale cuando haya señal. */
  onSaved: (resultado?: { enCola: boolean }) => void
}

export function CargarAvance({
  projectId,
  floors,
  rubroGroups,
  assignmentsByUnit,
  loadedUnitTaskKeys,
  unitTaskStatuses,
  onClose,
  onSaved,
}: CargarAvanceProps) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [pisoId, setPisoId] = useState<string | null>(null)
  const [unidades, setUnidades] = useState<string[]>([])
  const [rubroId, setRubroId] = useState<string | null>(null)
  const [rubroPendiente, setRubroPendiente] = useState<string | null>(null)
  const [abiertas, setAbiertas] = useState<string[]>([])
  const [borradores, setBorradores] = useState<Record<string, CargarAvanceTaskDraft>>({})
  const [revisando, setRevisando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [estadoDelGuardado, setEstadoDelGuardado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const piso = floors.find((f) => f.id === pisoId) ?? null
  const cargadas = useMemo(() => buildLoadedUnitTaskKeySet(loadedUnitTaskKeys), [loadedUnitTaskKeys])
  const ordenDeUnidades = useMemo(() => (piso ? piso.units.map((u) => u.id) : []), [piso])
  const etiquetaDeUnidad = useMemo(() => {
    const mapa: Record<string, string> = {}
    piso?.units.forEach((u, i) => (mapa[u.id] = getUnitDisplayLabel(u, i + 1)))
    return mapa
  }, [piso])

  const rubros = useMemo(
    () => getRubrosForUnits(unidades, rubroGroups, assignmentsByUnit, cargadas),
    [unidades, rubroGroups, assignmentsByUnit, cargadas],
  )
  // Si el rubro elegido ya no corresponde a las unidades marcadas, se deja de mostrar.
  const rubroVigente = rubroId && rubros.some((r) => r.id === rubroId) ? rubroId : null
  const rubro = rubros.find((r) => r.id === rubroVigente) ?? null
  const tareas = useMemo(
    () =>
      rubroVigente && unidades.length > 0
        ? getTasksForRubroAndUnits(rubroVigente, rubroGroups, unidades, assignmentsByUnit, cargadas)
        : [],
    [rubroVigente, rubroGroups, unidades, assignmentsByUnit, cargadas],
  )
  const noCoinciden = useMemo(
    () =>
      rubroVigente && unidades.length > 1
        ? analyzeMultiUnitTaskMismatch(rubroVigente, rubroGroups, unidades, etiquetaDeUnidad, assignmentsByUnit, cargadas)
            .shouldShowDisclaimer
        : false,
    [rubroVigente, rubroGroups, unidades, etiquetaDeUnidad, assignmentsByUnit, cargadas],
  )

  // El borrador de cada tarea arranca con las unidades donde se puede cargar.
  const borradorDe = (tareaId: string): CargarAvanceTaskDraft =>
    borradores[tareaId] ?? createEmptyTaskDraft(getDefaultTargetUnitIdsForTask(tareaId, unidades, assignmentsByUnit, cargadas))
  const actualizar = (tareaId: string, cambio: Partial<CargarAvanceTaskDraft>) =>
    setBorradores((actual) => ({ ...actual, [tareaId]: { ...borradorDe(tareaId), ...cambio } }))

  const conContenido = tareas.filter((t) => borradores[t.id] && hasTaskDraftContent(borradores[t.id]!))
  const puedeGuardar = conContenido.length > 0

  // Al salir del formulario se liberan las vistas previas de las fotos (solo entonces:
  // mientras tanto las mismas fotos siguen en uso).
  const ultimos = useRef(borradores)
  useEffect(() => {
    ultimos.current = borradores
  }, [borradores])
  useEffect(() => () => revokeAllTaskDrafts(ultimos.current), [])

  const limpiarTareas = () => {
    setBorradores({})
    setAbiertas([])
    setError(null)
  }
  const elegirPiso = (id: string) => {
    setPisoId(id)
    setUnidades([])
    setRubroId(null)
    limpiarTareas()
  }
  const alternarUnidad = (id: string) => {
    setUnidades((actual) => (actual.includes(id) ? actual.filter((u) => u !== id) : [...actual, id]))
    limpiarTareas()
  }
  const pedirRubro = (id: string) => {
    if (id === rubroVigente) return
    if (puedeGuardar) setRubroPendiente(id)
    else {
      setRubroId(id)
      limpiarTareas()
    }
  }

  const terminar = (resultado?: { enCola: boolean }) => {
    setGuardando(false)
    setEstadoDelGuardado(null)
    setRevisando(false)
    setBorradores({})
    onSaved(resultado)
  }

  /** Con el servidor de datos: a la cola del dispositivo, con ids propios (nunca duplica). */
  const guardarEnCola = async () => {
    if (!pisoId || !rubroVigente || !user) return
    const conEstado = conContenido
      .map((t) => ({ t, b: borradores[t.id]! }))
      .filter(({ b }) => b.taskStatus !== "pending")
    if (conEstado.length === 0) return setError("Seleccioná un estado en al menos una tarea.")
    if (conEstado.some(({ b }) => b.targetUnitIds.length === 0)) return setError("Seleccioná al menos una unidad por tarea.")
    setGuardando(true)
    setEstadoDelGuardado("Guardando avance…")
    try {
      await encolarAvance({
        id: crypto.randomUUID(),
        userId: user.id,
        obraId: projectId,
        hechoEn: new Date().toISOString(),
        pisoId,
        rubroId: rubroVigente,
        tareas: conEstado.map(({ t, b }) => ({
          tareaId: t.id,
          estado: b.taskStatus as EstadoDeTarea,
          comentario: b.comment.trim() || null,
          unidades: b.targetUnitIds.map((unidadId) => ({ unidadId, avanceId: crypto.randomUUID() })),
        })),
        fotos: conEstado.flatMap(({ t, b }) =>
          b.photos.map((f) => ({
            id: crypto.randomUUID(),
            tareaId: t.id,
            archivo: f.file,
            nombre: f.fileName,
            tipo: f.fileType,
            tamano: f.fileSize,
          })),
        ),
      })
    } catch {
      setGuardando(false)
      setEstadoDelGuardado(null)
      return setError("No pudimos guardar el avance en este dispositivo. Probá de nuevo.")
    }
    terminar({ enCola: typeof navigator !== "undefined" && navigator.onLine === false })
  }

  /** Sin servidor de datos: las server actions de siempre (avance y después fotos). */
  const guardarConServerActions = async () => {
    if (!pisoId || !rubroVigente) return
    setGuardando(true)
    setEstadoDelGuardado("Guardando avance…")
    const resultado = await saveCargarAvance({
      projectId,
      floorId: pisoId,
      rubroId: rubroVigente,
      unitIds: unidades,
      tasks: conContenido.map((t) => {
        const b = borradores[t.id]!
        return {
          taskId: t.id,
          unitIds: b.targetUnitIds,
          taskStatus: b.taskStatus,
          comment: b.comment || null,
          photoCount: b.photos.length,
        }
      }),
    })
    if (!resultado.ok) {
      setGuardando(false)
      setEstadoDelGuardado(null)
      return setError(resultado.error)
    }
    void invalidateProjectProgress(queryClient, projectId)
    const porTarea = new Map<string, string[]>()
    for (const e of resultado.entries) porTarea.set(e.taskId, [...(porTarea.get(e.taskId) ?? []), e.entryId])
    const conFotos = Object.fromEntries(
      Object.entries(borradores).filter(([, b]) => b.photos.length > 0 && hasTaskDraftContent(b)),
    )
    if (Object.keys(conFotos).length > 0) {
      setEstadoDelGuardado("Subiendo fotos…")
      const fotos = await buildAttachmentsForTaskPhotos({
        projectId,
        batchId: crypto.randomUUID(),
        entriesByTaskId: porTarea,
        taskDrafts: conFotos,
        onUploadProgress: (hechas, total) => setEstadoDelGuardado(`Subiendo fotos (${hechas}/${total})…`),
      })
      if (!fotos.ok) {
        setGuardando(false)
        setEstadoDelGuardado(null)
        return setError(`${fotos.error} El avance se guardó, pero las fotos no. Podés editarlo desde Trabajos Cargados.`)
      }
      if (fotos.attachments.length > 0) {
        const registro = await registerProgressAttachments(projectId, fotos.attachments)
        if (!registro.ok) {
          setGuardando(false)
          setEstadoDelGuardado(null)
          return setError(`${registro.error} El avance se guardó, pero las fotos no quedaron vinculadas.`)
        }
      }
    }
    terminar()
  }

  const confirmar = () => {
    setError(null)
    void (apiDisponible() ? guardarEnCola() : guardarConServerActions())
  }

  return (
    <section aria-labelledby="carga" className={TARJETA}>
      <div className="mb-group flex items-start justify-between gap-snug sm:mb-block">
        <h2 id="carga" className="text-section font-regular">
          Carga de Trabajo Diario
        </h2>
        <IconButton icon={X} label="Cerrar carga de avance" size="compact" className="-mt-related -mr-compact" onClick={onClose} />
      </div>

      <div className="flex flex-col gap-block">
        <TarjetaDeEleccion id="nivel" icono={MapPin} titulo="Seleccionar Nivel">
          {floors.length === 0 ? (
            <p className="text-body text-ink-muted">No hay niveles configurados en esta obra.</p>
          ) : (
            <div className="flex w-full flex-wrap gap-compact">
              {floors.map((f) => (
                <Pastilla
                  key={f.id}
                  etiqueta={getFloorDisplayLabel(f)}
                  titulo={f.name}
                  elegida={pisoId === f.id}
                  alTocar={() => elegirPiso(f.id)}
                />
              ))}
            </div>
          )}
        </TarjetaDeEleccion>

        {piso ? (
          <TarjetaDeEleccion
            id="unidades"
            icono={House}
            titulo="Unidades Funcionales"
            descripcion="Seleccioná una o más unidades donde se hizo el trabajo"
          >
            {piso.units.length === 0 ? (
              <p className="text-body text-ink-muted">No hay unidades configuradas en este nivel.</p>
            ) : (
              <div className="flex w-full flex-wrap gap-compact">
                {piso.units.map((u, i) => (
                  <Pastilla
                    key={u.id}
                    etiqueta={getUnitDisplayLabel(u, i + 1)}
                    titulo={getUnitDisplayTitle(u, piso, i + 1)}
                    elegida={unidades.includes(u.id)}
                    alTocar={() => alternarUnidad(u.id)}
                  />
                ))}
              </div>
            )}
          </TarjetaDeEleccion>
        ) : null}

        {unidades.length > 0 && rubros.length === 0 ? (
          <p className="rounded-control border border-dashed border-line px-group py-6 text-center text-body text-ink-muted">
            Todas las tareas de las unidades seleccionadas ya están completadas.
          </p>
        ) : null}

        {unidades.length > 0 && rubros.length > 0 ? (
          <div className="flex flex-col gap-block">
            <div className={TARJETA}>
              <Field label="Rubro">
                <Select value={rubroVigente ?? undefined} onValueChange={pedirRubro} placeholder="Elegí un rubro">
                  {rubros.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </Select>
              </Field>
            </div>

            {rubro ? (
              <section aria-labelledby="estado-avance" className={TARJETA}>
                <div className="mb-group flex flex-col gap-related">
                  <h3 id="estado-avance" className="text-reading">
                    Estado de avance de {rubro.name}
                  </h3>
                  <p className="text-body text-ink-muted">Tocá cada tarea hecha para agregar detalles</p>
                </div>
                <div className="mb-group flex flex-wrap items-center gap-group rounded-control border border-line bg-canvas-sunken p-snug">
                  <span className="text-meta font-medium text-ink-muted">Estados:</span>
                  <ul className="flex flex-wrap items-center gap-group">
                    {(["pending", "completed", "in_progress", "blocked"] as const).map((e) => (
                      <li key={e} className="flex items-center gap-1.5 text-meta text-ink-muted">
                        <Icon icon={ICONO[e]} size="xs" className={COLOR_DEL_ICONO[e]} />
                        {ETIQUETA[e]}
                      </li>
                    ))}
                  </ul>
                </div>
                {noCoinciden ? (
                  <Notice tone="info" title={`Se seleccionaron ${unidades.length} unidades funcionales:`} className="mb-group">
                    Hay tareas que se pueden cargar juntas y otras que no coinciden. Elegí en cada tarea a qué unidades
                    aplicar el avance.
                  </Notice>
                ) : null}

                {tareas.length === 0 ? (
                  <p className="text-body text-ink-muted">
                    No hay tareas disponibles para cargar avance en las unidades seleccionadas.
                  </p>
                ) : (
                  <AccordionPrimitive.Root
                    type="multiple"
                    value={abiertas}
                    onValueChange={setAbiertas}
                    className="flex flex-col gap-compact"
                  >
                    {tareas.map((tarea) => {
                      const b = borradorDe(tarea.id)
                      const unidadesDeLaTarea = sortUnitIdsByDisplayOrder(
                        getAssignedSelectedUnitIdsForTask(tarea.id, unidades, assignmentsByUnit),
                        ordenDeUnidades,
                      )
                      const una = unidades.length === 1
                      return (
                        <AccordionPrimitive.Item
                          key={tarea.id}
                          value={tarea.id}
                          className="group/task overflow-hidden rounded-control border border-line bg-canvas-raised"
                        >
                          <AccordionPrimitive.Header className="flex">
                            <AccordionPrimitive.Trigger className="focus-ring state-veil flex min-h-13 w-full cursor-pointer items-center gap-snug px-3.5 py-snug text-left">
                              <Icon icon={ICONO[b.taskStatus]} size="md" className={COLOR_DEL_ICONO[b.taskStatus]} />
                              <span className="min-w-0 flex-1 truncate text-body">{tarea.name}</span>
                              {b.taskStatus !== "pending" ? (
                                <>
                                  <Badge tone={TONO[b.taskStatus]} className="hidden rounded-compact sm:inline-flex">
                                    {ETIQUETA[b.taskStatus]}
                                  </Badge>
                                  <span className="sr-only sm:hidden">, {ETIQUETA[b.taskStatus]}</span>
                                </>
                              ) : null}
                              <Icon
                                icon={ChevronDown}
                                className="text-ink-muted transition-transform duration-(--duration-base) group-data-[state=open]/task:rotate-180"
                              />
                            </AccordionPrimitive.Trigger>
                          </AccordionPrimitive.Header>
                          <AccordionPrimitive.Content className="overflow-hidden border-t border-line data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down motion-reduce:animate-none">
                            <div className="flex flex-col gap-group p-group">
                              {unidadesDeLaTarea.length > 0 ? (
                                <div role="group" aria-labelledby={`unidades-${tarea.id}`} className="flex flex-col gap-compact">
                                  <p id={`unidades-${tarea.id}`} className="text-meta text-ink-muted">
                                    Unidades a aplicar los cambios
                                  </p>
                                  <div className="flex flex-wrap items-center gap-compact">
                                    {unidadesDeLaTarea.map((unidadId) => {
                                      const hecha = isUnitTaskLoaded(cargadas, unidadId, tarea.id)
                                      const marcada = una ? true : b.targetUnitIds.includes(unidadId)
                                      return (
                                        <UnidadDeLaTarea
                                          key={unidadId}
                                          etiqueta={etiquetaDeUnidad[unidadId] ?? unidadId.slice(0, 8)}
                                          estado={unitTaskStatuses[getUnitTaskKey(unidadId, tarea.id)] ?? "pending"}
                                          marcada={marcada}
                                          deshabilitada={hecha || una}
                                          alCambiar={(valor) => {
                                            const siguientes = valor
                                              ? [...b.targetUnitIds, unidadId]
                                              : b.targetUnitIds.filter((id) => id !== unidadId)
                                            actualizar(tarea.id, {
                                              targetUnitIds: siguientes,
                                              ...(siguientes.length === 0 ? { taskStatus: "pending" as const } : {}),
                                            })
                                          }}
                                        />
                                      )
                                    })}
                                  </div>
                                </div>
                              ) : null}
                              {b.targetUnitIds.length > 0 ? (
                                <>
                                  <div role="group" aria-labelledby={`estado-${tarea.id}`} className="flex flex-col gap-compact">
                                    <p id={`estado-${tarea.id}`} className="text-meta text-ink-muted">
                                      Estado de la Tarea
                                    </p>
                                    <div className="grid grid-cols-1 gap-compact sm:grid-cols-3">
                                      {OPCIONES_DE_ESTADO.map((opcion) => {
                                        const activo = b.taskStatus === opcion.estado
                                        return (
                                          <button
                                            key={opcion.estado}
                                            type="button"
                                            aria-pressed={activo}
                                            onClick={() => actualizar(tarea.id, { taskStatus: activo ? "pending" : opcion.estado })}
                                            className={cn(
                                              "focus-ring motion-color inline-flex cursor-pointer items-center justify-center gap-compact rounded-control border-2 px-snug py-2.5 text-label",
                                              activo ? opcion.activo : "border-line bg-canvas-raised text-ink-muted hover:bg-surface-hover",
                                            )}
                                          >
                                            <Icon icon={ICONO[opcion.estado]} size="md" className={activo ? undefined : "text-ink-disabled"} />
                                            {ETIQUETA[opcion.estado]}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>
                                  <Field label="Comentarios y Observaciones">
                                    <Textarea
                                      value={b.comment}
                                      onChange={(e) => actualizar(tarea.id, { comment: e.target.value })}
                                      placeholder="Agregá notas sobre esta tarea…"
                                    />
                                  </Field>
                                  <FotosDeLaTarea fotos={b.photos} alCambiar={(photos) => actualizar(tarea.id, { photos })} />
                                </>
                              ) : null}
                            </div>
                          </AccordionPrimitive.Content>
                        </AccordionPrimitive.Item>
                      )
                    })}
                  </AccordionPrimitive.Root>
                )}

                <div className="mt-block flex flex-col items-stretch gap-snug border-t border-line pt-block sm:items-end">
                  {error && !revisando ? (
                    <p role="alert" className="w-full text-body text-fn-danger">
                      {error}
                    </p>
                  ) : null}
                  <Button
                    size="large"
                    disabled={!puedeGuardar || guardando}
                    onClick={() => {
                      setError(null)
                      setRevisando(true)
                    }}
                    className="w-full sm:w-auto sm:min-w-50"
                  >
                    <Icon icon={Check} /> Revisar y Confirmar
                  </Button>
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        {!piso ? (
          <Notice tone="info" title="Instrucciones:">
            <ol className="mt-related list-decimal space-y-related pl-5">
              <li>Elegí el nivel donde se hizo el trabajo</li>
              <li>Elegí las unidades o locales trabajados</li>
              <li>Elegí el rubro</li>
              <li>En cada tarea, tocala para abrirla y agregar estado, comentarios y fotos</li>
              <li>Guardá el registro para que se pueda inspeccionar</li>
            </ol>
          </Notice>
        ) : null}
      </div>

      <Dialog open={revisando} onOpenChange={(abierto) => !guardando && setRevisando(abierto)}>
        <DialogContent
          size="wide"
          title="Confirmar registro de avance"
          description="Revisá los trabajos registrados antes de confirmar."
          footer={
            <>
              <Button variant="outline" disabled={guardando} onClick={() => setRevisando(false)}>
                Volver a editar
              </Button>
              <Button loading={guardando} loadingLabel={estadoDelGuardado ?? "Guardando"} onClick={confirmar}>
                {guardando && estadoDelGuardado ? estadoDelGuardado : "Confirmar"}
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-group">
            <dl className="flex flex-wrap gap-x-5 gap-y-related rounded-control bg-canvas-sunken px-group py-snug text-body">
              <div className="flex gap-related">
                <dt className="text-ink-muted">Nivel:</dt>
                <dd className="font-medium">{piso?.name ?? "—"}</dd>
              </div>
              <div className="flex gap-related">
                <dt className="text-ink-muted">Rubro:</dt>
                <dd className="font-medium">{rubro?.name ?? "—"}</dd>
              </div>
            </dl>
            <ul className="flex flex-col gap-compact">
              {conContenido.map((t) => {
                const b = borradores[t.id]!
                return (
                  <li
                    key={t.id}
                    className="flex flex-col gap-compact rounded-control border border-line px-group py-snug sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body">{t.name}</p>
                      <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-meta text-ink-muted">
                        Unidades:
                        {sortUnitIdsByDisplayOrder(b.targetUnitIds, ordenDeUnidades).map((id) => (
                          <span key={id} className="rounded-compact bg-canvas-track px-1.5 text-ink">
                            {etiquetaDeUnidad[id] ?? id.slice(0, 8)}
                          </span>
                        ))}
                      </p>
                    </div>
                    <Badge tone={TONO[b.taskStatus]} className="self-start rounded-compact">
                      {ETIQUETA[b.taskStatus]}
                    </Badge>
                  </li>
                )
              })}
            </ul>
            {error ? (
              <p role="alert" className="text-body text-fn-danger">
                {error}
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={rubroPendiente !== null}
        onOpenChange={(abierto) => (abierto ? null : setRubroPendiente(null))}
        title="¿Cambiar de rubro?"
        description="Se pierde lo que cargaste en las tareas de este rubro."
        confirmLabel="Cambiar rubro"
        tone="danger"
        onConfirm={() => {
          setRubroId(rubroPendiente)
          setRubroPendiente(null)
          limpiarTareas()
        }}
      />
    </section>
  )
}
