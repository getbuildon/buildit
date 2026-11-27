"use client"

import { useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Check, CircleAlert, Eye, Plus, Trash2 } from "lucide-react"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import { Button } from "@/library/atoms/button/Button"
import { IconButton } from "@/library/atoms/button/IconButton"
import { Icon } from "@/library/atoms/icon/Icon"
import { Input, Textarea } from "@/library/atoms/input/Input"
import { Skeleton } from "@/library/atoms/skeleton/Skeleton"
import { ConfirmDialog } from "@/library/molecules/confirm-dialog/ConfirmDialog"
import { DatePicker } from "@/library/molecules/date-picker/DatePicker"
import { EmptyState } from "@/library/molecules/empty-state/EmptyState"
import { Field } from "@/library/molecules/field/Field"
import { Notice } from "@/library/molecules/notice/Notice"
import { Segmented } from "@/library/molecules/segmented/Segmented"

import { MiUnidad } from "@/components/obra/MiUnidad"
import {
  savePortalClientesContent,
  type PortalClientesPreviewContext,
} from "@/app/project/[projectId]/portal-clientes/actions"
import { ImagenDeNovedad } from "@/components/obra/portal-clientes/ImagenDeNovedad"
import { useToast } from "@/components/ui/toast"
import { AVISO_SIN_SENAL_PARA_GUARDAR, useEnLinea } from "@/lib/api/useEnLinea"
import { invalidateProjectQueries } from "@/lib/project/invalidateProjectQueries"
import { formatDraftDateString, parseDraftDateString } from "@/lib/projects/createProjectDraft"
import {
  PORTAL_MILESTONE_STATUS_LABELS,
  PORTAL_MILESTONE_STATUS_OPTIONS,
  type PortalClientesData,
  type PortalMilestoneItem,
  type PortalMilestoneStatus,
  type PortalNewsItem,
} from "@/lib/projects/portalClientesTypes"
import {
  validatePortalClientesContent,
  type PortalMilestoneFieldErrors,
  type PortalNewsFieldErrors,
} from "@/lib/projects/portalClientesValidation"
import { revokePortalNewsPreview, uploadPortalNewsImage, type PortalNewsImageDraft } from "@/lib/projects/portalNewsPhoto.client"

/**
 * Portal de Clientes (el editor del equipo) armado con la librería BuildOn: es
 * «Pantallas/Obra/Portal Clientes · Editor · como hoy» del catálogo con los datos de
 * verdad. Ciudad del clima, novedades con imagen, hitos de la construcción, vista
 * previa de lo que ve el cliente y guardar o descartar los cambios.
 */

const ENVOLTORIO = "flex flex-col gap-group py-compact sm:gap-block sm:py-block"

/* ------------------------------------------------------------------ Estado del editor */

type NovedadEnEdicion = PortalNewsItem & {
  imageDraft: PortalNewsImageDraft | null
  clearedImage: boolean
}

/** Lo que se compara para saber si hay cambios sin guardar. */
type Foto = {
  weatherCity: string
  news: Array<{ id: string; title: string; description: string; sortOrder: number; imageState: string | null }>
  milestones: PortalMilestoneItem[]
}

type BorradoPendiente = { tipo: "novedad" | "hito"; id: string; indice: number; nombre: string }

const aEdicion = (item: PortalNewsItem): NovedadEnEdicion => ({ ...item, imageDraft: null, clearedImage: false })

function fotoDelEditor(weatherCity: string, news: NovedadEnEdicion[], milestones: PortalMilestoneItem[]): Foto {
  return {
    weatherCity,
    news: news.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      sortOrder: item.sortOrder,
      imageState: item.imageDraft
        ? `draft:${item.imageDraft.fileName}:${item.imageDraft.fileSize}`
        : item.clearedImage
          ? null
          : item.imageUrl,
    })),
    milestones,
  }
}

function fotoDeLosDatos(data: PortalClientesData): Foto {
  return {
    weatherCity: data.weatherCity,
    news: data.news.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      sortOrder: item.sortOrder,
      imageState: item.imageUrl,
    })),
    milestones: data.milestones,
  }
}

const iguales = (a: Foto, b: Foto) => JSON.stringify(a) === JSON.stringify(b)

