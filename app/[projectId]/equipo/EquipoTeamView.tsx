"use client"

import { useState, type ReactNode } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/components/ui/toast"
import {
  addTeamMember,
  getProjectTeamSeatSummary,
  removeTeamMember,
  revokeTeamInvitation,
  updateTeamMember,
  type ProjectTeamData,
  type ProjectTeamMember,
  type ProjectTeamInvitation,
} from "./actions"
import { TeamSeatSummarySubtitle } from "@/components/team/TeamSeatSummarySubtitle"
import type { TeamSeatSummary } from "@/lib/company/subscriptionTypes"
import {
  PROJECT_USER_TYPES,
  USER_TYPE_ROLES,
  type ProjectTeamRole,
  type ProjectUserType,
} from "@/lib/projects/createProjectDraft"
import { UserAvatar } from "@/components/user/UserAvatar"
import { useProjectPermission } from "@/components/project-shell/ProjectAccessProvider"
import { EQUIPO_EDIT_ROW } from "@/lib/project/designTokens"
import {
  PROJECT_PERMISSION_TABLE,
  PROJECT_USER_TYPE_COLUMNS,
  type ProjectPermissionValue,
} from "@/lib/project/projectPermissions"

const PERMISSION_COLUMNS = PROJECT_USER_TYPE_COLUMNS

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const formInputClassName =
  "h-[44px] w-full rounded-[10px] border bg-white px-3 text-[14px] font-normal leading-5 text-[#0a0a0a] shadow-none placeholder:text-[#777b84] focus-visible:border-[#ff7433] focus-visible:ring-0"
const formInputStyle = { borderColor: "#edeef0" } as const
const formSelectTriggerClassName =
  "h-[44px] w-full rounded-[10px] border-[#e2e8f0] bg-white text-[14px] font-normal leading-5 text-[#0a0a0a] shadow-none focus:border-[#ff7433] focus:ring-0 data-[placeholder]:text-[#777b84]"

// Figma 1244:1189 — avatar | identidad | email (300px) | acciones
const TEAM_ROW_GRID =
  "grid grid-cols-[40px_minmax(0,1fr)_300px_auto] items-center gap-x-4 p-4"

type Props = {
  projectId: string
  initialData: ProjectTeamData
}

function getInitials(firstName: string, lastName: string): string {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  return initials || "??"
}

function MemberAvatar({
  member,
  size = "md",
  bgClassName,
  textClassName,
}: {
  member: Pick<ProjectTeamMember, "firstName" | "lastName" | "email" | "avatarUrl">
  size?: "md"
  bgClassName?: string
  textClassName?: string
}) {
  return (
    <UserAvatar
      firstName={member.firstName}
      lastName={member.lastName}
      email={member.email}
      avatarUrl={member.avatarUrl}
      size={size}
      bgClassName={bgClassName}
      textClassName={textClassName}
    />
  )
}

function FormSelect({
  id,
  value,
  placeholder,
  options,
  disabled,
  onChange,
}: {
  id: string
  value: string
  placeholder: string
  options: readonly string[]
  disabled?: boolean
  onChange: (value: string) => void
}) {
  return (
    <Select
      value={value || undefined}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger id={id} aria-label={placeholder} className={formSelectTriggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper">
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
    <div className="flex w-full min-w-0 items-center gap-2 text-[12px] leading-4 text-[#5a6169]">
      <Mail className="size-3.5 shrink-0" aria-hidden />
      <span className="min-w-0 truncate">{email}</span>
    </div>
  )
}

function RowActionButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick?: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-4 items-center justify-center text-[#777b84] disabled:cursor-not-allowed disabled:opacity-40 enabled:transition-opacity enabled:hover:opacity-80"
      aria-label={label}
    >
      {children}
    </button>
  )
}

