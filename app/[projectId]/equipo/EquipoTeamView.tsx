"use client"

import { useEffect, useState, type ReactNode } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog"
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
import { RolePermissionTooltip } from "@/components/ui/role-permission-tooltip"
import { cn } from "@/lib/utils"
import { FORM_MODAL_DIALOG, EQUIPO_LAYOUT } from "@/lib/project/designTokens"
import {
  getProjectPermissionColumnIndex,
  PROJECT_PERMISSION_DISPLAY_COLUMNS,
  PROJECT_PERMISSION_TABLE,
  PROJECT_ROLE_PERMISSION_TOOLTIPS,
  type ProjectPermissionDisplayColumn,
  type ProjectPermissionValue,
} from "@/lib/project/projectPermissions"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const formInputClassName =
  "h-[44px] w-full rounded-[10px] border bg-white px-3 text-[14px] font-normal leading-5 text-[#0a0a0a] shadow-none placeholder:text-[#777b84] focus-visible:border-[#ff7433] focus-visible:ring-0"
const formInputStyle = { borderColor: "#edeef0" } as const
const formSelectTriggerClassName =
  "h-[44px] w-full rounded-[10px] border-[#e2e8f0] bg-white text-[14px] font-normal leading-5 text-[#0a0a0a] shadow-none focus:border-[#ff7433] focus:ring-0 data-[placeholder]:text-[#777b84]"

