"use client"

import { useState } from "react"
import {
  ChevronDown,
  Clock,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  SquarePen,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  addTeamMember,
  removeTeamMember,
  revokeTeamInvitation,
  updateTeamMember,
  type ProjectTeamData,
  type ProjectTeamMember,
  type ProjectTeamInvitation,
} from "./actions"
import {
  PROJECT_USER_TYPES,
  USER_TYPE_ROLES,
  type ProjectTeamRole,
  type ProjectUserType,
} from "@/lib/projects/createProjectDraft"
import { EQUIPO_EDIT_ROW } from "@/lib/project/designTokens"

const PERMISSION_COLUMNS = ["Owner", "Admin", "Supervisor", "Operador", "Cliente"] as const

type PermissionValue = boolean | "unidad"

const PERMISSIONS: { action: string; values: PermissionValue[] }[] = [
  { action: "Facturación/Licencias", values: [true, false, false, false, false] },
  { action: "Crear proyecto", values: [true, true, false, false, false] },
  { action: "Agregar usuarios", values: [true, true, false, false, false] },
  { action: "Editar permisos", values: [true, true, false, false, false] },
  { action: "Configurar proyecto", values: [true, true, false, false, false] },
  { action: "Ver dashboard general", values: [true, true, true, true, false] },
  { action: "Ver avance detallado", values: [true, true, true, true, "unidad"] },
  { action: "Cargar avances", values: [true, true, true, true, false] },
  { action: "Certificar tareas", values: [true, false, true, false, false] },
  { action: "Editar tareas", values: [true, false, true, true, false] },
  { action: "Ver auditoría (log)", values: [true, true, true, false, false] },
  { action: "Portal cliente", values: [false, false, false, false, true] },
  { action: "Ver/agregar clientes", values: [true, true, false, false, false] },
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const formInputClassName =
  "h-[44px] w-full rounded-[10px] border bg-white px-3 text-[14px] font-normal leading-5 text-[#0a0a0a] shadow-none placeholder:text-[#777b84] focus-visible:border-[#ff7433] focus-visible:ring-0"
const formInputStyle = { borderColor: "#edeef0" } as const

const TEAM_ROW_GRID =
  "grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-x-4 px-4 py-4 lg:grid-cols-[40px_minmax(0,1fr)_280px_auto]"

type Props = {
  projectId: string
  initialData: ProjectTeamData
}

function getInitials(firstName: string, lastName: string): string {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  return initials || "??"
}

function FormSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string
  placeholder: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[44px] w-full appearance-none rounded-[10px] border bg-white px-3 pr-8 text-[14px] font-normal leading-5 shadow-none outline-none focus:border-[#ff7433] focus-visible:ring-0"
        style={{ borderColor: "#e2e8f0", color: value ? "#0a0a0a" : "#777b84" }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option} style={{ color: "#0a0a0a" }}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#90a1b9]"
        aria-hidden
      />
    </div>
  )
}

function EditSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none border bg-white pl-2.5 pr-7 font-normal shadow-none outline-none focus:border-[#ff7433] focus-visible:ring-0"
        style={{
          height: EQUIPO_EDIT_ROW.selectHeight,
          borderRadius: EQUIPO_EDIT_ROW.selectRadius,
          borderColor: EQUIPO_EDIT_ROW.selectBorder,
          color: EQUIPO_EDIT_ROW.selectText,
          fontSize: EQUIPO_EDIT_ROW.selectFontSize,
          lineHeight: EQUIPO_EDIT_ROW.selectLineHeight,
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-[#90a1b9]"
        aria-hidden
      />
    </div>
  )
}

function MemberEmail({ email }: { email: string }) {
  return (
    <div className="flex min-w-0 items-center justify-start gap-2 text-left text-[12px] leading-4 text-[#5a6169]">
      <Mail className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate text-left">{email}</span>
    </div>
  )
}

function MemberRow({
  member,
  onEdit,
  onRemove,
}: {
  member: ProjectTeamMember
  onEdit?: () => void
  onRemove?: () => void
}) {
  return (
    <div
      className={`${TEAM_ROW_GRID} border-b border-[#edeef0] transition-colors last:border-b-0 hover:bg-[#fefcfb]`}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#ff7433] text-[12px] font-semibold text-white">
        {getInitials(member.firstName, member.lastName)}
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[14px] font-medium leading-5 text-[#1d293d]">
            {member.firstName} {member.lastName}
          </h3>
          {member.isYou ? (
            <span className="inline-flex items-center rounded-full bg-[#ff7433] px-2 py-0.5 text-[10px] font-medium leading-[10px] text-white">
              Tú
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          {member.userTypeLabel ? (
            <span className="inline-flex items-center rounded-[12px] bg-[#ffeae0] px-2 py-0.5 text-[10px] font-medium leading-[10px] text-[#321a10]">
              {member.userTypeLabel}
            </span>
          ) : null}
          {member.roleLabel ? (
            <span className="text-[12px] leading-4 text-[#43484e]">{member.roleLabel}</span>
          ) : null}
        </div>
      </div>

      <div className="hidden min-w-0 lg:block">
        <MemberEmail email={member.email} />
      </div>

      <div className="flex shrink-0 items-center justify-end gap-1">
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex size-7 items-center justify-center text-[#777b84] transition-opacity hover:opacity-80"
            aria-label={`Editar a ${member.firstName} ${member.lastName}`}
          >
            <SquarePen className="size-4" aria-hidden />
          </button>
        ) : null}
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex size-7 items-center justify-center text-[#777b84] transition-opacity hover:opacity-80"
            aria-label={`Eliminar a ${member.firstName} ${member.lastName}`}
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        ) : (
          <div className="size-7" />
        )}
      </div>
    </div>
  )
}

function EditMemberRow({
  member,
  onSave,
  onCancel,
  onRemove,
}: {
  member: ProjectTeamMember
  onSave: (
    userType: ProjectUserType,
    role: ProjectTeamRole,
  ) => Promise<{ ok: boolean; error?: string }>
  onCancel: () => void
  onRemove: () => void
}) {
  const initialUserType = (PROJECT_USER_TYPES.find(
    (t) => t === member.userTypeLabel,
  ) ?? PROJECT_USER_TYPES[0]) as ProjectUserType
  const initialRole = USER_TYPE_ROLES[initialUserType].find((r) => r === member.roleLabel)
    ? (member.roleLabel as ProjectTeamRole)
    : USER_TYPE_ROLES[initialUserType][0]

  const [editUserType, setEditUserType] = useState<ProjectUserType>(initialUserType)
  const [editRole, setEditRole] = useState<ProjectTeamRole>(initialRole)
  const [isSaving, setIsSaving] = useState(false)
  const [editError, setEditError] = useState("")

  const handleSave = async () => {
    const hasChanges =
      editUserType !== initialUserType || editRole !== initialRole

    if (!hasChanges) {
      onCancel()
      return
    }

    setIsSaving(true)
    setEditError("")

    const result = await onSave(editUserType, editRole)

    setIsSaving(false)

    if (!result.ok) {
      setEditError(result.error ?? "No se pudieron guardar los cambios.")
    }
  }

  return (
    <div
      className="border-b last:border-b-0"
      style={{
        backgroundColor: EQUIPO_EDIT_ROW.background,
        borderColor: EQUIPO_EDIT_ROW.border,
      }}
    >
      <div className={TEAM_ROW_GRID}>
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
          style={{
            backgroundColor: EQUIPO_EDIT_ROW.avatarBg,
            color: EQUIPO_EDIT_ROW.avatarText,
          }}
        >
          {getInitials(member.firstName, member.lastName)}
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <h3
            className="truncate text-[14px] font-medium leading-5"
            style={{ color: EQUIPO_EDIT_ROW.nameColor }}
          >
            {member.firstName} {member.lastName}
          </h3>
          <div className="flex items-center gap-2">
            <EditSelect
              value={editUserType}
              options={PROJECT_USER_TYPES}
              onChange={(v) => {
                const nextType = v as ProjectUserType
                setEditUserType(nextType)
                setEditRole(USER_TYPE_ROLES[nextType][0])
                if (editError) setEditError("")
              }}
            />
            <EditSelect
              value={editRole}
              options={USER_TYPE_ROLES[editUserType]}
              onChange={(v) => {
                setEditRole(v as ProjectTeamRole)
                if (editError) setEditError("")
              }}
            />
          </div>
        </div>

        <div className="hidden min-w-0 lg:block">
          <MemberEmail email={member.email} />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="inline-flex min-w-[72px] items-center justify-center uppercase tracking-wide transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{
              backgroundColor: EQUIPO_EDIT_ROW.listoBg,
              color: EQUIPO_EDIT_ROW.listoText,
              fontSize: EQUIPO_EDIT_ROW.listoFontSize,
              fontWeight: EQUIPO_EDIT_ROW.listoFontWeight,
              paddingLeft: EQUIPO_EDIT_ROW.listoPaddingX,
              paddingRight: EQUIPO_EDIT_ROW.listoPaddingX,
              paddingTop: EQUIPO_EDIT_ROW.listoPaddingY,
              paddingBottom: EQUIPO_EDIT_ROW.listoPaddingY,
              borderRadius: EQUIPO_EDIT_ROW.listoRadius,
            }}
          >
            {isSaving ? (
              <Spinner className="size-3.5" style={{ color: EQUIPO_EDIT_ROW.listoText }} />
            ) : (
              "Listo"
            )}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex size-7 items-center justify-center transition-opacity hover:opacity-80"
            style={{ color: EQUIPO_EDIT_ROW.actionIconColor }}
            aria-label={`Eliminar a ${member.firstName} ${member.lastName}`}
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      {editError ? (
        <p className="px-4 pb-4 text-[13px] leading-5 text-[#dc2626]">{editError}</p>
      ) : null}
    </div>
  )
}

function PendingRow({
  invitation,
  onRevoke,
}: {
  invitation: ProjectTeamInvitation
  onRevoke: () => void
}) {
  return (
    <div
      className={`${TEAM_ROW_GRID} border-b border-[#edeef0] transition-colors last:border-b-0 hover:bg-[#fefcfb]`}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f0f1f3] text-[12px] font-semibold text-[#777b84]">
        {getInitials(invitation.firstName, invitation.lastName)}
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[14px] font-medium leading-5 text-[#1d293d]">
            {invitation.firstName} {invitation.lastName}
          </h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fef9c3] px-2 py-0.5 text-[10px] font-medium leading-[10px] text-[#854d0e]">
            <Clock className="size-2.5" aria-hidden />
            Pendiente
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {invitation.userTypeLabel ? (
            <span className="inline-flex items-center rounded-[12px] bg-[#ffeae0] px-2 py-0.5 text-[10px] font-medium leading-[10px] text-[#321a10]">
              {invitation.userTypeLabel}
            </span>
          ) : null}
          {invitation.roleLabel ? (
            <span className="text-[12px] leading-4 text-[#43484e]">{invitation.roleLabel}</span>
          ) : null}
        </div>
      </div>

      <div className="hidden min-w-0 lg:block">
        <MemberEmail email={invitation.email} />
      </div>

      <div className="flex shrink-0 items-center justify-end">
        <button
          type="button"
          onClick={onRevoke}
          className="text-[#777b84] transition-opacity hover:opacity-80"
          aria-label={`Revocar invitación de ${invitation.firstName} ${invitation.lastName}`}
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}

function PermissionCell({ value }: { value: PermissionValue }) {
  if (value === false) {
    return <span className="text-[16px] font-bold text-[#e5484d]">✕</span>
  }
  return (
    <span className="inline-flex flex-col items-center">
      <span className="text-[16px] font-bold text-[#56ba9f]">✓</span>
      {value === "unidad" ? (
        <span className="text-[10px] leading-3 text-[#90a1b9]">Su unidad</span>
      ) : null}
    </span>
  )
}

export function EquipoTeamView({ projectId, initialData }: Props) {
  const [members, setMembers] = useState(initialData.members)
  const [pendingInvitations, setPendingInvitations] = useState(
    initialData.pendingInvitations,
  )
  const [showForm, setShowForm] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [userType, setUserType] = useState<ProjectUserType | "">("")
  const [role, setRole] = useState<ProjectTeamRole | "">("")
  const [email, setEmail] = useState("")
  const [formError, setFormError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [permisosOpen, setPermisosOpen] = useState(true)

  const assignedEmails = new Set([
    ...members.map((m) => m.email.toLowerCase()),
    ...pendingInvitations.map((i) => i.email.toLowerCase()),
  ])

  const handleAddMember = async () => {
    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedFirst) { setFormError("Ingresá el nombre."); return }
    if (!trimmedLast) { setFormError("Ingresá el apellido."); return }
    if (!userType) { setFormError("Seleccioná el tipo de usuario."); return }
    if (!role) { setFormError("Seleccioná el rol."); return }
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      setFormError("Ingresá un correo electrónico válido.")
      return
    }
    if (assignedEmails.has(trimmedEmail)) {
      setFormError("Ese correo ya está en el equipo.")
      return
    }

    setIsSubmitting(true)
    setFormError("")

    const result = await addTeamMember(projectId, {
      firstName: trimmedFirst,
      lastName: trimmedLast,
      email: trimmedEmail,
      userType,
      role,
    })

    setIsSubmitting(false)

    if (!result.ok) {
      setFormError(result.error)
      return
    }

    setPendingInvitations((prev) => [...prev, result.invitation])
    setFirstName("")
    setLastName("")
    setEmail("")
    setUserType("")
    setRole("")
    setShowForm(false)
  }

  const handleRemoveMember = async (memberId: string) => {
    const result = await removeTeamMember(memberId, projectId)
    if (result.ok) {
      setMembers((prev) => prev.filter((m) => m.memberId !== memberId))
    }
  }

  const handleUpdateMember = async (
    memberId: string,
    userType: ProjectUserType,
    role: ProjectTeamRole,
  ) => {
    const result = await updateTeamMember(memberId, projectId, { userType, role })
    if (result.ok) {
      setMembers((prev) =>
        prev.map((m) =>
          m.memberId === memberId
            ? {
                ...m,
                userTypeLabel: result.userTypeLabel,
                roleLabel: result.roleLabel,
              }
            : m,
        ),
      )
      setEditingMemberId(null)
      return { ok: true as const }
    }
    return { ok: false as const, error: result.error }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    const result = await revokeTeamInvitation(invitationId, projectId)
    if (result.ok) {
      setPendingInvitations((prev) =>
        prev.filter((i) => i.invitationId !== invitationId),
      )
    }
  }

  const lowerSearch = searchQuery.toLowerCase()
  const filteredMembers = lowerSearch
    ? members.filter(
        (m) =>
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(lowerSearch) ||
          m.email.toLowerCase().includes(lowerSearch),
      )
    : members
  const filteredPending = lowerSearch
    ? pendingInvitations.filter(
        (i) =>
          `${i.firstName} ${i.lastName}`.toLowerCase().includes(lowerSearch) ||
          i.email.toLowerCase().includes(lowerSearch),
      )
    : pendingInvitations

  return (
    <div
      className="flex flex-col gap-8 pt-6"
      style={{ maxWidth: "747px", width: "100%", margin: "0 auto" }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-recoleta text-[28px] font-normal leading-tight text-[#272a2d]">
            Equipo de trabajo
          </h1>
          <p className="text-[14px] leading-5 text-[#43484e]">
            {members.length} miembro{members.length !== 1 ? "s" : ""} activo
            {members.length !== 1 ? "s" : ""} en este proyecto
          </p>
        </div>
        <Button
          variant="brand"
          size="brand"
          onClick={() => {
            setShowForm((v) => !v)
            setFormError("")
          }}
          className="text-[14px] font-normal leading-5"
        >
          {showForm ? (
            <>
              <X className="size-4" aria-hidden />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="size-4" aria-hidden />
              Agregar miembro
            </>
          )}
        </Button>
      </div>

      {/* Nuevo miembro form */}
      {showForm ? (
        <div
          className="flex flex-col gap-3 rounded-[16px] border border-[#edeef0] bg-white px-6 py-4"
          style={{ boxShadow: "0 0 10px rgba(243, 103, 31, 0.08)" }}
        >
          <h2 className="text-[20px] font-normal leading-7 text-[#272a2d]">Nuevo miembro</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value)
                if (formError) setFormError("")
              }}
              placeholder="Nombre"
              className={formInputClassName}
              style={formInputStyle}
            />
            <Input
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value)
                if (formError) setFormError("")
              }}
              placeholder="Apellido"
              className={formInputClassName}
              style={formInputStyle}
            />
            <FormSelect
              value={userType}
              placeholder="Tipo de usuario"
              options={PROJECT_USER_TYPES}
              onChange={(v) => {
                setUserType(v as ProjectUserType)
                setRole("")
                if (formError) setFormError("")
              }}
            />
            <FormSelect
              value={role}
              placeholder="Rol"
              options={userType ? USER_TYPE_ROLES[userType] : []}
              onChange={(v) => {
                setRole(v as ProjectTeamRole)
                if (formError) setFormError("")
              }}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (formError) setFormError("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  void handleAddMember()
                }
              }}
              placeholder="correo@ejemplo.com"
              className={`${formInputClassName} min-w-0 flex-1`}
              style={formInputStyle}
            />
            <Button
              variant="brand"
              size="brand"
              onClick={() => void handleAddMember()}
              disabled={isSubmitting}
              className="shrink-0 px-6 text-[14px] font-normal leading-5"
            >
              <Plus className="size-4" aria-hidden />
              {isSubmitting ? "Invitando..." : "Agregar miembro"}
            </Button>
          </div>
          {formError ? (
            <p className="text-[13px] leading-5 text-[#dc2626]">{formError}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        {/* Search */}
        <div
          className="relative rounded-[12px] border border-[#edeef0] bg-white"
          style={{ boxShadow: "0 0 10px rgba(243, 103, 31, 0.08)" }}
        >
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#696e77]"
            aria-hidden
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar miembros del equipo..."
            className="h-[42px] rounded-[12px] border-0 bg-transparent pl-11 text-[14px] text-[#18191b] shadow-none placeholder:text-[#696e77] focus-visible:ring-0"
          />
        </div>

        {/* Members list */}
        <div
          className="overflow-hidden rounded-[16px] border border-[#edeef0] bg-white"
          style={{ boxShadow: "0 0 10px rgba(243, 103, 31, 0.08)" }}
        >
          {filteredMembers.length === 0 ? (
            <div className="px-4 py-8 text-center text-[14px] leading-5 text-[#777b84]">
              {searchQuery ? "Sin resultados para esa búsqueda." : "No hay miembros activos."}
            </div>
          ) : (
            filteredMembers.map((member) =>
              editingMemberId === member.memberId ? (
                <EditMemberRow
                  key={member.memberId}
                  member={member}
                  onSave={(userType, role) =>
                    handleUpdateMember(member.memberId, userType, role)
                  }
                  onCancel={() => setEditingMemberId(null)}
                  onRemove={() => {
                    setEditingMemberId(null)
                    void handleRemoveMember(member.memberId)
                  }}
                />
              ) : (
                <MemberRow
                  key={member.memberId}
                  member={member}
                  onEdit={
                    member.isYou ? undefined : () => setEditingMemberId(member.memberId)
                  }
                  onRemove={
                    member.isYou
                      ? undefined
                      : () => void handleRemoveMember(member.memberId)
                  }
                />
              ),
            )
          )}
        </div>

        <p className="text-[12px] leading-4 text-[#777b84]">
          Mostrando {filteredMembers.length} de {members.length} miembros
        </p>
      </div>

      {/* Pending invitations */}
      {pendingInvitations.length > 0 ? (
        <div className="flex flex-col gap-4">
          <h2 className="text-[18px] font-normal leading-5 text-[#272a2d]">
            Usuarios pendientes de activación
          </h2>
          <div className="overflow-hidden rounded-[16px] border border-[#edeef0] bg-white">
            {filteredPending.length === 0 ? (
              <div className="px-4 py-6 text-center text-[14px] leading-5 text-[#777b84]">
                Sin resultados para esa búsqueda.
              </div>
            ) : (
              filteredPending.map((invitation) => (
                <PendingRow
                  key={invitation.invitationId}
                  invitation={invitation}
                  onRevoke={() => void handleRevokeInvitation(invitation.invitationId)}
                />
              ))
            )}
          </div>
        </div>
      ) : null}

      {/* Permisos de usuarios */}
      <div
        className="rounded-[16px] border border-[#edeef0] bg-white px-6 py-4"
        style={{ boxShadow: "0 0 10px rgba(243, 103, 31, 0.08)" }}
      >
        <button
          type="button"
          onClick={() => setPermisosOpen((v) => !v)}
          className="flex w-full items-center gap-2"
          aria-expanded={permisosOpen}
        >
          <ShieldCheck className="size-4 shrink-0 text-[#43484e]" aria-hidden />
          <h2 className="flex-1 text-left text-[18px] font-normal leading-5 text-[#272a2d]">
            Permisos de usuarios
          </h2>
          <ChevronDown
            className={`size-4 shrink-0 text-[#43484e] transition-transform ${permisosOpen ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>

        {permisosOpen ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-[#e2e8f0]">
                  <th className="px-3 py-2.5 text-left text-[12px] font-normal leading-4 text-[#696e77]">
                    Pantalla / Acción
                  </th>
                  {PERMISSION_COLUMNS.map((col) => (
                    <th
                      key={col}
                      className="px-3 py-2.5 text-center text-[14px] font-medium leading-5 text-[#314158]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((row, index) => (
                  <tr
                    key={row.action}
                    style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#edeef0" }}
                  >
                    <td className="px-3 py-2.5 text-[12px] font-normal leading-4 text-[#43484e]">
                      {row.action}
                    </td>
                    {row.values.map((value, colIndex) => (
                      <td key={colIndex} className="px-3 py-2.5 text-center align-middle">
                        <PermissionCell value={value} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  )
}