function MemberRow({
  member,
  canEdit,
  canRemove,
  onEdit,
  onRemove,
}: {
  member: ProjectTeamMember
  canEdit: boolean
  canRemove: boolean
  onEdit: () => void
  onRemove: () => void
}) {
  return (
    <div
      className={`${TEAM_ROW_GRID} border-b border-[#edeef0] transition-colors last:border-b-0 hover:bg-[#fefcfb]`}
    >
      <MemberAvatar member={member} />

      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[14px] font-medium leading-5 text-[#1d293d]">
            {member.firstName} {member.lastName}
          </h3>
          {member.isYou ? (
            <span className="inline-flex items-center rounded-full bg-[#ff7433] px-2 py-0.5 text-[10px] font-medium leading-none tracking-[-0.5px] text-[#fefcfb]">
              Tú
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          {member.userTypeLabel ? (
            <span className="inline-flex items-center rounded-[12px] bg-[#ffeae0] px-2 py-0.5 text-[10px] font-medium leading-none tracking-[-0.5px] text-[#321a10]">
              {member.userTypeLabel}
            </span>
          ) : null}
          {member.roleLabel ? (
            <span className="text-[12px] leading-[1.4] tracking-[-0.36px] text-[#321a10]">
              {member.roleLabel}
            </span>
          ) : null}
        </div>
      </div>

      <MemberEmail email={member.email} />

      <div className="flex shrink-0 items-center justify-end gap-2">
        <RowActionButton
          label={`Editar a ${member.firstName} ${member.lastName}`}
          disabled={!canEdit}
          onClick={onEdit}
        >
          <SquarePen className="size-4" aria-hidden />
        </RowActionButton>
        <RowActionButton
          label={`Eliminar a ${member.firstName} ${member.lastName}`}
          disabled={!canRemove}
          onClick={onRemove}
        >
          <Trash2 className="size-4" aria-hidden />
        </RowActionButton>
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
        <MemberAvatar
          member={member}
          bgClassName="bg-[#ff7433]"
          textClassName="text-[12px] font-semibold text-white"
        />

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

        <MemberEmail email={member.email} />

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
  canRevoke,
  onRevoke,
}: {
  invitation: ProjectTeamInvitation
  canRevoke: boolean
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
            <span className="text-[12px] leading-[1.4] tracking-[-0.36px] text-[#321a10]">
              {invitation.roleLabel}
            </span>
          ) : null}
        </div>
      </div>

      <MemberEmail email={invitation.email} />

      <div className="flex shrink-0 items-center justify-end gap-2">
        <RowActionButton
          label={`Editar invitación de ${invitation.firstName} ${invitation.lastName}`}
          disabled
        >
          <SquarePen className="size-4" aria-hidden />
        </RowActionButton>
        <RowActionButton
          label={`Revocar invitación de ${invitation.firstName} ${invitation.lastName}`}
          disabled={!canRevoke}
          onClick={onRevoke}
        >
          <Trash2 className="size-4" aria-hidden />
        </RowActionButton>
      </div>
    </div>
  )
}

function PermissionCell({ value }: { value: ProjectPermissionValue }) {
  if (value === false) {
    return <span className="text-[16px] font-bold text-[#e5484d]">✕</span>
  }
  return (
    <span className="inline-flex flex-col items-center">
      <span className="text-[16px] font-bold text-[#56ba9f]">✓</span>
      {value === "unitOnly" ? (
        <span className="text-[10px] leading-3 text-[#90a1b9]">Su unidad</span>
      ) : null}
    </span>
  )
}

export function EquipoTeamView({ projectId, initialData }: Props) {
  const toast = useToast()
  const [members, setMembers] = useState(initialData.members)
  const [pendingInvitations, setPendingInvitations] = useState(
    initialData.pendingInvitations,
  )
  const [seatSummary, setSeatSummary] = useState<TeamSeatSummary | null>(
    initialData.seatSummary,
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
  const canAddUsers = useProjectPermission("addUsers")
  const canEditPermissions = useProjectPermission("editPermissions")

  const refreshSeatSummary = async () => {
    const summary = await getProjectTeamSeatSummary(projectId)
    setSeatSummary(summary)
  }

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

    if (result.kind === "member_added") {
      setMembers((prev) => [...prev, result.member])
      toast.success(`${result.member.firstName} ${result.member.lastName} fue agregado al equipo.`)
    } else {
      setPendingInvitations((prev) => [...prev, result.invitation])
      toast.success(`Invitación enviada a ${result.invitation.email}.`)
    }

    void refreshSeatSummary()
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
      void refreshSeatSummary()
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
      void refreshSeatSummary()
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
      void refreshSeatSummary()
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="font-recoleta text-[28px] font-normal leading-[1.05] text-[#272a2d]">
            Equipo de trabajo
          </h1>
          {seatSummary ? <TeamSeatSummarySubtitle summary={seatSummary} /> : null}
        </div>
        <Button
          variant="brand"
          size="brand"
          onClick={() => {
            setShowForm((v) => !v)
            setFormError("")
          }}
          disabled={!canAddUsers}
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
      {showForm && canAddUsers ? (
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
              id="member-user-type"
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
              id="member-role"
              value={role}
              placeholder="Rol"
              options={userType ? USER_TYPE_ROLES[userType] : []}
              disabled={!userType}
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
          className="overflow-x-auto rounded-[16px] border border-[#edeef0] bg-white"
          style={{ boxShadow: "0 0 10px rgba(243, 103, 31, 0.08)" }}
        >
          <div className="min-w-[704px]">
          {filteredMembers.length === 0 ? (
            <div className="px-4 py-8 text-center text-[14px] leading-5 text-[#777b84]">
              {searchQuery ? "Sin resultados para esa búsqueda." : "No hay miembros activos."}
            </div>
          ) : (
            filteredMembers.map((member) =>
              editingMemberId === member.memberId ? (
                canEditPermissions ? (
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
                ) : null
              ) : (
                <MemberRow
                  key={member.memberId}
                  member={member}
                  canEdit={canEditPermissions && !member.isYou}
                  canRemove={canEditPermissions && !member.isYou}
                  onEdit={() => setEditingMemberId(member.memberId)}
                  onRemove={() => void handleRemoveMember(member.memberId)}
                />
              ),
            )
          )}
          </div>
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
          <div className="overflow-x-auto rounded-[16px] border border-[#edeef0] bg-white">
            <div className="min-w-[704px]">
            {filteredPending.length === 0 ? (
              <div className="px-4 py-6 text-center text-[14px] leading-5 text-[#777b84]">
                Sin resultados para esa búsqueda.
              </div>
            ) : (
              filteredPending.map((invitation) => (
                <PendingRow
                  key={invitation.invitationId}
                  invitation={invitation}
                  canRevoke={canAddUsers}
                  onRevoke={() => void handleRevokeInvitation(invitation.invitationId)}
                />
              ))
            )}
            </div>
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
                {PROJECT_PERMISSION_TABLE.map((row, index) => (
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
