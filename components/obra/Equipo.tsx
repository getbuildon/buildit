"use client"

import { useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  ChevronDown,
  Clock,
  Info,
  Link2,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SquarePen,
  Trash2,
  X,
} from "lucide-react"
import { useState, type FormEvent, type ReactNode } from "react"

import { Avatar } from "@/library/atoms/avatar/Avatar"
import { Badge } from "@/library/atoms/badge/Badge"
import { Button } from "@/library/atoms/button/Button"
import { IconButton } from "@/library/atoms/button/IconButton"
import { Icon } from "@/library/atoms/icon/Icon"
import { Input } from "@/library/atoms/input/Input"
import { Link } from "@/library/atoms/link/Link"
import { Skeleton } from "@/library/atoms/skeleton/Skeleton"
import { Tooltip } from "@/library/atoms/tooltip/Tooltip"
import { cn } from "@/library/lib/cn"
import { ConfirmDialog } from "@/library/molecules/confirm-dialog/ConfirmDialog"
import { Dialog, DialogContent } from "@/library/molecules/dialog/Dialog"
import { EmptyState } from "@/library/molecules/empty-state/EmptyState"
import { Field } from "@/library/molecules/field/Field"
import { InputGroup } from "@/library/molecules/input-group/InputGroup"
import { Notice } from "@/library/molecules/notice/Notice"
import { Select, SelectGroup, SelectItem } from "@/library/molecules/select/Select"

import {
  addTeamMember,
  copyTeamInvitationLink,
  removeTeamMember,
  resendTeamInvitation,
  revokeTeamInvitation,
  updateTeamMember,
  type ProjectTeamData,
  type ProjectTeamInvitation,
  type ProjectTeamMember,
} from "@/app/project/[projectId]/equipo/actions"
import { PedirMejoraDePlan } from "@/components/obra/equipo/PedirMejoraDePlan"
import { TablaDePermisos } from "@/components/obra/equipo/TablaDePermisos"
import { useProjectPermission } from "@/components/project-shell/ProjectAccessProvider"
import { useToast } from "@/components/ui/toast"
import { AVISO_SIN_SENAL_PARA_CAMBIOS, useEnLinea } from "@/lib/api/useEnLinea"
import {
  formatTeamSeatSummarySubtitle,
  getUserTypeLimitDisplayLabel,
  isUserTypeAtSeatLimit,
  TEAM_SEAT_SUMMARY_TOOLTIP,
} from "@/lib/company/projectSubscriptionLimits"
import type { TeamSeatSummary } from "@/lib/company/subscriptionTypes"
import { invalidateProjectQueries } from "@/lib/project/invalidateProjectQueries"
import { USER_TYPE_ROLES, type ProjectTeamRole, type ProjectUserType } from "@/lib/projects/createProjectDraft"
import {
  decodeTeamRoleSelection,
  encodeTeamRoleSelection,
  getProjectUserTypeDisplayLabel,
  getProjectUserTypeForTeamSelect,
  isProtectedProjectOwnerMember,
  PROJECT_TEAM_SELECTABLE_USER_TYPES,
} from "@/lib/projects/projectUserTypeDisplay"

/**
 * Equipo armado con la librería BuildOn: es «Pantallas/Obra/Equipo · Como hoy» del
 * catálogo con los datos de verdad. Miembros con búsqueda, alta (o «unirme» para quien
 * administra la empresa), cambio de rol, baja, invitaciones pendientes, cupos del plan
 * con pedido de mejora y la tabla de permisos. Los cambios necesitan señal.
 */

const ENVOLTORIO = "mx-auto flex w-full max-w-252.75 flex-col gap-group py-compact pb-10 sm:gap-block sm:py-block"
const PATRON_DE_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ERROR_DE_RED = "No pudimos guardar el cambio. Revisá la conexión y probá de nuevo."

const nombreDe = (persona: { firstName: string; lastName: string }) => `${persona.firstName} ${persona.lastName}`.trim()

/* ------------------------------------------------------------------ Roles */

const GRUPOS_DE_ROLES = PROJECT_TEAM_SELECTABLE_USER_TYPES.map((tipo) => ({
  tipo,
  etiqueta: getProjectUserTypeDisplayLabel(tipo) ?? tipo,
  roles: USER_TYPE_ROLES[tipo],
}))

