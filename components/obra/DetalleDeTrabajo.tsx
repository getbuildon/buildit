"use client"

import { useQuery } from "@tanstack/react-query"
import {
  AlertCircle,
  BadgeCheck,
  Camera,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Clock,
  Pencil,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@/library/atoms/badge/Badge"
import { Button } from "@/library/atoms/button/Button"
import { Icon } from "@/library/atoms/icon/Icon"
import { Textarea } from "@/library/atoms/input/Input"
import { Skeleton } from "@/library/atoms/skeleton/Skeleton"
import { cn } from "@/library/lib/cn"
import { Dialog, DialogContent } from "@/library/molecules/dialog/Dialog"
import { Field } from "@/library/molecules/field/Field"
import { FileField } from "@/library/molecules/file-field/FileField"

import {
  getTrabajoDiarioTaskDetail,
  registerProgressAttachments,
  updateTrabajoDiarioTask,
  type TrabajoDiarioTaskAttachment,
  type TrabajoDiarioTaskDetail,
  type TrabajoDiarioTaskHistoryStatus,
} from "@/app/project/[projectId]/trabajo-diario/actions"
import { useStrictProjectPermission } from "@/components/project-shell/ProjectAccessProvider"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContextSupabase"
import { claves, FRESCO_MS } from "@/lib/api/claves"
import { encolarAvance, type EstadoDeTarea } from "@/lib/api/cola"
import { apiDisponible } from "@/lib/api/navegador"
import { useLectura } from "@/lib/api/useLectura"
import { armarDetalleDeTrabajo, type CrudosDelDetalle } from "@/lib/projects/armarDetalleDeTrabajo"
import { certificarAvances } from "@/lib/projects/certificar"
import { getFloorDisplayLabel } from "@/lib/projects/floorLabels"
import { buildAttachmentsForSingleEntry } from "@/lib/progress/linkProgressPhotos.client"
import { MAX_PHOTOS_PER_TASK } from "@/lib/progress/progressPhotoConfig"
import { compressProgressPhoto } from "@/lib/progress/progressPhotos.client"

/**
 * El detalle de un trabajo cargado, armado con la librería BuildOn: es «Pantallas/Obra/
 * Detalle del trabajo · Como hoy» del catálogo con los datos de verdad. Estado, rubro,
 * comentarios, fotos, historial; editar el estado (suma un avance nuevo) y certificar.
 *
 * Con el servidor de datos: se lee con copia en el dispositivo y el cambio de estado va a
 * la cola (funciona sin señal). Sin él: las server actions de siempre.
 */

type Estado = TrabajoDiarioTaskHistoryStatus
const TONO = { Completado: "ok", "En Proceso": "caution", Bloqueado: "danger", Certificada: "info" } as const
const COLOR: Record<Estado, string> = {
  Completado: "text-fn-ok",
  "En Proceso": "text-fn-caution",
  Bloqueado: "text-fn-danger",
  Certificada: "text-fn-info",
}
const ICONO: Record<Estado, LucideIcon> = {
  Completado: CheckCircle2,
  "En Proceso": CircleDashed,
  Bloqueado: AlertCircle,
  Certificada: ShieldCheck,
}
const OPCIONES: { estado: EstadoDeTarea; etiqueta: Exclude<Estado, "Certificada">; activo: string }[] = [
  { estado: "completed", etiqueta: "Completado", activo: "border-fn-ok-solid bg-fn-ok-canvas text-fn-ok" },
  { estado: "in_progress", etiqueta: "En Proceso", activo: "border-fn-caution-solid bg-fn-caution-canvas text-fn-caution" },
  { estado: "blocked", etiqueta: "Bloqueado", activo: "border-fn-danger-solid bg-fn-danger-canvas text-fn-danger" },
]
const aBorrador = (estado: Estado): EstadoDeTarea =>
  estado === "En Proceso" ? "in_progress" : estado === "Bloqueado" ? "blocked" : "completed"

const cuantasFotos = (n: number) => (n === 0 ? "Sin fotografías" : n === 1 ? "1 foto adjunta" : `${n} fotos adjuntas`)

type FotoNueva = { id: string; archivo: File; vista: string; nombre: string; tamano: number; tipo: string }

function Pildora({ estado }: { estado: Estado }) {
  return (
    <Badge tone={TONO[estado]} icon={ICONO[estado]} className="w-fit rounded-compact">
      {estado}
    </Badge>
  )
}

function Galeria({
  fotos,
  titulo,
  descripcion,
  alCerrar,
}: {
  fotos: TrabajoDiarioTaskAttachment[]
  titulo: string
  descripcion?: string
  alCerrar: () => void
}) {
  return (
    <Dialog open={fotos.length > 0} onOpenChange={(abierto) => !abierto && alCerrar()}>
      <DialogContent size="wide" title={titulo} description={descripcion}>
        <ul className="grid grid-cols-1 gap-compact sm:grid-cols-2">
          {fotos.map((foto) => (
            <li key={foto.id}>
              <a href={foto.signedUrl} target="_blank" rel="noopener noreferrer" className="focus-ring block rounded-control">
                {/* eslint-disable-next-line @next/next/no-img-element -- enlaces firmados, sin optimizar */}
                <img src={foto.signedUrl} alt={foto.fileName} className="aspect-4/3 w-full rounded-control bg-canvas-sunken object-cover" />
                <span className="sr-only">(se abre en otra pestaña)</span>
              </a>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ Lectura */

/** El detalle, por el servidor de datos (con copia) o por la server action. */
function useDetalle(projectId: string, entryId: string | null, abierto: boolean) {
  const { user } = useAuth()
  const userId = user?.id ?? ""
  const conApi = apiDisponible()
  const api = useLectura<CrudosDelDetalle>({
    clave: claves.detalleDeAvance(userId, projectId, entryId ?? ""),
    ruta: `/obras/${projectId}/avances/${entryId}`,
    userId,
    frescoMs: FRESCO_MS.detalleDeAvance,
    habilitada: conApi && abierto && Boolean(entryId),
  })
  const viejo = useQuery({
    queryKey: ["trabajo-diario", projectId, "detalle", entryId],
    queryFn: () => getTrabajoDiarioTaskDetail(projectId, entryId ?? ""),
    enabled: !conApi && abierto && Boolean(entryId),
  })
  const crudos = conApi ? api.data : undefined
  const detalle = useMemo<TrabajoDiarioTaskDetail | null | undefined>(
    () => (conApi ? (crudos ? armarDetalleDeTrabajo(crudos) : undefined) : viejo.data),
    [conApi, crudos, viejo.data],
  )
  return {
    detalle,
    crudos,
    error: conApi ? api.isError && !api.data : viejo.isError || viejo.data === null,
    reintentar: () => void (conApi ? api.refetch() : viejo.refetch()),
    releer: () => void (conApi ? api.refetch() : viejo.refetch()),
  }
}

/* ------------------------------------------------------------------ Ventana */

export type DetalleDeTrabajoProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  entryId: string | null
  onEntryIdChange: (entryId: string) => void
  /** Después de guardar o certificar: refrescar la lista. */
  onSaved: () => void
}

export function DetalleDeTrabajo({ open, onOpenChange, projectId, entryId, onEntryIdChange, onSaved }: DetalleDeTrabajoProps) {
  const toast = useToast()
  const { user } = useAuth()
  const puedeEditar = useStrictProjectPermission("editTasks")
  const puedeCertificar = useStrictProjectPermission("certifyTasks")
  const { detalle, crudos, error: falloLaLectura, reintentar, releer } = useDetalle(projectId, entryId, open)

  const [modo, setModo] = useState<"ver" | "editar">("ver")
  const [historialAbierto, setHistorialAbierto] = useState(true)
  const [estado, setEstado] = useState<EstadoDeTarea>("in_progress")
  const [comentario, setComentario] = useState("")
  const [fotos, setFotos] = useState<FotoNueva[]>([])
  const [procesando, setProcesando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [estadoDelGuardado, setEstadoDelGuardado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [galeria, setGaleria] = useState<{ fotos: TrabajoDiarioTaskAttachment[]; titulo: string; descripcion?: string } | null>(null)
  const [certificando, setCertificando] = useState(false)
  const [notas, setNotas] = useState("")
  const [enviandoCertificacion, setEnviandoCertificacion] = useState(false)

  const puedeCambiarEstado = puedeEditar && (detalle?.status !== "Certificada" || puedeCertificar)
  const muestraCertificar = puedeCertificar && modo === "ver" && detalle?.status === "Completado"

  const soltarFotos = () => {
    fotos.forEach((f) => URL.revokeObjectURL(f.vista))
    setFotos([])
  }
  const volverAVer = () => {
    soltarFotos()
    setModo("ver")
    setComentario("")
    setError(null)
    setEstadoDelGuardado(null)
  }
  const cerrar = (abierto: boolean) => {
    if (!abierto) {
      volverAVer()
      setCertificando(false)
    }
    onOpenChange(abierto)
  }

  const agregarFotos = async (archivos: File[]) => {
    setError(null)
    if (fotos.length + archivos.length > MAX_PHOTOS_PER_TASK) {
      setError(`Podés agregar hasta ${MAX_PHOTOS_PER_TASK} fotos.`)
      return
    }
    setProcesando(true)
    try {
      const nuevas: FotoNueva[] = []
      for (const archivo of archivos) {
        if (!archivo.type.startsWith("image/")) throw new Error(`«${archivo.name}» no es una imagen.`)
        const c = await compressProgressPhoto(archivo)
        nuevas.push({ id: crypto.randomUUID(), archivo: c, vista: URL.createObjectURL(c), nombre: archivo.name, tamano: c.size, tipo: c.type || "image/webp" })
      }
      setFotos((actuales) => [...actuales, ...nuevas])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudieron procesar las fotos.")
    } finally {
      setProcesando(false)
    }
  }

  /** Con el servidor de datos: el cambio va a la cola (sale con señal o cuando vuelva). */
  const guardarEnCola = async () => {
    const a = crudos?.avance
    if (!entryId || !user || !a?.floor_id || !a.task_id || !a.category_id) {
      setError("No pudimos preparar el cambio. Cerrá y volvé a abrir el trabajo.")
      return
    }
    setGuardando(true)
    setEstadoDelGuardado("Guardando cambio…")
    try {
      await encolarAvance({
        id: crypto.randomUUID(),
        tipo: "cambio",
        avanceBaseId: entryId,
        userId: user.id,
        obraId: projectId,
        hechoEn: new Date().toISOString(),
        pisoId: a.floor_id,
        rubroId: a.category_id,
        tareas: [
          {
            tareaId: a.task_id,
            estado,
            comentario: comentario.trim() || null,
            unidades: [{ unidadId: a.unit_id, avanceId: crypto.randomUUID() }],
          },
        ],
        fotos: fotos.map((f) => ({ id: crypto.randomUUID(), tareaId: a.task_id!, archivo: f.archivo, nombre: f.nombre, tipo: f.tipo, tamano: f.tamano })),
      })
    } catch {
      setGuardando(false)
      setEstadoDelGuardado(null)
      setError("No pudimos guardar el cambio en este dispositivo. Probá de nuevo.")
      return
    }
    setGuardando(false)
    const sinSenal = typeof navigator !== "undefined" && navigator.onLine === false
    toast.success(sinSenal ? "Cambio guardado en este dispositivo. Se envía cuando vuelva la señal." : "Cambio guardado")
    onSaved()
    cerrar(false)
  }

  /** Sin servidor de datos: las server actions de siempre. */
  const guardarConServerActions = async () => {
    if (!entryId) return
    setGuardando(true)
    setEstadoDelGuardado("Guardando cambio…")
    const resultado = await updateTrabajoDiarioTask({ projectId, entryId, taskStatus: estado, comment: comentario })
    if (!resultado.ok) {
      setGuardando(false)
      setEstadoDelGuardado(null)
      return setError(resultado.error)
    }
    if (fotos.length > 0) {
      setEstadoDelGuardado("Subiendo fotos…")
      const subida = await buildAttachmentsForSingleEntry({
        projectId,
        batchId: crypto.randomUUID(),
        entryId: resultado.entryId,
        photos: fotos.map((f) => f.archivo),
        onUploadProgress: (hechas, total) => setEstadoDelGuardado(`Subiendo fotos (${hechas}/${total})…`),
      })
      if (!subida.ok) {
        setGuardando(false)
        setEstadoDelGuardado(null)
        return setError(`${subida.error} El cambio se guardó, pero las fotos no. Podés volver a editarlo.`)
      }
      if (subida.attachments.length > 0) {
        const registro = await registerProgressAttachments(projectId, subida.attachments)
        if (!registro.ok) {
          setGuardando(false)
          setEstadoDelGuardado(null)
          return setError(`${registro.error} El cambio se guardó, pero las fotos no quedaron vinculadas.`)
        }
      }
    }
    setGuardando(false)
    onEntryIdChange(resultado.entryId)
    volverAVer()
    onSaved()
  }

  const certificar = async () => {
    if (!entryId || !user) return
    setEnviandoCertificacion(true)
    setError(null)
    const resultado = await certificarAvances({ projectId, userId: user.id, avanceIds: [entryId], nota: notas })
    setEnviandoCertificacion(false)
    if (!resultado.ok) {
      setError(resultado.error)
      toast.error(resultado.error)
      return
    }
    setCertificando(false)
    setNotas("")
    toast.success(resultado.enCola ? "Certificación guardada en este dispositivo. Se envía cuando vuelva la señal." : "Tarea certificada exitosamente")
    onSaved()
    // Con la cola, el detalle se actualiza cuando la certificación llega al servidor.
    if (apiDisponible()) cerrar(false)
    else releer()
  }

  const subtitulo = detalle
    ? `${getFloorDisplayLabel({ name: detalle.floorName, identifier: detalle.floorIdentifier })} • ${detalle.unitLabel} • ${detalle.formattedLongDate}`
    : undefined

  const pie =
    modo === "ver" ? (
      muestraCertificar ? (
        <>
          <Button variant="outline" onClick={() => cerrar(false)}>
            Cerrar
          </Button>
          <Button onClick={() => setCertificando(true)}>
            <Icon icon={BadgeCheck} /> Certificar
          </Button>
        </>
      ) : (
        <Button className="w-full sm:w-auto" onClick={() => cerrar(false)}>
          Cerrar
        </Button>
      )
    ) : (
      <>
        <Button variant="outline" disabled={guardando} onClick={volverAVer}>
          Cancelar
        </Button>
        <Button loading={guardando} loadingLabel={estadoDelGuardado ?? "Guardando"} disabled={procesando} onClick={() => void (apiDisponible() ? guardarEnCola() : guardarConServerActions())}>
          {guardando && estadoDelGuardado ? estadoDelGuardado : "Guardar cambio"}
        </Button>
      </>
    )

  return (
    <>
      <Dialog open={open} onOpenChange={(abierto) => !guardando && cerrar(abierto)}>
        <DialogContent size="wide" title={detalle?.taskName ?? "Detalle del trabajo"} description={subtitulo} footer={pie}>
          {!detalle ? (
            falloLaLectura ? (
              <div role="alert" className="flex flex-col items-start gap-snug">
                <p className="text-body text-ink-muted">No pudimos cargar este trabajo. Puede ser un problema de conexión.</p>
                <Button variant="outline" onClick={reintentar}>
                  Reintentar
                </Button>
              </div>
            ) : (
              <div role="status" aria-busy className="flex flex-col gap-block">
                <span className="sr-only">Cargando el trabajo…</span>
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-10" />
                <Skeleton className="h-16" />
                <Skeleton className="h-10" />
              </div>
            )
          ) : modo === "ver" ? (
            <div className="flex flex-col gap-block">
              <div className="flex items-start justify-between gap-snug">
                <div className="flex flex-col gap-1.5">
                  <p className="text-meta text-ink-muted">Estado</p>
                  <Pildora estado={detalle.status} />
                </div>
                {puedeCambiarEstado ? (
                  <Button
                    variant="ghost"
                    size="compact"
                    className="text-action-text"
                    onClick={() => {
                      setEstado(aBorrador(detalle.status))
                      setModo("editar")
                    }}
                  >
                    <Icon icon={Pencil} /> Editar Estado
                  </Button>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-meta text-ink-muted">Rubro</p>
                <p className="text-label">{detalle.rubroName}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-meta text-ink-muted">Comentarios</p>
                <p className="rounded-control bg-canvas-sunken px-group py-snug text-body whitespace-pre-wrap">
                  {detalle.comment || "Sin comentarios"}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-meta text-ink-muted">Fotografías</p>
                <button
                  type="button"
                  disabled={detalle.attachments.length === 0}
                  onClick={() => setGaleria({ fotos: detalle.attachments, titulo: "Fotografías del avance", descripcion: subtitulo })}
                  className="focus-ring motion-color flex w-full cursor-pointer items-center gap-compact rounded-control bg-canvas-sunken px-group py-snug text-left text-body hover:bg-canvas-track disabled:cursor-default disabled:text-ink-muted"
                >
                  <Icon icon={Camera} className="text-ink-muted" />
                  {cuantasFotos(detalle.attachments.length)}
                </button>
              </div>
              <p className="text-meta text-ink-muted">Registrado por {detalle.registeredByName}</p>
              {detalle.history.length > 0 ? (
                <div className="flex flex-col gap-compact">
                  <button
                    type="button"
                    aria-expanded={historialAbierto}
                    aria-controls="historial"
                    onClick={() => setHistorialAbierto((v) => !v)}
                    className="focus-ring flex cursor-pointer items-center justify-between rounded-box py-related text-left"
                  >
                    <span className="inline-flex items-center gap-compact text-label">
                      <Icon icon={Clock} className="text-ink-muted" />
                      Ver Historial de Cambios
                    </span>
                    <Icon
                      icon={ChevronDown}
                      className={cn("text-ink-muted transition-transform duration-(--duration-base)", historialAbierto && "rotate-180")}
                    />
                  </button>
                  {historialAbierto ? (
                    <ul id="historial" className="flex flex-col gap-compact">
                      {detalle.history.map((item) => (
                        <li key={item.id} className="flex items-start gap-snug rounded-control bg-canvas-sunken px-group py-snug">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-snug">
                              <span className={cn("inline-flex items-center gap-1.5 text-meta font-medium", COLOR[item.status])}>
                                <Icon icon={ICONO[item.status]} />
                                {item.status}
                              </span>
                              <span className="shrink-0 text-meta text-ink-muted">{item.formattedDate}</span>
                            </div>
                            {item.comment ? <p className="mt-compact text-body whitespace-pre-wrap">{item.comment}</p> : null}
                            <p className="mt-1.5 text-meta text-ink-muted">Por: {item.authorName}</p>
                          </div>
                          <button
                            type="button"
                            disabled={item.attachments.length === 0}
                            onClick={() =>
                              setGaleria({ fotos: item.attachments, titulo: "Fotografías del cambio", descripcion: `${item.formattedDate} • ${item.status}` })
                            }
                            aria-label={
                              item.attachments.length === 0
                                ? "Sin fotografías"
                                : `Ver ${item.attachments.length === 1 ? "1 foto" : `${item.attachments.length} fotos`} del cambio del ${item.formattedDate}`
                            }
                            className="focus-ring motion-color grid size-8 shrink-0 cursor-pointer place-items-center rounded-compact border border-line bg-canvas-raised text-ink-muted hover:border-action hover:text-action-text disabled:cursor-default disabled:opacity-50 disabled:hover:border-line disabled:hover:text-ink-muted"
                          >
                            <Icon icon={Camera} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
              {error ? (
                <p role="alert" className="text-body text-fn-danger">
                  {error}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col gap-block">
              <Badge tone="action" className="self-start rounded-control">
                Editando
              </Badge>
              <div role="group" aria-labelledby="nuevo-estado" className="flex flex-col gap-compact">
                <p id="nuevo-estado" className="text-label">
                  Nuevo Estado
                </p>
                <div className="grid grid-cols-1 gap-compact sm:grid-cols-3">
                  {OPCIONES.map((o) => {
                    const activo = estado === o.estado
                    return (
                      <button
                        key={o.estado}
                        type="button"
                        aria-pressed={activo}
                        onClick={() => setEstado(o.estado)}
                        className={cn(
                          "focus-ring motion-color flex h-11 cursor-pointer items-center justify-center gap-compact rounded-control border-2 px-compact text-label",
                          activo ? o.activo : "border-line bg-canvas-raised text-ink-muted hover:bg-surface-hover",
                        )}
                      >
                        <Icon icon={ICONO[o.etiqueta]} size="md" className={activo ? undefined : "text-ink-disabled"} />
                        {o.etiqueta}
                      </button>
                    )
                  })}
                </div>
              </div>
              <Field label="Comentarios sobre el cambio">
                <Textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={4}
                  placeholder="Contá el motivo del cambio de estado…"
                />
              </Field>
              <Field label="Fotos" optional>
                <FileField
                  files={[
                    ...fotos.map((f) => ({ id: f.id, name: f.nombre, previewUrl: f.vista })),
                    ...(procesando ? [{ id: "procesando", name: "Preparando foto…", status: "uploading" as const }] : []),
                  ]}
                  onAdd={(archivos) => void agregarFotos(archivos)}
                  onRemove={(id) => {
                    const f = fotos.find((x) => x.id === id)
                    if (f) URL.revokeObjectURL(f.vista)
                    setFotos((actuales) => actuales.filter((x) => x.id !== id))
                  }}
                  accept="image/*"
                  acceptLabel="JPG, PNG o HEIC"
                  multiple
                  maxFiles={MAX_PHOTOS_PER_TASK}
                  capture="environment"
                  disabled={procesando || guardando}
                />
              </Field>
              {error ? (
                <p role="alert" className="text-body text-fn-danger">
                  {error}
                </p>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Galeria
        fotos={galeria?.fotos ?? []}
        titulo={galeria?.titulo ?? ""}
        descripcion={galeria?.descripcion}
        alCerrar={() => setGaleria(null)}
      />

      <Dialog open={certificando} onOpenChange={(abierto) => !enviandoCertificacion && setCertificando(abierto)}>
        <DialogContent
          title={`¿Certificar «${detalle?.taskName ?? ""}»?`}
          description={
            detalle
              ? `${detalle.floorName} · ${detalle.unitLabel} · ${detalle.rubroName}. Cargado por ${detalle.registeredByName}. Una vez certificada, solo quien certifica puede cambiar su estado.`
              : undefined
          }
          footer={
            <>
              <Button variant="outline" disabled={enviandoCertificacion} onClick={() => setCertificando(false)}>
                Cancelar
              </Button>
              <Button loading={enviandoCertificacion} loadingLabel="Certificando" onClick={() => void certificar()}>
                Certificar
              </Button>
            </>
          }
        >
          <Field label="Notas de la certificación" optional>
            <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} placeholder="Observaciones de la inspección…" />
          </Field>
        </DialogContent>
      </Dialog>
    </>
  )
}