function textoDelBorrado({ tipo, indice, nombre }: BorradoPendiente): string {
  const cual = tipo === "novedad" ? `Novedad ${indice + 1}` : `Hito ${indice + 1}`
  const limpio = nombre.trim()
  const detalle = limpio ? ` «${limpio}»` : tipo === "novedad" ? " (sin título)" : " (sin nombre)"
  return `Vas a eliminar ${cual}${detalle}. ¿Deseás continuar?`
}

/** Saca un campo del mapa de errores; si la fila queda sin errores, la saca entera. */
function sinError<T extends object>(errores: Record<string, T>, id: string, campo: keyof T): Record<string, T> {
  const fila = errores[id]
  if (!fila?.[campo]) return errores
  const siguiente = { ...fila, [campo]: undefined }
  if (!Object.values(siguiente).some(Boolean)) {
    const resto = { ...errores }
    delete resto[id]
    return resto
  }
  return { ...errores, [id]: siguiente }
}

function sinFila<T>(errores: Record<string, T>, id: string): Record<string, T> {
  if (!(id in errores)) return errores
  const resto = { ...errores }
  delete resto[id]
  return resto
}

/* ------------------------------------------------------------------ Piezas */

function Tarjeta({ id, titulo, descripcion, children }: { id: string; titulo: string; descripcion?: string; children: ReactNode }) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-group rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block"
    >
      <div>
        <h2 id={id} className="text-section font-regular">
          {titulo}
        </h2>
        {descripcion ? <p className="text-body text-ink-muted">{descripcion}</p> : null}
      </div>
      {children}
    </section>
  )
}

/** Un hito. Va aparte para que la fecha (Date) sea la misma mientras no cambie el texto guardado. */
function HitoEditable({
  hito,
  indice,
  errores,
  alCambiar,
  alQuitarError,
  alPedirBorrar,
}: {
  hito: PortalMilestoneItem
  indice: number
  errores?: PortalMilestoneFieldErrors
  alCambiar: (cambio: Partial<PortalMilestoneItem>) => void
  alQuitarError: (campo: keyof PortalMilestoneFieldErrors) => void
  alPedirBorrar: () => void
}) {
  const fecha = useMemo(() => parseDraftDateString(hito.estimatedDate ?? ""), [hito.estimatedDate])
  const nombre = hito.name.trim() || `hito ${indice + 1}`

  return (
    <fieldset className="flex flex-col gap-snug rounded-control bg-canvas-sunken/50 p-group lg:flex-row lg:items-start">
      <legend className="sr-only">Hito {indice + 1}</legend>
      <div className="flex min-w-0 flex-1 flex-col gap-snug">
        <Field label="Nombre del hito" required error={errores?.name}>
          <Input
            value={hito.name}
            placeholder="Nombre del hito"
            onChange={(event) => {
              alQuitarError("name")
              alCambiar({ name: event.target.value })
            }}
            className="text-reading font-medium"
          />
        </Field>
        <Field label="Descripción" optional>
          <Textarea
            rows={2}
            value={hito.description}
            placeholder="Descripción del hito"
            onChange={(event) => alCambiar({ description: event.target.value })}
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-start gap-snug">
        <Field label="Fecha estimada" required error={errores?.estimatedDate} className="w-50">
          <DatePicker
            value={fecha}
            onChange={(elegida) => {
              alQuitarError("estimatedDate")
              alCambiar({ estimatedDate: formatDraftDateString(elegida) || null })
            }}
          />
        </Field>
        <div className="flex flex-col gap-compact">
          <p className="text-label">Estado</p>
          <Segmented
            label={`Estado de ${nombre}`}
            value={hito.status}
            onValueChange={(estado) => {
              alQuitarError("status")
              alCambiar({ status: estado as PortalMilestoneStatus })
            }}
            options={PORTAL_MILESTONE_STATUS_OPTIONS.map((value) => ({ value, label: PORTAL_MILESTONE_STATUS_LABELS[value] }))}
          />
          {errores?.status ? (
            <p className="flex items-start gap-related text-meta text-fn-danger">
              <Icon icon={CircleAlert} size="xs" className="mt-0.5" />
              {errores.status}
            </p>
          ) : null}
        </div>
        <IconButton icon={Trash2} label={`Eliminar ${nombre}`} className="mt-7" onClick={alPedirBorrar} />
      </div>
    </fieldset>
  )
}