// Figma 1244:1189 — avatar | identidad | email (300px) | acciones (desktop)
const TEAM_ROW_CLASSNAME =
  "grid grid-cols-[40px_minmax(0,1fr)_auto] gap-x-3 gap-y-2 border-b border-[#edeef0] p-4 transition-colors last:border-b-0 hover:bg-[#fefcfb] md:grid-cols-[40px_minmax(0,1fr)_300px_auto] md:items-center md:gap-x-4"

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
  className,
}: {
  member: Pick<ProjectTeamMember, "firstName" | "lastName" | "email" | "avatarUrl">
  size?: "md"
  bgClassName?: string
  textClassName?: string
  className?: string
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
      className={className}
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

function EditMemberDialog({
  member,
  open,
  onOpenChange,
  onSave,
}: {
  member: ProjectTeamMember | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (
    userType: ProjectUserType,
    role: ProjectTeamRole,
  ) => Promise<{ ok: boolean; error?: string }>
}) {
  const [editUserType, setEditUserType] = useState<ProjectUserType>(PROJECT_USER_TYPES[0])
  const [editRole, setEditRole] = useState<ProjectTeamRole>(
    USER_TYPE_ROLES[PROJECT_USER_TYPES[0]][0],
  )
  const [isSaving, setIsSaving] = useState(false)
  const [editError, setEditError] = useState("")

  useEffect(() => {
    if (!member || !open) return

    const nextUserType = (PROJECT_USER_TYPES.find((t) => t === member.userTypeLabel) ??
      PROJECT_USER_TYPES[0]) as ProjectUserType
    const nextRole = USER_TYPE_ROLES[nextUserType].find((r) => r === member.roleLabel)
      ? (member.roleLabel as ProjectTeamRole)
      : USER_TYPE_ROLES[nextUserType][0]

    setEditUserType(nextUserType)
    setEditRole(nextRole)
    setEditError("")
    setIsSaving(false)
  }, [member, open])

  const handleSave = async () => {
    if (!member) return

    const currentUserType = (PROJECT_USER_TYPES.find((t) => t === member.userTypeLabel) ??
      PROJECT_USER_TYPES[0]) as ProjectUserType
    const currentRole = USER_TYPE_ROLES[currentUserType].find((r) => r === member.roleLabel)
      ? (member.roleLabel as ProjectTeamRole)
      : USER_TYPE_ROLES[currentUserType][0]

    const hasChanges =
      editUserType !== currentUserType || editRole !== currentRole

    if (!hasChanges) {
      onOpenChange(false)
      return
    }

    setIsSaving(true)
    setEditError("")

    const result = await onSave(editUserType, editRole)

    setIsSaving(false)

    if (result.ok) {
      onOpenChange(false)
      return
    }

    setEditError(result.error ?? "No se pudieron guardar los cambios.")
  }

  if (!member) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName={FORM_MODAL_DIALOG.overlay}
        className={cn(FORM_MODAL_DIALOG.content, "max-w-[calc(100vw-32px)]")}
        showCloseButton={false}
      >
        <div className={cn(FORM_MODAL_DIALOG.body, "px-4 py-6 sm:px-[33px] sm:py-[41px]")}>
          <div className={FORM_MODAL_DIALOG.header}>
            <DialogTitle className={cn(FORM_MODAL_DIALOG.title, "text-[20px] sm:text-[24px]")}>
              Editar miembro
            </DialogTitle>
            <DialogDescription className={FORM_MODAL_DIALOG.description}>
              Actualizá el tipo de usuario y el rol de {member.firstName}{" "}
              {member.lastName}.
            </DialogDescription>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-[12px] border border-[#edeef0] bg-[#fefcfb] px-4 py-3">
              <MemberAvatar member={member} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium leading-5 text-[#1d293d]">
                  {member.firstName} {member.lastName}
                </p>
                <MemberEmail email={member.email} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="edit-member-user-type"
                  className="text-[12px] font-medium leading-4 text-[#43484e]"
                >
                  Tipo de usuario
                </label>
                <FormSelect
                  id="edit-member-user-type"
                  value={editUserType}
                  placeholder="Tipo de usuario"
                  options={PROJECT_USER_TYPES}
                  onChange={(v) => {
                    const nextType = v as ProjectUserType
                    setEditUserType(nextType)
                    setEditRole(USER_TYPE_ROLES[nextType][0])
                    if (editError) setEditError("")
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="edit-member-role"
                  className="text-[12px] font-medium leading-4 text-[#43484e]"
                >
                  Rol
                </label>
                <FormSelect
                  id="edit-member-role"
                  value={editRole}
                  placeholder="Rol"
                  options={USER_TYPE_ROLES[editUserType]}
                  onChange={(v) => {
                    setEditRole(v as ProjectTeamRole)
                    if (editError) setEditError("")
                  }}
                />
              </div>
            </div>

            {editError ? (
              <p className="text-[13px] leading-5 text-[#dc2626]">{editError}</p>
            ) : null}
          </div>

          <div className={cn(FORM_MODAL_DIALOG.actions, "flex-col-reverse sm:flex-row")}>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className={FORM_MODAL_DIALOG.cancelBtn}
            >
              Cancelar
            </button>
            <Button
              type="button"
              variant="brand"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className={FORM_MODAL_DIALOG.confirmBtn}
            >
              {isSaving ? (
                <>
                  <Spinner className="size-4" />
                  Guardando...
                </>
              ) : (
                "Confirmar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
    <div className={TEAM_ROW_CLASSNAME}>
      <MemberAvatar
        member={member}
        className="row-span-2 self-start md:row-span-1 md:self-center"
      />

      <div className="col-start-2 row-start-1 flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[14px] font-medium leading-5 text-[#1d293d]">
            {member.firstName} {member.lastName}
          </h3>
          {member.isYou ? (
            <span className="inline-flex shrink-0 items-center rounded-full bg-[#ff7433] px-2 py-0.5 text-[10px] font-medium leading-none tracking-[-0.5px] text-[#fefcfb]">
              Tú
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
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

      <div className="col-start-2 col-span-2 row-start-2 min-w-0 md:col-span-1 md:col-start-3 md:row-start-1">
        <MemberEmail email={member.email} />
      </div>

      <div className="col-start-3 row-start-1 flex shrink-0 items-center justify-end gap-2 md:col-start-4">
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
    <div className={TEAM_ROW_CLASSNAME}>
      <div className="row-span-2 self-start md:row-span-1 md:self-center">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f0f1f3] text-[12px] font-semibold text-[#777b84]">
          {getInitials(invitation.firstName, invitation.lastName)}
        </div>
      </div>

      <div className="col-start-2 row-start-1 flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-[14px] font-medium leading-5 text-[#1d293d]">
            {invitation.firstName} {invitation.lastName}
          </h3>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#fef9c3] px-2 py-0.5 text-[10px] font-medium leading-[10px] text-[#854d0e]">
            <Clock className="size-2.5" aria-hidden />
            Pendiente
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
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

      <div className="col-start-2 col-span-2 row-start-2 min-w-0 md:col-span-1 md:col-start-3 md:row-start-1">
        <MemberEmail email={invitation.email} />
      </div>

      <div className="col-start-3 row-start-1 flex shrink-0 items-center justify-end gap-2 md:col-start-4">
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
    return (
      <span className="text-[16px] font-bold leading-4 tracking-[-0.3125px] text-[#e5484d]">
        ✕
      </span>
    )
  }

  return (
    <span className="inline-flex flex-col items-center gap-0.5">
      <span className="text-[16px] font-bold leading-4 tracking-[-0.3125px] text-[#56ba9f]">
        ✓
      </span>
      {value === "unitOnly" ? (
        <span className="text-[10px] font-normal leading-[14.286px] tracking-[0.1172px] text-[#90a1b9]">
          Su unidad
        </span>
      ) : null}
    </span>
  )
}

function PermissionColumnHeader({ column }: { column: ProjectPermissionDisplayColumn }) {
  const tooltip = PROJECT_ROLE_PERMISSION_TOOLTIPS[column]

  return (
    <span className="inline-flex items-center justify-center gap-1.5">
      <span>{column}</span>
      <RolePermissionTooltip
        description={tooltip.description}
        roles={tooltip.roles}
      />
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
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
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
    setIsRemoving(true)

    const result = await removeTeamMember(memberId, projectId)

    setIsRemoving(false)

    if (result.ok) {
      const removedMember = members.find((member) => member.memberId === memberId)
      setMembers((prev) => prev.filter((m) => m.memberId !== memberId))
      setRemovingMemberId(null)
      void refreshSeatSummary()
      if (removedMember) {
        toast.success(
          `${removedMember.firstName} ${removedMember.lastName} fue eliminado del equipo.`,
        )
      }
      return
    }

    toast.error(result.error)
  }

  const handleConfirmRemove = () => {
    if (!removingMemberId || isRemoving) return
    void handleRemoveMember(removingMemberId)
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

  const editingMember =
    editingMemberId != null
      ? members.find((member) => member.memberId === editingMemberId) ?? null
      : null
  const removingMember =
    removingMemberId != null
      ? members.find((member) => member.memberId === removingMemberId) ?? null
      : null

  return (
    <div
      className="flex flex-col gap-4 py-4 sm:gap-6 sm:py-6"
      style={{
        maxWidth: EQUIPO_LAYOUT.contentMaxWidth,
        width: "100%",
        margin: "0 auto",
        paddingBottom: EQUIPO_LAYOUT.pageBottomPadding,
      }}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="font-recoleta text-[26px] font-normal leading-[1.05] text-[#272a2d] sm:text-[28px]">
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
          className="w-full text-[14px] font-normal leading-5 sm:w-auto"
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
          className="flex flex-col gap-3 rounded-[16px] border border-[#edeef0] bg-white px-4 py-4 sm:px-6"
          style={{ boxShadow: "0 0 10px rgba(243, 103, 31, 0.08)" }}
        >
          <h2 className="text-[18px] font-normal leading-7 text-[#272a2d] sm:text-[20px]">Nuevo miembro</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
              className="w-full shrink-0 px-6 text-[14px] font-normal leading-5 sm:w-auto"
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
          className="rounded-[16px] border border-[#edeef0] bg-white"
          style={{ boxShadow: "0 0 10px rgba(243, 103, 31, 0.08)" }}
        >
          {filteredMembers.length === 0 ? (
            <div className="px-4 py-8 text-center text-[14px] leading-5 text-[#777b84]">
              {searchQuery ? "Sin resultados para esa búsqueda." : "No hay miembros activos."}
            </div>
          ) : (
            filteredMembers.map((member) => (
              <MemberRow
                key={member.memberId}
                member={member}
                canEdit={canEditPermissions && !member.isYou}
                canRemove={canEditPermissions && !member.isYou}
                onEdit={() => setEditingMemberId(member.memberId)}
                onRemove={() => {
                  setRemovingMemberId(member.memberId)
                  if (editingMemberId === member.memberId) {
                    setEditingMemberId(null)
                  }
                }}
              />
            ))
          )}
        </div>

        <p className="text-[12px] leading-4 text-[#777b84]">
          Mostrando {filteredMembers.length} de {members.length} miembros
        </p>
      </div>

      {/* Pending invitations */}
      {pendingInvitations.length > 0 ? (
        <div className="flex flex-col gap-4">
          <h2 className="text-[16px] font-normal leading-5 text-[#272a2d] sm:text-[18px]">
            Usuarios pendientes de activación
          </h2>
          <div className="rounded-[16px] border border-[#edeef0] bg-white">
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
      ) : null}

      {/* Permisos de usuarios */}
      <div
        className="rounded-[16px] border border-[#edeef0] bg-white px-4 py-4 sm:py-6"
        style={{ boxShadow: "0 0 10px rgba(243, 103, 31, 0.08)" }}
      >
        <button
          type="button"
          onClick={() => setPermisosOpen((v) => !v)}
          className="flex w-full items-center gap-2"
          aria-expanded={permisosOpen}
        >
          <ShieldCheck className="size-4 shrink-0 text-[#43484e]" aria-hidden />
          <h2 className="flex-1 text-left text-[16px] font-normal leading-5 text-[#272a2d] sm:text-[18px]">
            Permisos de usuarios
          </h2>
          <ChevronDown
            className={`size-4 shrink-0 text-[#43484e] transition-transform ${permisosOpen ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>

        {permisosOpen ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] table-fixed border-collapse">
              <colgroup>
                <col style={{ width: EQUIPO_LAYOUT.permissionsActionColumnWidth }} />
                <col />
                <col />
                <col />
                <col />
              </colgroup>
              <thead>
                <tr className="border-b-2 border-[#e2e8f0]">
                  <th className="h-[41px] px-4 text-left text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#696e77]">
                    Pantalla / Acción
                  </th>
                  {PROJECT_PERMISSION_DISPLAY_COLUMNS.map((column) => (
                    <th
                      key={column}
                      className="h-[41px] px-4 text-center text-[14px] font-medium leading-[1.4] text-[#314158]"
                    >
                      <PermissionColumnHeader column={column} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PROJECT_PERMISSION_TABLE.map((row, index) => (
                  <tr
                    key={row.action}
                    className="h-9"
                    style={{
                      backgroundColor:
                        index % 2 === 0 ? "#ffffff" : "rgba(237, 238, 240, 0.4)",
                    }}
                  >
                    <td className="px-4 py-2 text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#43484e]">
                      {row.action}
                    </td>
                    {PROJECT_PERMISSION_DISPLAY_COLUMNS.map((column) => {
                      const columnIndex = getProjectPermissionColumnIndex(column)
                      return (
                        <td
                          key={column}
                          className="px-4 py-2 text-center align-middle"
                        >
                          <PermissionCell value={row.values[columnIndex] ?? false} />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <EditMemberDialog
        member={editingMember}
        open={canEditPermissions && editingMember != null}
        onOpenChange={(open) => {
          if (!open) setEditingMemberId(null)
        }}
        onSave={(userType, role) => {
          if (!editingMember) return Promise.resolve({ ok: false as const })
          return handleUpdateMember(editingMember.memberId, userType, role)
        }}
      />

      <ConfirmActionDialog
        open={canEditPermissions && removingMember != null}
        onOpenChange={(open) => {
          if (isRemoving) return
          if (!open) setRemovingMemberId(null)
        }}
        title="¿Eliminar miembro?"
        description={
          removingMember
            ? `Se quitará a ${removingMember.firstName} ${removingMember.lastName} del equipo de trabajo del proyecto. ¿Deseás continuar?`
            : ""
        }
        confirmLabel="Eliminar"
        loading={isRemoving}
        loadingLabel="Eliminando..."
        onConfirm={handleConfirmRemove}
      />
    </div>
  )
}
