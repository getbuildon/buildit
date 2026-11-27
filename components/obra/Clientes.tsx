"use client"

import { useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Clock, Info, Link2, Mail, Phone, Plus, RefreshCw, SquarePen, Trash2, Users, X } from "lucide-react"
import { useMemo, useState, type FormEvent } from "react"

import { Avatar } from "@/library/atoms/avatar/Avatar"
import { Badge } from "@/library/atoms/badge/Badge"
import { Button } from "@/library/atoms/button/Button"
import { IconButton } from "@/library/atoms/button/IconButton"
import { Icon } from "@/library/atoms/icon/Icon"
import { Input } from "@/library/atoms/input/Input"
import { Skeleton } from "@/library/atoms/skeleton/Skeleton"
import { Tag } from "@/library/atoms/tag/Tag"
import { Tooltip } from "@/library/atoms/tooltip/Tooltip"
import { ConfirmDialog } from "@/library/molecules/confirm-dialog/ConfirmDialog"
import { Dialog, DialogContent } from "@/library/molecules/dialog/Dialog"
import { EmptyState } from "@/library/molecules/empty-state/EmptyState"
import { Field } from "@/library/molecules/field/Field"
import { Notice } from "@/library/molecules/notice/Notice"

import {
  addProjectClientInvitation,
  copyClientInvitationLink,
  getProjectClientSeatSummary,
  removeProjectClient,
  resendClientInvitation,
  revokeClientInvitation,
  updateProjectClient,
  updateProjectClientInvitation,
  type ProjectClient,
  type ProjectClientInvitation,
  type ProjectClientsData,
  type ProjectClientUnit,
  type ProjectUnitOption,
} from "@/app/project/[projectId]/clientes/actions"
import { ElegirUnidades } from "@/components/obra/clientes/ElegirUnidades"
import { useProjectPermission } from "@/components/project-shell/ProjectAccessProvider"
import { useToast } from "@/components/ui/toast"
import { AVISO_SIN_SENAL_PARA_CAMBIOS, useEnLinea } from "@/lib/api/useEnLinea"
import type { ClientSeatSummary } from "@/lib/company/subscriptionTypes"
import { invalidateProjectQueries } from "@/lib/project/invalidateProjectQueries"

/**
 * Clientes armado con la librería BuildOn: es «Pantallas/Obra/Clientes · Como hoy» del
 * catálogo con los datos de verdad. Los compradores de cada unidad (con acceso al portal) y
 * las invitaciones pendientes en la misma lista: agregar, editar datos y unidades, quitar,
 * y para las invitaciones copiar el link, reenviarla o revocarla.
 */

const ENVOLTORIO = "mx-auto flex w-full max-w-255.5 flex-col gap-group py-compact sm:gap-block sm:py-block"
const PATRON_DE_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SIN_CONEXION = "No pudimos conectarnos. Revisá la señal y probá de nuevo."
// Mismo texto que el resto de los contadores de lugares del plan (lib/company/projectSubscriptionLimits).
const AYUDA_DE_LUGARES = "Cantidad de usuarios sobre el máximo disponible para cada rol según tu plan."

type Persona = { firstName: string; lastName: string }
const nombreDe = (p: Persona) => `${p.firstName} ${p.lastName}`

type Fila = { tipo: "cliente"; cliente: ProjectClient } | { tipo: "invitacion"; invitacion: ProjectClientInvitation }
type Objetivo = { tipo: "cliente"; id: string } | { tipo: "invitacion"; id: string }

type Formulario = { nombre: string; apellido: string; mail: string; telefono: string; unidades: string[] }
type Campo = "nombre" | "apellido" | "mail" | "unidades"
type ErrorDeFormulario = { campo?: Campo; mensaje: string } | null

const FORMULARIO_VACIO: Formulario = { nombre: "", apellido: "", mail: "", telefono: "", unidades: [] }