/* ------------------------------------------------------------------ Pantalla */

export type PortalClientesProps = {
  projectId: string
  initialData: PortalClientesData
  previewContext: PortalClientesPreviewContext
  aviso?: string | null
}

/**
 * Si llegan datos nuevos del servidor (otro dispositivo, después de guardar), el editor
 * arranca de cero con ellos: la clave cambia y React lo vuelve a montar.
 */
export function PortalClientes(props: PortalClientesProps) {
  const { projectId, initialData } = props
  const clave = useMemo(
    () =>
      JSON.stringify({
        projectId,
        weatherCity: initialData.weatherCity,
        news: initialData.news,
        milestones: initialData.milestones,
      }),
    [projectId, initialData],
  )
  return <EditorDelPortal key={clave} {...props} />
}

function EditorDelPortal({ projectId, initialData, previewContext, aviso }: PortalClientesProps) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const enLinea = useEnLinea()

  const [vistaPrevia, setVistaPrevia] = useState(false)
  const [weatherCity, setWeatherCity] = useState(initialData.weatherCity)
  const [novedades, setNovedades] = useState<NovedadEnEdicion[]>(() => initialData.news.map(aEdicion))
  const [hitos, setHitos] = useState<PortalMilestoneItem[]>(() => initialData.milestones)
  const [novedadesQuitadas, setNovedadesQuitadas] = useState<string[]>([])
  const [hitosQuitados, setHitosQuitados] = useState<string[]>([])
  const [guardado, setGuardado] = useState<Foto>(() => fotoDeLosDatos(initialData))
  const [guardando, setGuardando] = useState(false)
  const [errorAlGuardar, setErrorAlGuardar] = useState<string | null>(null)
  const [erroresNovedades, setErroresNovedades] = useState<Record<string, PortalNewsFieldErrors>>({})
  const [erroresHitos, setErroresHitos] = useState<Record<string, PortalMilestoneFieldErrors>>({})
  const [descartando, setDescartando] = useState(false)
  const [borrando, setBorrando] = useState<BorradoPendiente | null>(null)

  const hayCambios = useMemo(
    () => !iguales(fotoDelEditor(weatherCity, novedades, hitos), guardado),
    [weatherCity, novedades, hitos, guardado],
  )

  // Al salir de la pantalla se liberan las vistas previas de las imágenes sin guardar.
  const ultimasNovedades = useRef<NovedadEnEdicion[]>([])
  useEffect(() => {
    ultimasNovedades.current = novedades
  }, [novedades])
  useEffect(() => {
    const ultimas = ultimasNovedades
    return () => {
      for (const item of ultimas.current) revokePortalNewsPreview(item.imageDraft)
    }
  }, [])

  const cambiarNovedad = (id: string, cambio: Partial<NovedadEnEdicion>) =>
    setNovedades((actuales) => actuales.map((item) => (item.id === id ? { ...item, ...cambio } : item)))
  const cambiarHito = (id: string, cambio: Partial<PortalMilestoneItem>) =>
    setHitos((actuales) => actuales.map((item) => (item.id === id ? { ...item, ...cambio } : item)))

  const agregarNovedad = () =>
    setNovedades((actuales) => [
      ...actuales,
      {
        id: crypto.randomUUID(),
        title: "",
        description: "",
        imageUrl: null,
        sortOrder: actuales.length,
        imageDraft: null,
        clearedImage: false,
      },
    ])

  const agregarHito = () =>
    setHitos((actuales) => [
      ...actuales,
      {
        id: crypto.randomUUID(),
        name: "",
        description: "",
        estimatedDate: null,
        status: "not_started",
        sortOrder: actuales.length,
      },
    ])

  const borrar = ({ tipo, id }: BorradoPendiente) => {
    if (tipo === "novedad") {
      revokePortalNewsPreview(novedades.find((item) => item.id === id)?.imageDraft ?? null)
      setNovedades((actuales) => actuales.filter((item) => item.id !== id).map((item, i) => ({ ...item, sortOrder: i })))
      setNovedadesQuitadas((actuales) => (actuales.includes(id) ? actuales : [...actuales, id]))
      setErroresNovedades((actuales) => sinFila(actuales, id))
    } else {
      setHitos((actuales) => actuales.filter((item) => item.id !== id).map((item, i) => ({ ...item, sortOrder: i })))
      setHitosQuitados((actuales) => (actuales.includes(id) ? actuales : [...actuales, id]))
      setErroresHitos((actuales) => sinFila(actuales, id))
    }
  }

  /** Vuelve a lo guardado (o a lo que devolvió el servidor al guardar). */
  const volverA = (foto: Foto) => {
    for (const item of novedades) revokePortalNewsPreview(item.imageDraft)
    setWeatherCity(foto.weatherCity)
    setNovedades(
      foto.news.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        imageUrl: item.imageState,
        sortOrder: item.sortOrder,
        imageDraft: null,
        clearedImage: false,
      })),
    )
    setHitos(foto.milestones)
    setNovedadesQuitadas([])
    setHitosQuitados([])
    setGuardado(foto)
    setErrorAlGuardar(null)
    setErroresNovedades({})
    setErroresHitos({})
  }

  const guardar = async () => {
    if (!enLinea || guardando) return
    setGuardando(true)
    setErrorAlGuardar(null)

    const estadoDeImagenes = Object.fromEntries(
      novedades.map((item) => [item.id, { hasImageDraft: Boolean(item.imageDraft), clearedImage: item.clearedImage }]),
    )
    const novedadesAGuardar = novedades.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.clearedImage ? null : item.imageUrl,
      sortOrder: item.sortOrder,
    }))

    const validacion = validatePortalClientesContent(novedadesAGuardar, hitos, estadoDeImagenes)
    if (!validacion.ok) {
      setGuardando(false)
      setErroresNovedades(validacion.newsErrors)
      setErroresHitos(validacion.milestoneErrors)
      setErrorAlGuardar(validacion.error)
      return
    }
    setErroresNovedades({})
    setErroresHitos({})

    // Las imágenes nuevas se suben recién ahora, una por una.
    for (let i = 0; i < novedades.length; i += 1) {
      const item = novedades[i]
      if (!item.imageDraft) continue
      const subida = await uploadPortalNewsImage(projectId, item.id, item.imageDraft.file)
      if (!subida.ok) {
        setGuardando(false)
        setErroresNovedades({ [item.id]: { image: subida.error } })
        setErrorAlGuardar(subida.error)
        toast.error(subida.error)
        return
      }
      novedadesAGuardar[i] = { ...novedadesAGuardar[i], imageUrl: subida.publicUrl }
    }

    const resultado = await savePortalClientesContent({
      projectId,
      weatherCity,
      news: novedadesAGuardar,
      milestones: hitos,
      removedNewsIds: novedadesQuitadas,
      removedMilestoneIds: hitosQuitados,
    })
    setGuardando(false)

    if (!resultado.ok) {
      setErrorAlGuardar(resultado.error)
      return
    }

    volverA(fotoDeLosDatos(resultado.data))
    void invalidateProjectQueries(queryClient, projectId)
    toast.success("Cambios guardados correctamente.")
  }

  const datosDeLaVistaPrevia = useMemo(
    () => ({
      weatherCity,
      news: novedades.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        sortOrder: item.sortOrder,
        imageUrl: item.clearedImage ? null : (item.imageDraft?.previewUrl ?? item.imageUrl),
      })),
      milestones: hitos,
      projectName: previewContext.projectName,
      projectLocation: "",
      projectEndDate: previewContext.projectEndDate,
      weather: previewContext.weather,
      units: previewContext.units,
    }),
    [weatherCity, novedades, hitos, previewContext],
  )

  const abrirVistaPrevia = (abrir: boolean) => {
    setVistaPrevia(abrir)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Cada aviso una sola vez, aunque el de la página diga lo mismo que el de sin señal.
  const avisos = [...new Set([aviso, enLinea ? null : AVISO_SIN_SENAL_PARA_GUARDAR].filter((texto): texto is string => Boolean(texto)))]

  if (vistaPrevia) {
    return (
      <div className={ENVOLTORIO}>
        <MiUnidad
          projectId={projectId}
          data={datosDeLaVistaPrevia}
          greetingName={previewContext.greetingName}
          topSlot={
            <Notice
              tone="caution"
              action={
                <Button variant="outline" size="compact" onClick={() => abrirVistaPrevia(false)}>
                  Volver a editar
                </Button>
              }
            >
              Estás viendo la vista previa del portal de clientes, con los cambios sin guardar.
            </Notice>
          }
        />
      </div>
    )
  }

  return (
    <div className={ENVOLTORIO}>
      <div className="mx-auto flex w-full max-w-252.5 flex-col gap-5">
        {avisos.map((texto) =>
          texto === AVISO_SIN_SENAL_PARA_GUARDAR ? (
            <Notice key={texto} tone="caution">
              {texto}
            </Notice>
          ) : (
            <p key={texto} role="status" className="rounded-control bg-canvas-sunken px-group py-snug text-meta text-ink-muted">
              {texto}
            </p>
          ),
        )}

        <div className="flex flex-col gap-group sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-compact">
            <h1 className="text-title">Portal de Clientes</h1>
            <p className="text-body text-ink-muted">Mantené actualizada la información y el contenido visible para tus clientes.</p>
          </div>
          <Button variant="outline" className="self-start sm:self-auto" disabled={guardando} onClick={() => abrirVistaPrevia(true)}>
            <Icon icon={Eye} /> Vista previa
          </Button>
        </div>

        <Tarjeta id="portal-clima" titulo="Clima en Mi Unidad" descripcion="Ciudad que se usa para mostrar el clima a tus clientes.">
          <Field label="Ciudad">
            <Input value={weatherCity} placeholder="Buenos Aires" onChange={(event) => setWeatherCity(event.target.value)} />
          </Field>
        </Tarjeta>

        <Tarjeta id="portal-novedades" titulo="Banner de Últimas Novedades">
          {novedades.length === 0 ? (
            <p className="text-body text-ink-muted">Todavía no hay novedades. Agregá la primera para mostrarla en el portal.</p>
          ) : null}
          {novedades.map((item, indice) => {
            const errores = erroresNovedades[item.id]
            const titulo = item.title.trim()
            return (
              <fieldset
                key={item.id}
                className="flex flex-col gap-snug border-t border-line pt-group first-of-type:border-t-0 first-of-type:pt-0"
              >
                <div className="flex items-center justify-between">
                  <legend className="text-label">Novedad {indice + 1}</legend>
                  <IconButton
                    icon={Trash2}
                    label={`Eliminar la novedad ${indice + 1}${titulo ? ` «${titulo}»` : ""}`}
                    size="compact"
                    onClick={() => setBorrando({ tipo: "novedad", id: item.id, indice, nombre: item.title })}
                  />
                </div>
                <div className="flex flex-col gap-snug sm:flex-row">
                  <div className="flex min-w-0 flex-1 flex-col gap-snug">
                    <Field label="Título" required error={errores?.title}>
                      <Input
                        value={item.title}
                        placeholder="Título"
                        onChange={(event) => {
                          setErroresNovedades((actuales) => sinError(actuales, item.id, "title"))
                          cambiarNovedad(item.id, { title: event.target.value })
                        }}
                      />
                    </Field>
                    <Field label="Descripción" required error={errores?.description}>
                      <Textarea
                        rows={3}
                        value={item.description}
                        placeholder="Descripción…"
                        onChange={(event) => {
                          setErroresNovedades((actuales) => sinError(actuales, item.id, "description"))
                          cambiarNovedad(item.id, { description: event.target.value })
                        }}
                      />
                    </Field>
                  </div>
                  <ImagenDeNovedad
                    borrador={item.imageDraft}
                    imagenGuardada={item.clearedImage ? null : item.imageUrl}
                    error={errores?.image}
                    alElegir={(borrador) => {
                      setErroresNovedades((actuales) => sinError(actuales, item.id, "image"))
                      cambiarNovedad(item.id, { imageDraft: borrador, clearedImage: false })
                    }}
                    alQuitar={() => {
                      setErroresNovedades((actuales) => sinError(actuales, item.id, "image"))
                      cambiarNovedad(item.id, { imageDraft: null, imageUrl: null, clearedImage: true })
                    }}
                  />
                </div>
              </fieldset>
            )
          })}
          <Button variant="outline" className="self-start" onClick={agregarNovedad}>
            <Icon icon={Plus} /> Agregar novedad
          </Button>
        </Tarjeta>

        <Tarjeta id="portal-hitos" titulo="Hitos de la construcción">
          {hitos.length === 0 ? (
            <p className="text-body text-ink-muted">Todavía no hay hitos. Agregá el primero para mostrar el avance en el portal.</p>
          ) : null}
          {hitos.map((item, indice) => (
            <HitoEditable
              key={item.id}
              hito={item}
              indice={indice}
              errores={erroresHitos[item.id]}
              alCambiar={(cambio) => cambiarHito(item.id, cambio)}
              alQuitarError={(campo) => setErroresHitos((actuales) => sinError(actuales, item.id, campo))}
              alPedirBorrar={() => setBorrando({ tipo: "hito", id: item.id, indice, nombre: item.name })}
            />
          ))}
          <Button variant="outline" className="self-start" onClick={agregarHito}>
            <Icon icon={Plus} /> Agregar hito
          </Button>
        </Tarjeta>
      </div>

      {hayCambios ? (
        <section
          aria-label="Cambios sin guardar"
          // Para que los campos que se enfocan no queden tapados por este pie.
          data-viewport-bottom-inset=""
          className="sticky bottom-0 z-(--z-sticky) mx-auto w-full max-w-252.5 animate-enter"
        >
          <div className="flex flex-col gap-snug rounded-t-control border border-b-0 border-action/20 bg-action-soft px-group py-group sm:flex-row sm:items-center sm:justify-between sm:px-block">
            <div aria-live="polite" className="min-w-0">
              <p className="text-reading font-medium">Cambios sin guardar</p>
              {errorAlGuardar ? (
                <p className="flex items-start gap-related text-body text-fn-danger">
                  <Icon icon={CircleAlert} size="xs" className="mt-1" />
                  {errorAlGuardar}
                </p>
              ) : (
                <p className="text-body">Guardá para que los cambios se vean reflejados en el portal.</p>
              )}
            </div>
            <div className="flex w-full gap-compact sm:w-auto">
              <Button variant="outline" className="flex-1 sm:flex-none" disabled={guardando} onClick={() => setDescartando(true)}>
                Descartar cambios
              </Button>
              <Button
                className="flex-1 sm:flex-none"
                loading={guardando}
                loadingLabel="Guardando"
                disabled={!enLinea}
                onClick={() => void guardar()}
              >
                <Icon icon={Check} /> Guardar cambios
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <ConfirmDialog
        open={borrando !== null}
        onOpenChange={(abierto) => (abierto ? null : setBorrando(null))}
        title={borrando?.tipo === "hito" ? "¿Eliminar hito?" : "¿Eliminar novedad?"}
        description={borrando ? textoDelBorrado(borrando) : ""}
        confirmLabel="Eliminar"
        tone="danger"
        onConfirm={() => {
          if (borrando) borrar(borrando)
          setBorrando(null)
        }}
      />
      <ConfirmDialog
        open={descartando}
        onOpenChange={setDescartando}
        title="¿Descartar los cambios?"
        description="Se perderán los cambios que no guardaste en el portal de clientes."
        confirmLabel="Descartar cambios"
        cancelLabel="Seguir editando"
        tone="danger"
        onConfirm={() => {
          volverA(guardado)
          setDescartando(false)
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ Carga y error */

/** Portal de Clientes mientras carga. */
export function PortalClientesCargando() {
  return (
    <div role="status" aria-busy className={ENVOLTORIO}>
      <span className="sr-only">Cargando el portal de clientes…</span>
      <div className="mx-auto flex w-full max-w-252.5 flex-col gap-5">
        <div className="flex flex-col gap-group sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-compact">
            <Skeleton className="h-8 w-[min(100%,260px)]" />
            <Skeleton className="h-4 w-[min(100%,420px)]" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="flex flex-col gap-group rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-14" />
        </div>
        <div className="flex flex-col gap-group rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block">
          <Skeleton className="h-6 w-64" />
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="flex flex-col gap-snug sm:flex-row">
              <div className="flex flex-1 flex-col gap-snug">
                <Skeleton className="h-14" />
                <Skeleton className="h-24" />
              </div>
              <Skeleton className="h-40 sm:w-60" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-group rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block">
          <Skeleton className="h-6 w-56" />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function PortalClientesError({ reintentar }: { reintentar: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="No pudimos cargar el portal de clientes"
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