/** El rol que corresponde al miembro en el selector (el Owner se muestra como Admin). */
function seleccionDe(miembro: ProjectTeamMember): string {
  const tipo = getProjectUserTypeForTeamSelect(miembro.userType ?? PROJECT_TEAM_SELECTABLE_USER_TYPES[0])
  const rol = USER_TYPE_ROLES[tipo].find((r) => r === miembro.roleLabel) ?? USER_TYPE_ROLES[tipo][0]
  return encodeTeamRoleSelection(tipo, rol)
}

/** Selector de rol agrupado por tipo de usuario. Los id y aria-* que pone el Field van al botón. */
function SelectorDeRol({
  value,
  onChange,
  invalid,
  disabled,
  ...aria
}: {
  value: string
  onChange: (valor: string) => void
  invalid?: boolean
  disabled?: boolean
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean | "true" | "false"
  "aria-required"?: boolean
}) {
  return (
    <Select {...aria} value={value || undefined} onValueChange={onChange} placeholder="Elegí un rol" invalid={invalid} disabled={disabled}>
      {GRUPOS_DE_ROLES.map((grupo) => (
        <SelectGroup key={grupo.tipo} label={grupo.etiqueta}>
          {grupo.roles.map((rol) => (
            <SelectItem key={rol} value={encodeTeamRoleSelection(grupo.tipo, rol)}>
              {rol}
            </SelectItem>
          ))}
        </SelectGroup>
      ))}
    </Select>
  )
}

/** Aviso de que no quedan lugares del plan para ese tipo, con el pedido de mejora. */
function AvisoDeLimite({ tipo, alMejorar, sinSenal }: { tipo: ProjectUserType; alMejorar: () => void; sinSenal: boolean }) {
  return (
    <Notice
      tone="info"
      title={`Alcanzaste el límite de usuarios tipo «${getUserTypeLimitDisplayLabel(tipo)}».`}
      action={
        <Link asChild tone="ink">
          <button type="button" onClick={alMejorar} disabled={sinSenal} className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-(--state-disabled-opacity)">
            Mejorar plan
          </button>
        </Link>
      }
    >
      Para sumar más usuarios de este tipo, pedile una mejora del plan al administrador de la organización.
    </Notice>
  )
}

/* ------------------------------------------------------------------ Filas */