/** Las mismas reglas de hoy, en el mismo orden. Devuelve el primer problema o los datos limpios. */
function validar(
  f: Formulario,
  { conMail, mailsUsados }: { conMail: boolean; mailsUsados: Set<string> },
): { error: NonNullable<ErrorDeFormulario> } | { datos: { firstName: string; lastName: string; email: string; phone: string | null; unitIds: string[] } } {
  const firstName = f.nombre.trim()
  const lastName = f.apellido.trim()
  const email = f.mail.trim().toLowerCase()
  const phone = f.telefono.trim() || null
  if (!firstName) return { error: { campo: "nombre", mensaje: "Ingresá el nombre." } }
  if (!lastName) return { error: { campo: "apellido", mensaje: "Ingresá el apellido." } }
  if (conMail) {
    if (!email || !PATRON_DE_MAIL.test(email)) return { error: { campo: "mail", mensaje: "Ingresá un correo electrónico válido." } }
    if (mailsUsados.has(email)) return { error: { campo: "mail", mensaje: "Ese correo ya está registrado." } }
  }
  if (f.unidades.length === 0) return { error: { campo: "unidades", mensaje: "Seleccioná al menos una unidad." } }
  return { datos: { firstName, lastName, email, phone, unitIds: f.unidades } }
}

/** Unidades que ya tienen cliente o invitación, salvo las de `excepto` (la que se edita). */
function unidadesOcupadas(clientes: ProjectClient[], invitaciones: ProjectClientInvitation[], excepto?: Objetivo | null) {
  const ids = new Set<string>()
  for (const c of clientes) {
    if (excepto?.tipo === "cliente" && excepto.id === c.userId) continue
    c.units.forEach((u) => ids.add(u.id))
  }
  for (const i of invitaciones) {
    if (excepto?.tipo === "invitacion" && excepto.id === i.invitationId) continue
    i.units.forEach((u) => ids.add(u.id))
  }
  return ids
}

function mailsUsados(clientes: ProjectClient[], invitaciones: ProjectClientInvitation[], excepto?: string) {
  const mails = new Set<string>()
  clientes.forEach((c) => mails.add(c.email.toLowerCase()))
  invitaciones.forEach((i) => i.invitationId !== excepto && mails.add(i.email.toLowerCase()))
  return mails
}

/** Corre una acción del servidor: si se corta la conexión, devuelve el error en vez de romper. */
async function intentar<T extends { ok: boolean }>(accion: () => Promise<T>): Promise<T | { ok: false; error: string }> {
  try {
    return await accion()
  } catch {
    return { ok: false, error: SIN_CONEXION }
  }
}

/* ------------------------------------------------------------------ Filas */