function FilaDePersona({
  persona,
  avatar,
  pendiente,
  esVos,
  tipo,
  acciones,
}: {
  persona: { firstName: string; lastName: string; email: string; roleLabel: string }
  avatar?: string | null
  pendiente?: boolean
  esVos?: boolean
  tipo: { userType: ProjectUserType | null; userTypeLabel: string | null }
  acciones: ReactNode
}) {
  const nombre = nombreDe(persona)
  const etiquetaDeTipo = tipo.userType === "Owner" ? "Owner" : tipo.userTypeLabel
  return (
    <li className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] gap-x-snug gap-y-compact border-b border-line p-group last:border-b-0 hover:bg-canvas md:grid-cols-[2.5rem_minmax(0,1fr)_18.75rem_auto] md:items-center md:gap-x-group">
      <Avatar
        name={nombre || persona.email}
        src={pendiente ? undefined : avatar}
        size="md"
        tone={pendiente ? undefined : "naranja"}
        className={cn("row-span-2 self-start md:row-span-1 md:self-center", pendiente && "bg-canvas-track text-ink-muted")}
      />
      <div className="col-start-2 row-start-1 flex min-w-0 flex-col gap-related">
        <div className="flex flex-wrap items-center gap-compact">
          <h3 className="truncate text-label">{nombre}</h3>
          {esVos ? (
            <Badge tone="action" size="compact" className="bg-action text-action-ink">
              Vos
            </Badge>
          ) : null}
          {pendiente ? (
            <Badge tone="caution" size="compact" icon={Clock}>
              Pendiente
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {etiquetaDeTipo ? (
            <Badge tone="action" size="compact" className={tipo.userType === "Owner" ? "bg-action text-action-ink" : undefined}>
              {etiquetaDeTipo}
            </Badge>
          ) : null}
          {persona.roleLabel ? <span className="text-meta">{persona.roleLabel}</span> : null}
        </div>
      </div>
      <p className="col-span-2 col-start-2 row-start-2 flex min-w-0 items-center gap-compact text-meta text-ink-muted md:col-span-1 md:col-start-3 md:row-start-1">
        <Icon icon={Mail} size="xs" className="shrink-0" />
        <span className="truncate">{persona.email}</span>
      </p>
      <div className="col-start-3 row-start-1 flex items-center justify-end gap-related md:col-start-4">{acciones}</div>
    </li>
  )
}

/* ------------------------------------------------------------------ Editar miembro */

/** Cambiar el rol de un miembro. Quien lo usa le pone `key` por miembro: el estado arranca de cero. */
function EditarMiembro({
  miembro,
  cupos,
  sinSenal,
  alCerrar,
  alGuardar,
  alPedirMejora,
}: {
  miembro: ProjectTeamMember | null
  cupos: TeamSeatSummary | null
  sinSenal: boolean
  alCerrar: () => void
  alGuardar: (tipo: ProjectUserType, rol: ProjectTeamRole) => Promise<{ ok: true } | { ok: false; error: string }>
  alPedirMejora: (tipo: ProjectUserType) => void
}) {
  const [seleccion, setSeleccion] = useState(() => (miembro ? seleccionDe(miembro) : ""))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  if (!miembro) return null

  const elegido = decodeTeamRoleSelection(seleccion)
  const tipoActual = getProjectUserTypeForTeamSelect(miembro.userType ?? PROJECT_TEAM_SELECTABLE_USER_TYPES[0])
  const sinLugar = elegido != null && elegido.userType !== tipoActual && isUserTypeAtSeatLimit(cupos, elegido.userType)

  const guardar = async () => {
    if (!elegido || guardando) return
    if (seleccion === seleccionDe(miembro)) {
      alCerrar()
      return
    }
    setGuardando(true)
    setError("")
    const resultado = await alGuardar(elegido.userType, elegido.role)
    setGuardando(false)
    if (resultado.ok) alCerrar()
    else setError(resultado.error)
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && !guardando && alCerrar()}>
      <DialogContent
        title="Editar miembro"
        description={`Actualizá el rol de ${nombreDe(miembro)}.`}
        footer={
          <>
            <Button variant="outline" onClick={alCerrar} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={() => void guardar()} loading={guardando} loadingLabel="Guardando…" disabled={!elegido || sinLugar || sinSenal}>
              Guardar cambios
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-group">
          <div className="flex items-center gap-snug rounded-control border border-line bg-canvas px-group py-snug">
            <Avatar name={nombreDe(miembro) || miembro.email} src={miembro.avatarUrl} size="md" tone="naranja" />
            <div className="flex min-w-0 flex-1 flex-col gap-related">
              <p className="truncate text-label">{nombreDe(miembro)}</p>
              <p className="flex min-w-0 items-center gap-compact text-meta text-ink-muted">
                <Icon icon={Mail} size="xs" className="shrink-0" />
                <span className="truncate">{miembro.email}</span>
              </p>
            </div>
          </div>
          <Field label="Rol" required>
            <SelectorDeRol
              value={seleccion}
              invalid={sinLugar}
              onChange={(valor) => {
                setSeleccion(valor)
                if (error) setError("")
              }}
            />
          </Field>
          {sinLugar && elegido ? <AvisoDeLimite tipo={elegido.userType} alMejorar={() => alPedirMejora(elegido.userType)} sinSenal={sinSenal} /> : null}
          {sinSenal ? <Notice tone="caution">{AVISO_SIN_SENAL_PARA_CAMBIOS}</Notice> : null}
          {error ? <Notice tone="danger">{error}</Notice> : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ Pantalla */

type CampoDelAlta = "nombre" | "apellido" | "rol" | "mail"
type ErrorDelAlta = { campo: CampoDelAlta | null; mensaje: string }
type AccionDeInvitacion = "copiar" | "reenviar" | "revocar"

/** Cambios hechos acá mientras vuelve la copia nueva del servidor. Valen solo sobre los datos que los originaron. */
type CambiosLocales = { base: ProjectTeamData; valor: ProjectTeamData }

export function Equipo({ projectId, data, aviso }: { projectId: string; data: ProjectTeamData; aviso?: string | null }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const enLinea = useEnLinea()
  const sinSenal = !enLinea
  const puedeAgregar = useProjectPermission("addUsers")
  const puedeEditarPermisos = useProjectPermission("editPermissions")

  // Cuando llegan datos nuevos (después de cada cambio se vuelven a pedir), los locales se descartan solos.
  const [locales, setLocales] = useState<CambiosLocales | null>(null)
  const equipo = locales && locales.base === data ? locales.valor : data
  const cambiar = (fn: (actual: ProjectTeamData) => ProjectTeamData) =>
    setLocales((previos) => ({ base: data, valor: fn(previos && previos.base === data ? previos.valor : data) }))
  const refrescar = () => void invalidateProjectQueries(queryClient, projectId)

  const { members: miembros, pendingInvitations: invitaciones, seatSummary: cupos, selfJoin: unirme } = equipo

  // Alta
  const [mostrarAlta, setMostrarAlta] = useState(false)
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [rol, setRol] = useState("")
  const [mail, setMail] = useState("")
  const [errorDelAlta, setErrorDelAlta] = useState<ErrorDelAlta | null>(null)
  const [agregando, setAgregando] = useState(false)

  // Lista, diálogos y acciones
  const [busqueda, setBusqueda] = useState("")
  const [permisosAbiertos, setPermisosAbiertos] = useState(true)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [quitandoId, setQuitandoId] = useState<string | null>(null)
  const [enCurso, setEnCurso] = useState<{ id: string; accion: AccionDeInvitacion } | null>(null)
  const [mejora, setMejora] = useState<{ tipo: ProjectUserType; vez: number; abierto: boolean } | null>(null)

  const rolElegido = decodeTeamRoleSelection(rol)
  const tipoElegido = rolElegido?.userType ?? ""
  const altaSinLugar = isUserTypeAtSeatLimit(cupos, tipoElegido)
  const esUnirme = unirme != null && mail.trim().toLowerCase() === unirme.email.toLowerCase()

  const limpiarError = () => {
    if (errorDelAlta) setErrorDelAlta(null)
  }

  const pedirMejora = (tipo: ProjectUserType) => setMejora((previa) => ({ tipo, vez: (previa?.vez ?? 0) + 1, abierto: true }))

  const avisarSinSenal = () => {
    toast.error(AVISO_SIN_SENAL_PARA_CAMBIOS)
  }

  /* ---------- Alta */

  const agregar = async (evento?: FormEvent) => {
    evento?.preventDefault()
    if (agregando) return
    if (sinSenal) return avisarSinSenal()
    const nombreLimpio = nombre.trim()
    const apellidoLimpio = apellido.trim()
    const mailLimpio = mail.trim().toLowerCase()

    if (!nombreLimpio) return setErrorDelAlta({ campo: "nombre", mensaje: "Ingresá el nombre." })
    if (!apellidoLimpio) return setErrorDelAlta({ campo: "apellido", mensaje: "Ingresá el apellido." })
    if (!rolElegido) return setErrorDelAlta({ campo: "rol", mensaje: "Elegí el rol." })
    if (!mailLimpio || !PATRON_DE_MAIL.test(mailLimpio)) return setErrorDelAlta({ campo: "mail", mensaje: "Ingresá un mail válido." })
    const yaEsta = [...miembros.map((m) => m.email), ...invitaciones.map((i) => i.email)].some((m) => m.toLowerCase() === mailLimpio)
    if (yaEsta) return setErrorDelAlta({ campo: "mail", mensaje: "Ese mail ya está en el equipo." })
    if (altaSinLugar) return

    setAgregando(true)
    setErrorDelAlta(null)
    try {
      const resultado = await addTeamMember(projectId, {
        firstName: nombreLimpio,
        lastName: apellidoLimpio,
        email: mailLimpio,
        userType: rolElegido.userType,
        role: rolElegido.role,
      })
      if (!resultado.ok) {
        setErrorDelAlta({ campo: null, mensaje: resultado.error })
        return
      }
      if (resultado.kind === "member") {
        const nuevo = resultado.member
        cambiar((actual) => ({
          ...actual,
          members: [...actual.members, nuevo],
          selfJoin: actual.selfJoin && actual.selfJoin.email.toLowerCase() === nuevo.email.toLowerCase() ? null : actual.selfJoin,
        }))
        toast.success(nuevo.isYou ? "Te sumaste al equipo." : `${nombreDe(nuevo)} se sumó al equipo.`)
      } else {
        const nueva = resultado.invitation
        cambiar((actual) => ({
          ...actual,
          pendingInvitations: [...actual.pendingInvitations.filter((i) => i.invitationId !== nueva.invitationId), nueva],
        }))
        toast.success(`Invitación enviada a ${nueva.email}.`)
      }
      refrescar()
      setNombre("")
      setApellido("")
      setMail("")
      setRol("")
      setMostrarAlta(false)
    } catch {
      setErrorDelAlta({ campo: null, mensaje: ERROR_DE_RED })
    } finally {
      setAgregando(false)
    }
  }

  /* ---------- Editar y quitar */

  const guardarMiembro = async (
    memberId: string,
    tipo: ProjectUserType,
    rolNuevo: ProjectTeamRole,
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    if (sinSenal) return { ok: false, error: AVISO_SIN_SENAL_PARA_CAMBIOS }
    try {
      const resultado = await updateTeamMember(memberId, projectId, { userType: tipo, role: rolNuevo })
      if (!resultado.ok) return { ok: false, error: resultado.error }
      cambiar((actual) => ({
        ...actual,
        members: actual.members.map((m) =>
          m.memberId === memberId
            ? { ...m, userType: resultado.userType, userTypeLabel: resultado.userTypeLabel, roleLabel: resultado.roleLabel }
            : m,
        ),
      }))
      toast.success("Cambios guardados.")
      refrescar()
      return { ok: true }
    } catch {
      return { ok: false, error: ERROR_DE_RED }
    }
  }

  const quitar = async (memberId: string) => {
    if (sinSenal) {
      avisarSinSenal()
      throw new Error("sin señal")
    }
    let resultado: Awaited<ReturnType<typeof removeTeamMember>>
    try {
      resultado = await removeTeamMember(memberId, projectId)
    } catch {
      resultado = { ok: false, error: ERROR_DE_RED }
    }
    if (!resultado.ok) {
      toast.error(resultado.error)
      // El diálogo queda abierto para reintentar.
      throw new Error(resultado.error)
    }
    const quitado = miembros.find((m) => m.memberId === memberId)
    cambiar((actual) => ({
      ...actual,
      members: actual.members.filter((m) => m.memberId !== memberId),
      selfJoin: quitado?.isYou ? { firstName: quitado.firstName, lastName: quitado.lastName, email: quitado.email } : actual.selfJoin,
    }))
    refrescar()
    if (quitado?.isYou) toast.success("Saliste del equipo de la obra.")
    else if (quitado) toast.success(`Quitaste a ${nombreDe(quitado)} del equipo.`)
  }

  /* ---------- Invitaciones */

  const enInvitacion = async (invitationId: string, accion: AccionDeInvitacion) => {
    if (enCurso) return
    if (sinSenal) return avisarSinSenal()
    setEnCurso({ id: invitationId, accion })
    try {
      if (accion === "copiar") {
        const resultado = await copyTeamInvitationLink(invitationId, projectId)
        if (!resultado.ok) return toast.error(resultado.error)
        try {
          await navigator.clipboard.writeText(resultado.url)
          toast.success("Link copiado. El enlace anterior deja de funcionar.")
        } catch {
          toast.error("No se pudo copiar el link.")
        }
      } else if (accion === "reenviar") {
        const resultado = await resendTeamInvitation(invitationId, projectId)
        if (!resultado.ok) return toast.error(resultado.error)
        toast.success("Invitación reenviada. El enlace anterior deja de funcionar.")
      } else {
        const resultado = await revokeTeamInvitation(invitationId, projectId)
        if (!resultado.ok) return toast.error(resultado.error)
        cambiar((actual) => ({
          ...actual,
          pendingInvitations: actual.pendingInvitations.filter((i) => i.invitationId !== invitationId),
        }))
        toast.success("Invitación revocada.")
        refrescar()
      }
    } catch {
      toast.error(ERROR_DE_RED)
    } finally {
      setEnCurso(null)
    }
  }

  /* ---------- Lo que se ve */

  const consulta = busqueda.trim().toLowerCase()
  const coincide = (p: { firstName: string; lastName: string; email: string; roleLabel: string }) =>
    `${nombreDe(p)} ${p.email} ${p.roleLabel}`.toLowerCase().includes(consulta)
  const miembrosVisibles = consulta ? miembros.filter(coincide) : miembros
  const invitacionesVisibles = consulta ? invitaciones.filter(coincide) : invitaciones

  const editando = editandoId != null && puedeEditarPermisos ? (miembros.find((m) => m.memberId === editandoId) ?? null) : null
  const quitando = quitandoId != null && puedeEditarPermisos ? (miembros.find((m) => m.memberId === quitandoId) ?? null) : null

  const abrirAlta = (desdeUnirme: boolean) => {
    if (desdeUnirme && unirme) {
      setNombre(unirme.firstName)
      setApellido(unirme.lastName)
      setMail(unirme.email)
      setRol("")
    }
    setErrorDelAlta(null)
    setMostrarAlta(true)
  }

  const errorDe = (campo: CampoDelAlta) => (errorDelAlta?.campo === campo ? errorDelAlta.mensaje : undefined)

  return (
    <div className={ENVOLTORIO}>
      {aviso ? <p role="status" className="rounded-control bg-canvas-sunken px-group py-snug text-meta text-ink-muted">{aviso}</p> : null}
      {sinSenal ? <Notice tone="caution">{AVISO_SIN_SENAL_PARA_CAMBIOS}</Notice> : null}

      <div className="flex flex-col gap-group sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-compact">
          <h1 className="text-title">Equipo de trabajo</h1>
          {cupos ? (
            <div className="flex items-center gap-compact">
              <p className="text-body text-ink-muted">{formatTeamSeatSummarySubtitle(cupos)}</p>
              <Tooltip content={TEAM_SEAT_SUMMARY_TOOLTIP}>
                <button type="button" aria-label={TEAM_SEAT_SUMMARY_TOOLTIP} className="focus-ring grid size-6 cursor-help place-items-center rounded-pill text-ink-muted">
                  <Icon icon={Info} size="xs" />
                </button>
              </Tooltip>
            </div>
          ) : null}
        </div>
        <div className="flex w-full flex-col gap-compact sm:w-auto sm:flex-row">
          {unirme && puedeAgregar && !mostrarAlta ? (
            <Button variant="outline" size="large" className="w-full sm:w-auto" disabled={sinSenal} onClick={() => abrirAlta(true)}>
              Unirme al equipo
            </Button>
          ) : null}
          <Button
            size="large"
            className="w-full sm:w-auto"
            disabled={!puedeAgregar || (sinSenal && !mostrarAlta)}
            aria-expanded={mostrarAlta}
            onClick={() => (mostrarAlta ? (setMostrarAlta(false), setErrorDelAlta(null)) : abrirAlta(false))}
          >
            <Icon icon={mostrarAlta ? X : Plus} /> {mostrarAlta ? "Cancelar" : "Agregar miembro"}
          </Button>
        </div>
      </div>

      {mostrarAlta && puedeAgregar ? (
        <section aria-labelledby="nuevo-miembro" className="rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block">
          <form noValidate onSubmit={(evento) => void agregar(evento)} className="flex flex-col gap-group">
            <div className="flex items-baseline justify-between gap-snug">
              <h2 id="nuevo-miembro" className="text-section font-regular">
                Nuevo miembro
              </h2>
              <p className="text-meta text-ink-muted">
                <span aria-hidden className="text-fn-danger">
                  *
                </span>{" "}
                Campos obligatorios
              </p>
            </div>
            <div className="grid grid-cols-1 gap-snug sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Nombre" required error={errorDe("nombre")}>
                <Input value={nombre} onChange={(e) => (setNombre(e.target.value), limpiarError())} autoComplete="given-name" />
              </Field>
              <Field label="Apellido" required error={errorDe("apellido")}>
                <Input value={apellido} onChange={(e) => (setApellido(e.target.value), limpiarError())} autoComplete="family-name" />
              </Field>
              <Field label="Rol" required error={errorDe("rol")}>
                <SelectorDeRol value={rol} invalid={altaSinLugar} onChange={(valor) => (setRol(valor), limpiarError())} />
              </Field>
            </div>
            <div className="flex flex-col gap-snug sm:flex-row sm:items-start">
              <Field label="Mail" required error={errorDe("mail")} className="min-w-0 flex-1">
                <Input
                  type="email"
                  value={mail}
                  onChange={(e) => (setMail(e.target.value), limpiarError())}
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                />
              </Field>
              {/* Un título invisible del mismo alto que el del campo: el botón queda a la altura del mail aunque aparezca un error. */}
              <div className="flex shrink-0 flex-col gap-compact">
                <span aria-hidden className="invisible hidden text-label sm:block">
                  Mail
                </span>
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  loading={agregando}
                  loadingLabel={esUnirme ? "Sumándote…" : "Invitando…"}
                  disabled={altaSinLugar || sinSenal}
                >
                  <Icon icon={Plus} /> {esUnirme ? "Unirme" : "Agregar miembro"}
                </Button>
              </div>
            </div>
            {altaSinLugar && tipoElegido ? <AvisoDeLimite tipo={tipoElegido} alMejorar={() => pedirMejora(tipoElegido)} sinSenal={sinSenal} /> : null}
            {errorDelAlta && errorDelAlta.campo === null ? <Notice tone="danger">{errorDelAlta.mensaje}</Notice> : null}
          </form>
        </section>
      ) : null}

      <div className="flex flex-col gap-group">
        <InputGroup
          start={<Icon icon={Search} />}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onClear={() => setBusqueda("")}
          placeholder="Buscar miembros del equipo…"
          aria-label="Buscar miembros del equipo"
          groupClassName="shadow-hint"
        />
        <section aria-labelledby="miembros-titulo" className="rounded-surface border border-line bg-canvas-raised shadow-hint">
          <h2 id="miembros-titulo" className="sr-only">
            Miembros
          </h2>
          {miembrosVisibles.length === 0 ? (
            <p className="px-group py-8 text-center text-body text-ink-muted">
              {consulta ? "Sin resultados para esa búsqueda." : "No hay miembros activos."}
            </p>
          ) : (
            <ul>
              {miembrosVisibles.map((miembro) => {
                const esOwner = isProtectedProjectOwnerMember(miembro.userType)
                const habilitado = puedeEditarPermisos && !esOwner && !sinSenal
                const nombreCompleto = nombreDe(miembro)
                const botones = (
                  <>
                    <IconButton
                      icon={SquarePen}
                      label={`Editar a ${nombreCompleto}`}
                      size="compact"
                      tooltip={!esOwner}
                      disabled={!habilitado}
                      onClick={() => setEditandoId(miembro.memberId)}
                    />
                    <IconButton
                      icon={Trash2}
                      label={miembro.isYou ? "Salir del equipo" : `Quitar a ${nombreCompleto}`}
                      size="compact"
                      tooltip={!esOwner}
                      disabled={!habilitado}
                      onClick={() => {
                        setQuitandoId(miembro.memberId)
                        if (editandoId === miembro.memberId) setEditandoId(null)
                      }}
                    />
                  </>
                )
                return (
                  <FilaDePersona
                    key={miembro.memberId}
                    persona={miembro}
                    avatar={miembro.avatarUrl}
                    esVos={miembro.isYou}
                    tipo={miembro}
                    acciones={
                      esOwner ? (
                        // Un botón desactivado no recibe foco: el motivo va en un tooltip del contenedor.
                        <Tooltip content="El owner no se puede editar ni quitar">
                          <span role="group" tabIndex={0} className="focus-ring flex gap-related rounded-control" aria-label="El owner no se puede editar ni quitar">
                            {botones}
                          </span>
                        </Tooltip>
                      ) : (
                        botones
                      )
                    }
                  />
                )
              })}
            </ul>
          )}
        </section>
        <p role="status" className="text-meta text-ink-muted">
          Mostrando {miembrosVisibles.length} de {miembros.length} miembros
        </p>
      </div>

      {invitaciones.length > 0 ? (
        <section aria-labelledby="pendientes" className="flex flex-col gap-group">
          <h2 id="pendientes" className="text-reading">
            Usuarios pendientes de activación
          </h2>
          <div className="rounded-surface border border-line bg-canvas-raised">
            {invitacionesVisibles.length === 0 ? (
              <p className="px-group py-6 text-center text-body text-ink-muted">Sin resultados para esa búsqueda.</p>
            ) : (
              <ul>
                {invitacionesVisibles.map((invitacion: ProjectTeamInvitation) => {
                  const nombreCompleto = nombreDe(invitacion)
                  const ocupada = enCurso?.id === invitacion.invitationId
                  const deshabilitado = !puedeAgregar || sinSenal || enCurso != null
                  const cargando = (accion: AccionDeInvitacion) => ocupada && enCurso?.accion === accion
                  return (
                    <FilaDePersona
                      key={invitacion.invitationId}
                      persona={invitacion}
                      pendiente
                      tipo={invitacion}
                      acciones={
                        <>
                          <IconButton
                            icon={Link2}
                            label={`Copiar link de ${nombreCompleto}`}
                            size="compact"
                            disabled={deshabilitado}
                            loading={cargando("copiar")}
                            onClick={() => void enInvitacion(invitacion.invitationId, "copiar")}
                          />
                          <IconButton
                            icon={RefreshCw}
                            label={`Reenviar invitación a ${nombreCompleto}`}
                            size="compact"
                            disabled={deshabilitado}
                            loading={cargando("reenviar")}
                            onClick={() => void enInvitacion(invitacion.invitationId, "reenviar")}
                          />
                          <IconButton
                            icon={Trash2}
                            label={`Revocar invitación de ${nombreCompleto}`}
                            size="compact"
                            disabled={deshabilitado}
                            loading={cargando("revocar")}
                            onClick={() => void enInvitacion(invitacion.invitationId, "revocar")}
                          />
                        </>
                      }
                    />
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="permisos" className="rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block">
        <h2 id="permisos">
          <button
            type="button"
            aria-expanded={permisosAbiertos}
            aria-controls="tabla-permisos"
            onClick={() => setPermisosAbiertos((valor) => !valor)}
            className="focus-ring flex w-full cursor-pointer items-center gap-compact rounded-box text-left text-reading"
          >
            <Icon icon={ShieldCheck} className="text-ink-muted" />
            <span className="flex-1">Permisos de usuarios</span>
            <Icon icon={ChevronDown} className={cn("text-ink-muted transition-transform duration-(--duration-base)", permisosAbiertos && "rotate-180")} />
          </button>
        </h2>
        {permisosAbiertos ? (
          <div id="tabla-permisos" className="mt-group">
            <TablaDePermisos />
          </div>
        ) : null}
      </section>

      <EditarMiembro
        key={editando?.memberId ?? "nadie"}
        miembro={editando}
        cupos={cupos}
        sinSenal={sinSenal}
        alCerrar={() => setEditandoId(null)}
        alGuardar={(tipo, rolNuevo) =>
          editando ? guardarMiembro(editando.memberId, tipo, rolNuevo) : Promise.resolve({ ok: false as const, error: "No encontramos al miembro." })
        }
        alPedirMejora={pedirMejora}
      />

      <ConfirmDialog
        open={quitando != null}
        onOpenChange={(abierto) => !abierto && setQuitandoId(null)}
        title={quitando?.isYou ? "¿Salir del equipo?" : `¿Quitar a ${quitando ? nombreDe(quitando) : ""} del equipo?`}
        description={
          quitando?.isYou
            ? "Vas a salir del equipo de esta obra. Vas a poder seguir administrándola desde la empresa."
            : "Deja de tener acceso a esta obra."
        }
        confirmLabel={quitando?.isYou ? "Salir del equipo" : "Quitar del equipo"}
        tone="danger"
        onConfirm={() => (quitando ? quitar(quitando.memberId) : undefined)}
      />

      <PedirMejoraDePlan
        key={mejora?.vez ?? 0}
        projectId={projectId}
        tipo={mejora?.tipo ?? null}
        abierto={mejora?.abierto ?? false}
        alCambiar={(abierto) => setMejora((previa) => (previa ? { ...previa, abierto } : previa))}
        sinSenal={sinSenal}
      />
    </div>
  )
}

/** Equipo mientras carga. */
export function EquipoCargando() {
  return (
    <div role="status" aria-busy className={ENVOLTORIO}>
      <span className="sr-only">Cargando el equipo…</span>
      <div className="flex flex-col gap-group sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-compact">
          <Skeleton className="h-8 w-[min(100%,280px)]" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-12 w-full sm:w-44" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="rounded-surface border border-line bg-canvas-raised shadow-hint">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-snug border-b border-line p-group last:border-b-0">
            <Skeleton className="size-10 shrink-0 rounded-pill" />
            <div className="flex flex-1 flex-col gap-related">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="hidden h-3 w-56 md:block" />
          </div>
        ))}
      </div>
      <Skeleton className="h-16 w-full" />
    </div>
  )
}

export function EquipoError({ reintentar }: { reintentar: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="No pudimos cargar el equipo"
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