function Unidades({ lista }: { lista: ProjectClientUnit[] }) {
  if (lista.length === 0) return <div aria-hidden className="hidden md:block md:w-50 md:shrink-0" />
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-compact md:w-50 md:shrink-0 md:justify-end md:gap-snug">
      <span className="text-label whitespace-nowrap">
        {lista.length} {lista.length === 1 ? "unidad" : "unidades"}
      </span>
      <ul className="flex flex-wrap items-center gap-related" aria-label="Unidades">
        {lista.map((u) => (
          <li key={u.id}>
            {/* El código se ve; el nombre completo lo lee el lector de pantalla. */}
            <span className="sr-only">{u.label}</span>
            <Tag tone="naranja" title={u.label} aria-hidden>
              {u.pillLabel}
            </Tag>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FilaDeCliente({
  fila,
  puedeEditar,
  ocupada,
  alEditar,
  alQuitar,
  alCopiar,
  alReenviar,
}: {
  fila: Fila
  puedeEditar: boolean
  /** Qué acción de esta invitación está en curso (copiar o reenviar). */
  ocupada: "copiar" | "reenviar" | null
  alEditar: () => void
  alQuitar: () => void
  alCopiar: () => void
  alReenviar: () => void
}) {
  const pendiente = fila.tipo === "invitacion"
  const persona = fila.tipo === "cliente" ? fila.cliente : fila.invitacion
  const nombre = nombreDe(persona)
  const bloqueada = !puedeEditar || ocupada !== null

  const acciones = pendiente ? (
    <>
      <IconButton icon={Link2} label={`Copiar link de ${nombre}`} size="compact" disabled={bloqueada} loading={ocupada === "copiar"} onClick={alCopiar} />
      <IconButton icon={RefreshCw} label={`Reenviar invitación a ${nombre}`} size="compact" disabled={bloqueada} loading={ocupada === "reenviar"} onClick={alReenviar} />
      <IconButton icon={SquarePen} label={`Editar invitación de ${nombre}`} size="compact" disabled={bloqueada} onClick={alEditar} />
      <IconButton icon={Trash2} label={`Revocar invitación de ${nombre}`} size="compact" disabled={bloqueada} onClick={alQuitar} />
    </>
  ) : (
    <>
      <IconButton icon={SquarePen} label={`Editar a ${nombre}`} size="compact" disabled={bloqueada} onClick={alEditar} />
      <IconButton icon={Trash2} label={`Quitar a ${nombre}`} size="compact" disabled={bloqueada} onClick={alQuitar} />
    </>
  )

  return (
    <li className="border-b border-line p-group last:border-b-0">
      <div className="flex flex-col gap-snug md:flex-row md:items-center md:gap-group">
        <div className="flex min-w-0 items-start gap-snug md:flex-1">
          <Avatar
            name={nombre}
            src={fila.tipo === "cliente" ? fila.cliente.avatarUrl : null}
            size="md"
            tone={pendiente ? undefined : "naranja"}
            className={pendiente ? "bg-canvas-track text-ink-muted" : undefined}
          />
          <div className="flex min-w-0 flex-1 items-start justify-between gap-compact">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-compact">
                <h3 className="truncate text-label">{nombre}</h3>
                {pendiente ? (
                  <Badge tone="caution" size="compact" icon={Clock}>
                    Pendiente
                  </Badge>
                ) : null}
              </div>
              <div className="mt-related flex flex-col gap-related text-body text-ink-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-snug">
                <span className="flex min-w-0 items-center gap-1.5">
                  <Icon icon={Mail} size="xs" className="shrink-0" />
                  <span className="sr-only">Mail: </span>
                  <span className="truncate">{persona.email}</span>
                </span>
                {persona.phone ? (
                  <span className="flex items-center gap-1.5">
                    <Icon icon={Phone} size="xs" className="shrink-0" />
                    <span className="sr-only">Teléfono: </span>
                    {persona.phone}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-related md:hidden">{acciones}</div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-snug border-t border-line pt-snug md:border-0 md:pt-0">
          <Unidades lista={persona.units} />
          <div className="hidden shrink-0 items-center gap-related md:flex">{acciones}</div>
        </div>
      </div>
    </li>
  )
}

/* ------------------------------------------------------------------ Editar */

type GuardarCliente = (userId: string, datos: { firstName: string; lastName: string; phone: string | null; unitIds: string[] }) => Promise<string | null>
type GuardarInvitacion = (
  invitationId: string,
  datos: { firstName: string; lastName: string; email: string; phone: string | null; unitIds: string[] },
) => Promise<string | null>

/** El contenido del diálogo de edición. Se monta de nuevo para cada persona: arranca con sus datos. */
function EditarCliente({
  fila,
  unidades,
  ocupadas,
  mailsTomados,
  enLinea,
  alCerrar,
  alGuardarCliente,
  alGuardarInvitacion,
}: {
  fila: Fila
  unidades: ProjectUnitOption[]
  ocupadas: Set<string>
  mailsTomados: Set<string>
  enLinea: boolean
  alCerrar: () => void
  alGuardarCliente: GuardarCliente
  alGuardarInvitacion: GuardarInvitacion
}) {
  const persona = fila.tipo === "cliente" ? fila.cliente : fila.invitacion
  const [form, setForm] = useState<Formulario>({
    nombre: persona.firstName,
    apellido: persona.lastName,
    mail: persona.email,
    telefono: persona.phone ?? "",
    unidades: persona.units.map((u) => u.id),
  })
  const [error, setError] = useState<ErrorDeFormulario>(null)
  const [guardando, setGuardando] = useState(false)
  const cambiar = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) => {
    setForm((previo) => ({ ...previo, [campo]: valor }))
    if (error) setError(null)
  }
  const errorDe = (campo: Campo) => (error?.campo === campo ? error.mensaje : undefined)

  const guardar = async () => {
    const resultado = validar(form, { conMail: fila.tipo === "invitacion", mailsUsados: mailsTomados })
    if ("error" in resultado) return setError(resultado.error)
    setGuardando(true)
    setError(null)
    const { email, ...resto } = resultado.datos
    const falla =
      fila.tipo === "cliente"
        ? await alGuardarCliente(fila.cliente.userId, resto)
        : await alGuardarInvitacion(fila.invitacion.invitationId, { ...resto, email })
    setGuardando(false)
    if (falla === null) return alCerrar()
    setError({ mensaje: falla })
  }

  return (
    <DialogContent
      title={fila.tipo === "invitacion" ? "Editar invitación" : "Editar cliente"}
      description={`Actualizá los datos de ${nombreDe(persona)}.`}
      footer={
        <>
          <Button variant="outline" disabled={guardando} onClick={alCerrar}>
            Cancelar
          </Button>
          <Button loading={guardando} loadingLabel="Guardando" disabled={!enLinea} onClick={() => void guardar()}>
            Confirmar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-group">
        <div className="flex items-center gap-snug rounded-control border border-line bg-canvas-sunken px-group py-snug">
          <Avatar name={nombreDe(persona)} src={fila.tipo === "cliente" ? fila.cliente.avatarUrl : null} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-compact">
              <p className="truncate text-label">{nombreDe(persona)}</p>
              {fila.tipo === "invitacion" ? (
                <Badge tone="caution" size="compact" icon={Clock}>
                  Pendiente
                </Badge>
              ) : null}
            </div>
            <p className="flex items-center gap-1.5 text-meta text-ink-muted">
              <Icon icon={Mail} size="xs" className="shrink-0" />
              <span className="truncate">{persona.email}</span>
            </p>
          </div>
        </div>
        {!enLinea ? <Notice tone="caution">{AVISO_SIN_SENAL_PARA_CAMBIOS}</Notice> : null}
        <div className="grid gap-snug sm:grid-cols-2">
          <Field label="Nombre" required error={errorDe("nombre")}>
            <Input value={form.nombre} onChange={(e) => cambiar("nombre", e.target.value)} placeholder="Nombre" autoComplete="off" />
          </Field>
          <Field label="Apellido" required error={errorDe("apellido")}>
            <Input value={form.apellido} onChange={(e) => cambiar("apellido", e.target.value)} placeholder="Apellido" autoComplete="off" />
          </Field>
          <Field
            label="Mail"
            required
            error={errorDe("mail")}
            description={fila.tipo === "cliente" ? "El mail de un cliente que ya entró no se puede cambiar." : undefined}
          >
            <Input
              type="email"
              value={form.mail}
              onChange={(e) => cambiar("mail", e.target.value)}
              placeholder="correo@ejemplo.com"
              autoComplete="off"
              disabled={fila.tipo === "cliente"}
            />
          </Field>
          <Field label="Teléfono" optional>
            <Input type="tel" value={form.telefono} onChange={(e) => cambiar("telefono", e.target.value)} placeholder="+54 9 351 123 4567" autoComplete="off" />
          </Field>
          <Field label="Unidades" required error={errorDe("unidades")} className="sm:col-span-2">
            <ElegirUnidades opciones={unidades} ocupadas={ocupadas} value={form.unidades} onChange={(ids) => cambiar("unidades", ids)} disabled={guardando} />
          </Field>
        </div>
        {error && !error.campo ? (
          <p role="alert" className="text-body text-fn-danger">
            {error.mensaje}
          </p>
        ) : null}
      </div>
    </DialogContent>
  )
}

/* ------------------------------------------------------------------ Pantalla */

/** Cambios que ya se guardaron y todavía no llegaron con `data`. Se descartan cuando `data` cambia. */
type Local = {
  base: ProjectClientsData
  clients: ProjectClient[]
  pendingInvitations: ProjectClientInvitation[]
  seatSummary: ClientSeatSummary | null
}

export type ClientesProps = {
  projectId: string
  data: ProjectClientsData
  aviso?: string | null
}

export function Clientes({ projectId, data, aviso }: ClientesProps) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const enLinea = useEnLinea()
  const puedeAdministrar = useProjectPermission("manageClients")
  const puedeEditar = puedeAdministrar && enLinea

  const [local, setLocal] = useState<Local | null>(null)
  const vigente = local && local.base === data ? local : data
  const { clients: clientes, pendingInvitations: invitaciones, seatSummary: lugares } = vigente
  const unidades = data.unitOptions

  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState<Formulario>(FORMULARIO_VACIO)
  const [errorForm, setErrorForm] = useState<ErrorDeFormulario>(null)
  const [agregando, setAgregando] = useState(false)
  const [editando, setEditando] = useState<Objetivo | null>(null)
  const [quitando, setQuitando] = useState<Fila | null>(null)
  const [ocupada, setOcupada] = useState<{ id: string; accion: "copiar" | "reenviar" } | null>(null)

  /** Aplica un cambio ya guardado sobre lo que se ve, hasta que llegue la versión nueva. */
  const actualizar = (cambio: (actual: Local) => Partial<Local>) =>
    setLocal((previo) => {
      const actual: Local =
        previo && previo.base === data
          ? previo
          : { base: data, clients: data.clients, pendingInvitations: data.pendingInvitations, seatSummary: data.seatSummary }
      return { ...actual, ...cambio(actual) }
    })

  /** Después de guardar: vuelve a pedir los datos de la obra y el contador de lugares. */
  const refrescar = () => {
    void invalidateProjectQueries(queryClient, projectId)
    void getProjectClientSeatSummary(projectId)
      .then((resumen) => actualizar(() => ({ seatSummary: resumen })))
      .catch(() => undefined)
  }

  const ocupadasTodas = useMemo(() => unidadesOcupadas(clientes, invitaciones), [clientes, invitaciones])
  const filas: Fila[] = [
    ...clientes.map((cliente) => ({ tipo: "cliente" as const, cliente })),
    ...invitaciones.map((invitacion) => ({ tipo: "invitacion" as const, invitacion })),
  ]
  const filaEditada =
    editando?.tipo === "cliente"
      ? filas.find((f) => f.tipo === "cliente" && f.cliente.userId === editando.id)
      : editando
        ? filas.find((f) => f.tipo === "invitacion" && f.invitacion.invitationId === editando.id)
        : undefined

  const abrirForm = () => {
    setForm(FORMULARIO_VACIO)
    setErrorForm(null)
    setMostrarForm(true)
  }
  const cerrarForm = () => {
    setForm(FORMULARIO_VACIO)
    setErrorForm(null)
    setMostrarForm(false)
  }
  const cambiarForm = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) => {
    setForm((previo) => ({ ...previo, [campo]: valor }))
    if (errorForm) setErrorForm(null)
  }
  const errorDe = (campo: Campo) => (errorForm?.campo === campo ? errorForm.mensaje : undefined)

  const agregar = async (evento: FormEvent) => {
    evento.preventDefault()
    if (!puedeEditar || agregando) return
    const resultado = validar(form, { conMail: true, mailsUsados: mailsUsados(clientes, invitaciones) })
    if ("error" in resultado) return setErrorForm(resultado.error)
    setAgregando(true)
    setErrorForm(null)
    const respuesta = await intentar(() => addProjectClientInvitation(projectId, resultado.datos))
    setAgregando(false)
    if (!respuesta.ok) return setErrorForm({ mensaje: "error" in respuesta ? respuesta.error : SIN_CONEXION })
    const nueva = respuesta.invitation
    actualizar((actual) => ({
      pendingInvitations: [...actual.pendingInvitations.filter((i) => i.invitationId !== nueva.invitationId), nueva],
    }))
    toast.success(`Invitación enviada a ${nueva.email}.`)
    cerrarForm()
    refrescar()
  }

  const guardarCliente: GuardarCliente = async (userId, datos) => {
    const respuesta = await intentar(() => updateProjectClient(projectId, userId, datos))
    if (!respuesta.ok) return "error" in respuesta ? respuesta.error : SIN_CONEXION
    const cliente = respuesta.client
    actualizar((actual) => ({ clients: actual.clients.map((c) => (c.userId === userId ? cliente : c)) }))
    toast.success(`${nombreDe(cliente)} fue actualizado.`)
    refrescar()
    return null
  }

  const guardarInvitacion: GuardarInvitacion = async (invitationId, datos) => {
    const respuesta = await intentar(() => updateProjectClientInvitation(projectId, invitationId, datos))
    if (!respuesta.ok) return "error" in respuesta ? respuesta.error : SIN_CONEXION
    const invitacion = respuesta.invitation
    actualizar((actual) => ({
      pendingInvitations: actual.pendingInvitations.map((i) => (i.invitationId === invitationId ? invitacion : i)),
    }))
    toast.success(`Invitación de ${nombreDe(invitacion)} actualizada.`)
    refrescar()
    return null
  }

  const copiarLink = async (invitationId: string) => {
    setOcupada({ id: invitationId, accion: "copiar" })
    const respuesta = await intentar(() => copyClientInvitationLink(invitationId, projectId))
    setOcupada(null)
    if (!respuesta.ok) return toast.error("error" in respuesta ? respuesta.error : SIN_CONEXION)
    try {
      await navigator.clipboard.writeText(respuesta.url)
      toast.success("Link copiado. El enlace anterior deja de funcionar.")
    } catch {
      toast.error("No se pudo copiar el link.")
    }
  }

  const reenviar = async (invitationId: string) => {
    setOcupada({ id: invitationId, accion: "reenviar" })
    const respuesta = await intentar(() => resendClientInvitation(invitationId, projectId))
    setOcupada(null)
    if (!respuesta.ok) return toast.error("error" in respuesta ? respuesta.error : SIN_CONEXION)
    toast.success("Confirmación reenviada. El enlace anterior deja de funcionar.")
  }

  /** Quitar un cliente o revocar una invitación. Si falla, el diálogo queda abierto. */
  const confirmarQuitar = async () => {
    if (!quitando) return
    if (quitando.tipo === "cliente") {
      const { userId } = quitando.cliente
      const respuesta = await intentar(() => removeProjectClient(projectId, userId))
      if (!respuesta.ok) {
        toast.error("error" in respuesta ? respuesta.error : SIN_CONEXION)
        throw new Error("No se pudo quitar")
      }
      actualizar((actual) => ({ clients: actual.clients.filter((c) => c.userId !== userId) }))
      toast.success(`${nombreDe(quitando.cliente)} fue eliminado del proyecto.`)
    } else {
      const { invitationId } = quitando.invitacion
      const respuesta = await intentar(() => revokeClientInvitation(invitationId, projectId))
      if (!respuesta.ok) {
        toast.error("error" in respuesta ? respuesta.error : SIN_CONEXION)
        throw new Error("No se pudo revocar")
      }
      actualizar((actual) => ({ pendingInvitations: actual.pendingInvitations.filter((i) => i.invitationId !== invitationId) }))
      toast.success(`Invitación de ${nombreDe(quitando.invitacion)} revocada.`)
    }
    refrescar()
  }

  const idDe = (f: Fila) => (f.tipo === "cliente" ? f.cliente.userId : f.invitacion.invitationId)
  const objetivoDe = (f: Fila): Objetivo => (f.tipo === "cliente" ? { tipo: "cliente", id: f.cliente.userId } : { tipo: "invitacion", id: f.invitacion.invitationId })
  const nombreQuitando = quitando ? nombreDe(quitando.tipo === "cliente" ? quitando.cliente : quitando.invitacion) : ""

  return (
    <div className={ENVOLTORIO}>
      {aviso ? (
        <p role="status" className="rounded-control bg-canvas-sunken px-group py-snug text-meta text-ink-muted">
          {aviso}
        </p>
      ) : null}
      {!enLinea && puedeAdministrar ? <Notice tone="caution">{AVISO_SIN_SENAL_PARA_CAMBIOS}</Notice> : null}

      <div className="flex flex-col gap-group sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-compact">
          <h1 className="text-title">Clientes</h1>
          {lugares ? (
            <p className="flex items-center gap-compact text-body text-ink-muted">
              {lugares.usage}/{lugares.limit} Clientes en este proyecto
              <Tooltip content={AYUDA_DE_LUGARES}>
                <button type="button" aria-label="Cómo se cuentan los clientes" className="focus-ring inline-flex cursor-help rounded-pill text-ink-muted">
                  <Icon icon={Info} />
                </button>
              </Tooltip>
            </p>
          ) : null}
        </div>
        <Button
          size="large"
          className="w-full sm:w-auto"
          disabled={!mostrarForm && !puedeEditar}
          aria-expanded={mostrarForm}
          onClick={() => (mostrarForm ? cerrarForm() : abrirForm())}
        >
          <Icon icon={mostrarForm ? X : Plus} /> {mostrarForm ? "Cancelar" : "Agregar cliente"}
        </Button>
      </div>

      {mostrarForm && puedeAdministrar ? (
        <section aria-labelledby="nuevo-cliente" className="flex flex-col gap-group rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block">
          <div className="flex items-baseline justify-between gap-snug">
            <h2 id="nuevo-cliente" className="text-section font-regular">
              Nuevo cliente
            </h2>
            <p className="text-meta text-ink-muted">
              <span aria-hidden className="text-fn-danger">
                *
              </span>{" "}
              Campos obligatorios
            </p>
          </div>
          <form noValidate onSubmit={(e) => void agregar(e)} className="flex flex-col gap-snug">
            <div className="grid grid-cols-1 gap-snug sm:grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto] lg:items-end">
              <Field label="Nombre" required error={errorDe("nombre")}>
                <Input value={form.nombre} onChange={(e) => cambiarForm("nombre", e.target.value)} autoComplete="off" />
              </Field>
              <Field label="Apellido" required error={errorDe("apellido")}>
                <Input value={form.apellido} onChange={(e) => cambiarForm("apellido", e.target.value)} autoComplete="off" />
              </Field>
              <Field label="Mail" required error={errorDe("mail")}>
                <Input type="email" value={form.mail} onChange={(e) => cambiarForm("mail", e.target.value)} placeholder="correo@ejemplo.com" autoComplete="off" />
              </Field>
              <Field label="Teléfono" optional>
                <Input type="tel" value={form.telefono} onChange={(e) => cambiarForm("telefono", e.target.value)} placeholder="+54 9 351 123 4567" autoComplete="off" />
              </Field>
              <Field label="Unidades" required error={errorDe("unidades")}>
                <ElegirUnidades opciones={unidades} ocupadas={ocupadasTodas} value={form.unidades} onChange={(ids) => cambiarForm("unidades", ids)} />
              </Field>
              <Button type="submit" size="large" loading={agregando} loadingLabel="Agregando" disabled={!enLinea}>
                <Icon icon={Plus} /> Agregar
              </Button>
            </div>
            {errorForm && !errorForm.campo ? (
              <p role="alert" className="text-body text-fn-danger">
                {errorForm.mensaje}
              </p>
            ) : null}
          </form>
        </section>
      ) : null}

      {filas.length > 0 ? (
        <div className="flex flex-col gap-snug">
          <section aria-labelledby="lista-clientes" className="rounded-surface border border-line bg-canvas-raised shadow-hint">
            <h2 id="lista-clientes" className="sr-only">
              Clientes e invitaciones
            </h2>
            <ul>
              {filas.map((fila) => (
                <FilaDeCliente
                  key={`${fila.tipo}-${idDe(fila)}`}
                  fila={fila}
                  puedeEditar={puedeEditar}
                  ocupada={ocupada?.id === idDe(fila) ? ocupada.accion : null}
                  alEditar={() => setEditando(objetivoDe(fila))}
                  alQuitar={() => {
                    setQuitando(fila)
                    setEditando(null)
                  }}
                  alCopiar={() => void copiarLink(idDe(fila))}
                  alReenviar={() => void reenviar(idDe(fila))}
                />
              ))}
            </ul>
          </section>
          <p className="text-meta text-ink-muted">
            Mostrando {filas.length} de {filas.length} clientes
          </p>
        </div>
      ) : (
        <div className="rounded-surface border border-line bg-canvas-raised shadow-hint">
          <EmptyState
            icon={Users}
            title="No hay clientes en este proyecto"
            description="Sumá a los compradores para que sigan el avance de su unidad desde el portal."
            action={
              puedeAdministrar && !mostrarForm ? (
                <Button disabled={!puedeEditar} onClick={abrirForm}>
                  <Icon icon={Plus} /> Agregar cliente
                </Button>
              ) : undefined
            }
          />
        </div>
      )}

      <Dialog open={puedeAdministrar && filaEditada !== undefined} onOpenChange={(abierto) => !abierto && setEditando(null)}>
        {filaEditada && editando ? (
          <EditarCliente
            key={`${editando.tipo}-${editando.id}`}
            fila={filaEditada}
            unidades={unidades}
            ocupadas={unidadesOcupadas(clientes, invitaciones, editando)}
            mailsTomados={mailsUsados(clientes, invitaciones, editando.tipo === "invitacion" ? editando.id : undefined)}
            enLinea={enLinea}
            alCerrar={() => setEditando(null)}
            alGuardarCliente={guardarCliente}
            alGuardarInvitacion={guardarInvitacion}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={puedeAdministrar && quitando !== null}
        onOpenChange={(abierto) => !abierto && setQuitando(null)}
        title={quitando?.tipo === "invitacion" ? `¿Revocar la invitación de ${nombreQuitando}?` : `¿Quitar a ${nombreQuitando}?`}
        description={
          quitando?.tipo === "invitacion"
            ? "El link de la invitación deja de funcionar."
            : "Se quita del proyecto y deja de ver el avance de sus unidades en el portal."
        }
        confirmLabel={quitando?.tipo === "invitacion" ? "Revocar invitación" : "Quitar cliente"}
        tone="danger"
        onConfirm={confirmarQuitar}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ Estados */

/** Clientes mientras carga. */
export function ClientesCargando() {
  return (
    <div role="status" aria-busy className={ENVOLTORIO}>
      <span className="sr-only">Cargando los clientes…</span>
      <div className="flex flex-col gap-group sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-compact">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-control-large w-full sm:w-44" />
      </div>
      <div className="rounded-surface border border-line bg-canvas-raised shadow-hint">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-snug border-b border-line p-group last:border-b-0">
            <Skeleton className="size-avatar-md rounded-pill" />
            <div className="flex flex-1 flex-col gap-related">
              <Skeleton className="h-4 w-[min(100%,200px)]" />
              <Skeleton className="h-4 w-[min(100%,280px)]" />
            </div>
            <Skeleton className="hidden h-6 w-32 md:block" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ClientesError({ reintentar }: { reintentar: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="No pudimos cargar los clientes"
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
