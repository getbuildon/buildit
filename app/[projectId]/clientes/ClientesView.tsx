"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  ChevronDown,
  Clock,
  Mail,
  Phone,
  Plus,
  SquarePen,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { UserAvatar } from "@/components/user/UserAvatar"
import { cn } from "@/lib/utils"
import { CLIENTES_LAYOUT, FORM_MODAL_DIALOG } from "@/lib/project/designTokens"
import {
  addProjectClientInvitation,
  getProjectClientSeatSummary,
  removeProjectClient,
  revokeClientInvitation,
  updateProjectClient,
  updateProjectClientInvitation,
  type ProjectClient,
  type ProjectClientInvitation,
  type ProjectClientsData,
  type ProjectUnitOption,
} from "./actions"
import { ClientSeatSummarySubtitle } from "@/components/clients/ClientSeatSummarySubtitle"
import { useToast } from "@/components/ui/toast"
import { useProjectPermission } from "@/components/project-shell/ProjectAccessProvider"
import type { ClientSeatSummary } from "@/lib/company/subscriptionTypes"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const clientInputClassName =
  "h-[44px] w-full min-w-0 rounded-[10px] border bg-white px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#0a0a0a] shadow-none placeholder:text-[#777b84] focus-visible:border-[#ff7433] focus-visible:ring-0"
const clientInputStyle = { borderColor: "#afb3ba" } as const

const CLIENT_ROW_CLASS =
  "flex items-center gap-4 border-b border-[#edeef0] p-4 last:border-b-0"

/** Figma Orange Soft — solo en cards blancas con borde redondeado. */
const CLIENTES_CARD_SHADOW = "0 0 5px rgba(243, 103, 31, 0.08)"

type Props = {
  projectId: string
  initialData: ProjectClientsData
}

type EditingTarget =
  | { type: "client"; id: string }
  | { type: "invitation"; id: string }
  | null

type RemovingTarget =
  | { type: "client"; id: string }
  | { type: "invitation"; id: string }
  | null

type EditClientDialogTarget =
  | { type: "client"; client: ProjectClient }
  | { type: "invitation"; invitation: ProjectClientInvitation }

function EditClientDialog({
  target,
  unitOptions,
  assignedEmails,
  open,
  onOpenChange,
  onSaveClient,
  onSaveInvitation,
}: {
  target: EditClientDialogTarget | null
  unitOptions: ProjectUnitOption[]
  assignedEmails: Set<string>
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveClient: (
    userId: string,
    data: {
      firstName: string
      lastName: string
      phone: string | null
      unitIds: string[]
    },
  ) => Promise<{ ok: boolean; error?: string }>
  onSaveInvitation: (
    invitationId: string,
    data: {
      firstName: string
      lastName: string
      email: string
      phone: string | null
      unitIds: string[]
    },
  ) => Promise<{ ok: boolean; error?: string }>
}) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [editError, setEditError] = useState("")

  useEffect(() => {
    if (!target || !open) return

    if (target.type === "client") {
      setFirstName(target.client.firstName)
      setLastName(target.client.lastName)
      setEmail(target.client.email)
      setPhone(target.client.phone ?? "")
      setSelectedUnitIds(target.client.units.map((unit) => unit.id))
    } else {
      setFirstName(target.invitation.firstName)
      setLastName(target.invitation.lastName)
      setEmail(target.invitation.email)
      setPhone(target.invitation.phone ?? "")
      setSelectedUnitIds(target.invitation.units.map((unit) => unit.id))
    }

    setEditError("")
    setIsSaving(false)
  }, [target, open])

  const handleSave = async () => {
    if (!target) return

    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPhone = phone.trim()

    if (!trimmedFirst) {
      setEditError("Ingresá el nombre.")
      return
    }
    if (!trimmedLast) {
      setEditError("Ingresá el apellido.")
      return
    }
    if (target.type === "invitation") {
      if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
        setEditError("Ingresá un correo electrónico válido.")
        return
      }
      if (assignedEmails.has(trimmedEmail)) {
        setEditError("Ese correo ya está registrado.")
        return
      }
    }

    setIsSaving(true)
    setEditError("")

    const result =
      target.type === "client"
        ? await onSaveClient(target.client.userId, {
            firstName: trimmedFirst,
            lastName: trimmedLast,
            phone: trimmedPhone || null,
            unitIds: selectedUnitIds,
          })
        : await onSaveInvitation(target.invitation.invitationId, {
            firstName: trimmedFirst,
            lastName: trimmedLast,
            email: trimmedEmail,
            phone: trimmedPhone || null,
            unitIds: selectedUnitIds,
          })

    setIsSaving(false)

    if (result.ok) {
      onOpenChange(false)
      return
    }

    setEditError(result.error ?? "No se pudieron guardar los cambios.")
  }

  if (!target) return null

  const displayName =
    target.type === "client"
      ? `${target.client.firstName} ${target.client.lastName}`
      : `${target.invitation.firstName} ${target.invitation.lastName}`

  const displayEmail =
    target.type === "client" ? target.client.email : target.invitation.email

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName={FORM_MODAL_DIALOG.overlay}
        className={FORM_MODAL_DIALOG.content}
        showCloseButton={false}
      >
        <div className={FORM_MODAL_DIALOG.body}>
          <div className={FORM_MODAL_DIALOG.header}>
            <DialogTitle className={FORM_MODAL_DIALOG.title}>
              Editar cliente
            </DialogTitle>
            <DialogDescription className={FORM_MODAL_DIALOG.description}>
              Actualizá los datos de {displayName}.
            </DialogDescription>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-[12px] border border-[#edeef0] bg-[#fefcfb] px-4 py-3">
              <UserAvatar
                firstName={
                  target.type === "client"
                    ? target.client.firstName
                    : target.invitation.firstName
                }
                lastName={
                  target.type === "client"
                    ? target.client.lastName
                    : target.invitation.lastName
                }
                email={displayEmail}
                avatarUrl={
                  target.type === "client" ? target.client.avatarUrl : null
                }
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[14px] font-medium leading-5 text-[#1d293d]">
                    {displayName}
                  </p>
                  {target.type === "invitation" ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#fef9c3] px-2 py-0.5 text-[10px] font-medium leading-[10px] text-[#854d0e]">
                      <Clock className="size-2.5" aria-hidden />
                      Pendiente
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5 text-[12px] leading-4 text-[#5a6169]">
                  <Mail className="size-3 shrink-0" aria-hidden />
                  <span className="truncate">{displayEmail}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="edit-client-first-name"
                  className="text-[12px] font-medium leading-4 text-[#43484e]"
                >
                  Nombre
                </label>
                <Input
                  id="edit-client-first-name"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value)
                    if (editError) setEditError("")
                  }}
                  placeholder="Nombre"
                  className={clientInputClassName}
                  style={clientInputStyle}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="edit-client-last-name"
                  className="text-[12px] font-medium leading-4 text-[#43484e]"
                >
                  Apellido
                </label>
                <Input
                  id="edit-client-last-name"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value)
                    if (editError) setEditError("")
                  }}
                  placeholder="Apellido"
                  className={clientInputClassName}
                  style={clientInputStyle}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="edit-client-email"
                  className="text-[12px] font-medium leading-4 text-[#43484e]"
                >
                  Correo electrónico
                </label>
                <Input
                  id="edit-client-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (editError) setEditError("")
                  }}
                  placeholder="correo@ejemplo.com"
                  className={clientInputClassName}
                  style={clientInputStyle}
                  disabled={target.type === "client"}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="edit-client-phone"
                  className="text-[12px] font-medium leading-4 text-[#43484e]"
                >
                  Teléfono
                </label>
                <Input
                  id="edit-client-phone"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    if (editError) setEditError("")
                  }}
                  placeholder="+595 981 123 456"
                  className={clientInputClassName}
                  style={clientInputStyle}
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[12px] font-medium leading-4 text-[#43484e]">
                  Unidades
                </label>
                <UnitMultiSelect
                  options={unitOptions}
                  selectedIds={selectedUnitIds}
                  onChange={setSelectedUnitIds}
                  disabled={isSaving}
                />
              </div>
            </div>

            {editError ? (
              <p className="text-[13px] leading-5 text-[#dc2626]">{editError}</p>
            ) : null}
          </div>

          <div className={FORM_MODAL_DIALOG.actions}>
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

function formatUnitOptionLabel(option: ProjectUnitOption): string {
  const trimmedLabel = option.label.trim()
  if (trimmedLabel.toLowerCase().startsWith("unidad ")) {
    return trimmedLabel
  }

  const identifier = option.pillLabel.trim()
  return identifier ? `Unidad ${identifier}` : trimmedLabel
}

function UnitSelectCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-[2px] border border-[#314158]",
        checked ? "bg-[#314158]" : "bg-white",
      )}
      aria-hidden
    >
      {checked ? (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  )
}

function UnitMultiSelect({
  options,
  selectedIds,
  onChange,
  disabled,
  className,
}: {
  options: ProjectUnitOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const selectedLabels = options
    .filter((option) => selectedIds.includes(option.id))
    .map((option) => formatUnitOptionLabel(option))

  const toggleUnit = (unitId: string) => {
    onChange(
      selectedIds.includes(unitId)
        ? selectedIds.filter((id) => id !== unitId)
        : [...selectedIds, unitId],
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            clientInputClassName,
            "flex items-center justify-between gap-2 text-left",
            disabled && "cursor-not-allowed opacity-60",
            selectedLabels.length === 0 && "text-[#777b84]",
            className,
          )}
          style={clientInputStyle}
        >
          <span className="truncate">
            {selectedLabels.length > 0
              ? `${selectedLabels.length} unidad${selectedLabels.length === 1 ? "" : "es"}`
              : "Unidad"}
          </span>
          <ChevronDown className="size-4 shrink-0 text-[#777b84]" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-auto min-w-[var(--radix-popover-trigger-width)] border-[#edeef0] p-2 shadow-[0_0_10px_rgba(243,103,31,0.08)]"
      >
        <div className="max-h-[260px] overflow-y-auto px-2 pt-2">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-[13px] text-[#777b84]">
              No hay unidades configuradas.
            </p>
          ) : (
            options.map((option) => {
              const checked = selectedIds.includes(option.id)
              return (
                <button
                  key={option.id}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  aria-label={formatUnitOptionLabel(option)}
                  onClick={() => toggleUnit(option.id)}
                  className="flex h-9 w-full items-center gap-2 rounded-[4px] px-3 py-2 text-left transition-colors hover:bg-[#fefcfb]"
                >
                  <UnitSelectCheckbox checked={checked} />
                  <span className="whitespace-nowrap text-[14px] font-medium leading-5 tracking-[-0.15px] text-[#314158]">
                    {formatUnitOptionLabel(option)}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function UnitsSummary({ units }: { units: ProjectClient["units"] }) {
  if (units.length === 0) {
    return <div className="h-11 w-[200px] shrink-0" aria-hidden />
  }

  return (
    <div className="flex h-11 w-[200px] shrink-0 items-center justify-end gap-3">
      <span className="whitespace-nowrap text-[14px] font-medium leading-[1.4] text-[#314158]">
        {units.length} unidad{units.length === 1 ? "" : "es"}
      </span>
      <div className="flex items-center gap-1">
        {units.map((unit) => (
          <span
            key={unit.id}
            title={unit.label}
            className="inline-flex items-center rounded-[8px] bg-[#ffeae0] px-[7px] py-px text-[12px] font-medium leading-4 text-[#d04c00]"
          >
            {unit.pillLabel}
          </span>
        ))}
      </div>
    </div>
  )
}

function RowActionButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
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

function ClientRow({
  client,
  canManage,
  onEdit,
  onRemove,
}: {
  client: ProjectClient
  canManage: boolean
  onEdit: () => void
  onRemove: () => void
}) {
  return (
    <div className={CLIENT_ROW_CLASS}>
      <UserAvatar
        firstName={client.firstName}
        lastName={client.lastName}
        email={client.email}
        avatarUrl={client.avatarUrl}
      />

      <div className="flex w-[428px] min-w-0 shrink-0 flex-col gap-1">
        <h3 className="truncate text-[14px] font-medium leading-[1.4] text-[#1d293d]">
          {client.firstName} {client.lastName}
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex w-[180px] min-w-0 items-center gap-1.5 text-[14px] leading-[1.4] text-[#43484e]">
            <Mail className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{client.email}</span>
          </span>
          {client.phone ? (
            <span className="flex items-center gap-1.5 text-[14px] leading-[1.4] text-[#43484e]">
              <Phone className="size-3 shrink-0" aria-hidden />
              {client.phone}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-12">
        <UnitsSummary units={client.units} />
        <div className="flex shrink-0 items-center gap-2">
          <RowActionButton
            label={`Editar a ${client.firstName} ${client.lastName}`}
            disabled={!canManage}
            onClick={onEdit}
          >
            <SquarePen className="size-4" aria-hidden />
          </RowActionButton>
          <RowActionButton
            label={`Eliminar a ${client.firstName} ${client.lastName}`}
            disabled={!canManage}
            onClick={onRemove}
          >
            <Trash2 className="size-4" aria-hidden />
          </RowActionButton>
        </div>
      </div>
    </div>
  )
}

function PendingClientRow({
  invitation,
  canManage,
  onEdit,
  onRevoke,
}: {
  invitation: ProjectClientInvitation
  canManage: boolean
  onEdit: () => void
  onRevoke: () => void
}) {
  return (
    <div className={CLIENT_ROW_CLASS}>
      <UserAvatar
        firstName={invitation.firstName}
        lastName={invitation.lastName}
        email={invitation.email}
      />

      <div className="flex w-[428px] min-w-0 shrink-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[14px] font-medium leading-[1.4] text-[#1d293d]">
            {invitation.firstName} {invitation.lastName}
          </h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fef9c3] px-2 py-0.5 text-[10px] font-medium leading-[10px] text-[#854d0e]">
            <Clock className="size-2.5" aria-hidden />
            Pendiente
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex w-[180px] min-w-0 items-center gap-1.5 text-[14px] leading-[1.4] text-[#43484e]">
            <Mail className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{invitation.email}</span>
          </span>
          {invitation.phone ? (
            <span className="flex items-center gap-1.5 text-[14px] leading-[1.4] text-[#43484e]">
              <Phone className="size-3 shrink-0" aria-hidden />
              {invitation.phone}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-12">
        <UnitsSummary units={invitation.units} />
        <div className="flex shrink-0 items-center gap-2">
          <RowActionButton
            label={`Editar invitación de ${invitation.firstName} ${invitation.lastName}`}
            disabled={!canManage}
            onClick={onEdit}
          >
            <SquarePen className="size-4" aria-hidden />
          </RowActionButton>
          <RowActionButton
            label={`Revocar invitación de ${invitation.firstName} ${invitation.lastName}`}
            disabled={!canManage}
            onClick={onRevoke}
          >
            <Trash2 className="size-4" aria-hidden />
          </RowActionButton>
        </div>
      </div>
    </div>
  )
}

export function ClientesView({ projectId, initialData }: Props) {
  const toast = useToast()
  const [clients, setClients] = useState(initialData.clients)
  const [pendingInvitations, setPendingInvitations] = useState(
    initialData.pendingInvitations,
  )
  const [unitOptions] = useState(initialData.unitOptions)
  const [seatSummary, setSeatSummary] = useState<ClientSeatSummary | null>(
    initialData.seatSummary,
  )

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTarget, setEditingTarget] = useState<EditingTarget>(null)
  const [removingTarget, setRemovingTarget] = useState<RemovingTarget>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [formError, setFormError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const canManageClients = useProjectPermission("manageClients")

  const refreshSeatSummary = async () => {
    const summary = await getProjectClientSeatSummary(projectId)
    setSeatSummary(summary)
  }

  const assignedEmails = useMemo(() => {
    const emails = new Set<string>()
    for (const client of clients) emails.add(client.email.toLowerCase())
    for (const invitation of pendingInvitations) {
      if (
        editingTarget?.type === "invitation" &&
        editingTarget.id === invitation.invitationId
      ) {
        continue
      }
      emails.add(invitation.email.toLowerCase())
    }
    return emails
  }, [clients, pendingInvitations, editingTarget])

  const resetAddForm = () => {
    setFirstName("")
    setLastName("")
    setEmail("")
    setPhone("")
    setSelectedUnitIds([])
    setShowAddForm(false)
    setFormError("")
  }

  const closeAddForm = () => {
    resetAddForm()
  }

  const openAddForm = () => {
    setFirstName("")
    setLastName("")
    setEmail("")
    setPhone("")
    setSelectedUnitIds([])
    setFormError("")
    setShowAddForm(true)
  }

  const handleSaveClient = async (
    userId: string,
    data: {
      firstName: string
      lastName: string
      phone: string | null
      unitIds: string[]
    },
  ) => {
    const result = await updateProjectClient(projectId, userId, data)

    if (!result.ok) {
      return { ok: false as const, error: result.error }
    }

    setClients((prev) =>
      prev.map((client) => (client.userId === userId ? result.client : client)),
    )
    toast.success(
      `${result.client.firstName} ${result.client.lastName} fue actualizado.`,
    )
    return { ok: true as const }
  }

  const handleSaveInvitation = async (
    invitationId: string,
    data: {
      firstName: string
      lastName: string
      email: string
      phone: string | null
      unitIds: string[]
    },
  ) => {
    const result = await updateProjectClientInvitation(
      projectId,
      invitationId,
      data,
    )

    if (!result.ok) {
      return { ok: false as const, error: result.error }
    }

    setPendingInvitations((prev) =>
      prev.map((invitation) =>
        invitation.invitationId === invitationId ? result.invitation : invitation,
      ),
    )
    toast.success(
      `Invitación de ${result.invitation.firstName} ${result.invitation.lastName} actualizada.`,
    )
    void refreshSeatSummary()
    return { ok: true as const }
  }

  const handleSubmitAdd = async () => {
    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPhone = phone.trim()

    if (!trimmedFirst) {
      setFormError("Ingresá el nombre.")
      return
    }
    if (!trimmedLast) {
      setFormError("Ingresá el apellido.")
      return
    }
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      setFormError("Ingresá un correo electrónico válido.")
      return
    }
    if (assignedEmails.has(trimmedEmail)) {
      setFormError("Ese correo ya está registrado.")
      return
    }

    setIsSubmitting(true)
    setFormError("")

    const result = await addProjectClientInvitation(projectId, {
      firstName: trimmedFirst,
      lastName: trimmedLast,
      email: trimmedEmail,
      phone: trimmedPhone || null,
      unitIds: selectedUnitIds,
    })

    setIsSubmitting(false)

    if (!result.ok) {
      setFormError(result.error)
      return
    }

    if (result.kind === "client_added") {
      setClients((prev) => [...prev, result.client])
      toast.success(`${result.client.firstName} ${result.client.lastName} fue agregado como cliente.`)
    } else {
      setPendingInvitations((prev) => [...prev, result.invitation])
      toast.success(`Invitación enviada a ${result.invitation.email}.`)
    }

    resetAddForm()
    void refreshSeatSummary()
  }

  const handleRemoveClient = async (userId: string) => {
    setIsRemoving(true)

    const removedClient = clients.find((client) => client.userId === userId)
    const result = await removeProjectClient(projectId, userId)

    setIsRemoving(false)

    if (result.ok) {
      setClients((prev) => prev.filter((client) => client.userId !== userId))
      setRemovingTarget(null)
      if (editingTarget?.type === "client" && editingTarget.id === userId) {
        setEditingTarget(null)
      }
      void refreshSeatSummary()
      if (removedClient) {
        toast.success(
          `${removedClient.firstName} ${removedClient.lastName} fue eliminado del proyecto.`,
        )
      }
      return
    }

    toast.error(result.error)
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    setIsRemoving(true)

    const revokedInvitation = pendingInvitations.find(
      (invitation) => invitation.invitationId === invitationId,
    )
    const result = await revokeClientInvitation(invitationId, projectId)

    setIsRemoving(false)

    if (result.ok) {
      setPendingInvitations((prev) =>
        prev.filter((invitation) => invitation.invitationId !== invitationId),
      )
      setRemovingTarget(null)
      if (
        editingTarget?.type === "invitation" &&
        editingTarget.id === invitationId
      ) {
        setEditingTarget(null)
      }
      void refreshSeatSummary()
      if (revokedInvitation) {
        toast.success(
          `Invitación de ${revokedInvitation.firstName} ${revokedInvitation.lastName} revocada.`,
        )
      }
      return
    }

    toast.error(result.error)
  }

  const handleConfirmRemove = () => {
    if (!removingTarget || isRemoving) return

    if (removingTarget.type === "client") {
      void handleRemoveClient(removingTarget.id)
      return
    }

    void handleRevokeInvitation(removingTarget.id)
  }

  const editingClientTarget = useMemo((): EditClientDialogTarget | null => {
    if (editingTarget?.type === "client") {
      const client = clients.find((item) => item.userId === editingTarget.id)
      return client ? { type: "client", client } : null
    }

    if (editingTarget?.type === "invitation") {
      const invitation = pendingInvitations.find(
        (item) => item.invitationId === editingTarget.id,
      )
      return invitation ? { type: "invitation", invitation } : null
    }

    return null
  }, [clients, editingTarget, pendingInvitations])

  const removingClient =
    removingTarget?.type === "client"
      ? clients.find((client) => client.userId === removingTarget.id) ?? null
      : null
  const removingInvitation =
    removingTarget?.type === "invitation"
      ? pendingInvitations.find(
          (invitation) => invitation.invitationId === removingTarget.id,
        ) ?? null
      : null
  const removingPerson = removingClient ?? removingInvitation
  const isRevokingInvitation = removingTarget?.type === "invitation"
  const totalCount = clients.length + pendingInvitations.length

  return (
    <div
      className="flex flex-col gap-8 pt-6"
      style={{
        maxWidth: CLIENTES_LAYOUT.contentMaxWidth,
        width: "100%",
        margin: "0 auto",
      }}
    >
      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="font-recoleta text-[28px] font-normal leading-[1.05] text-[#272a2d]">
            Clientes
          </h1>
          {seatSummary ? <ClientSeatSummarySubtitle summary={seatSummary} /> : null}
        </div>
        <Button
          variant="brand"
          size="brand"
          onClick={() => {
            if (showAddForm) {
              closeAddForm()
            } else {
              openAddForm()
            }
          }}
          disabled={!canManageClients}
          className="text-[14px] font-normal leading-[1.4]"
        >
          {showAddForm ? (
            <>
              <X className="size-4" aria-hidden />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="size-4" aria-hidden />
              Agregar cliente
            </>
          )}
        </Button>
      </div>

      {showAddForm && canManageClients ? (
        <div
          className="flex flex-col gap-3 rounded-[16px] border border-[#edeef0] bg-white px-4 pb-8 pt-4"
          style={{ boxShadow: CLIENTES_CARD_SHADOW }}
        >
          <h2 className="text-[20px] font-normal leading-[1.4] text-[#272a2d]">
            Nuevo cliente
          </h2>

          <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
            <Input
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value)
                if (formError) setFormError("")
              }}
              placeholder="Nombre"
              className={cn(clientInputClassName, "min-w-0 flex-1")}
              style={clientInputStyle}
            />
            <Input
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value)
                if (formError) setFormError("")
              }}
              placeholder="Apellido"
              className={cn(clientInputClassName, "min-w-0 flex-1")}
              style={clientInputStyle}
            />
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (formError) setFormError("")
              }}
              placeholder="correo@ejemplo.com"
              className={cn(clientInputClassName, "min-w-0 flex-1")}
              style={clientInputStyle}
            />
            <Input
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                if (formError) setFormError("")
              }}
              placeholder="+595 981 123 456"
              className={cn(clientInputClassName, "min-w-0 flex-1")}
              style={clientInputStyle}
            />
            <UnitMultiSelect
              options={unitOptions}
              selectedIds={selectedUnitIds}
              onChange={setSelectedUnitIds}
              className="min-w-0 flex-1"
            />
            <Button
              variant="brand"
              size="brand"
              onClick={() => void handleSubmitAdd()}
              disabled={isSubmitting}
              className="h-[44px] shrink-0 px-4 text-[14px] font-normal leading-[1.4]"
            >
              <Plus className="size-4" aria-hidden />
              {isSubmitting ? "..." : "Agregar"}
            </Button>
          </div>

          {formError ? (
            <p className="text-[13px] leading-5 text-[#dc2626]">{formError}</p>
          ) : null}
        </div>
      ) : null}

      {totalCount > 0 ? (
        <div className="flex flex-col gap-3">
          <div
            className="overflow-x-auto rounded-[16px] border border-[#edeef0] bg-white"
            style={{ boxShadow: CLIENTES_CARD_SHADOW }}
          >
            <div className="min-w-[860px]">
              {clients.map((client) => (
                <ClientRow
                  key={client.userId}
                  client={client}
                  canManage={canManageClients}
                  onEdit={() =>
                    setEditingTarget({ type: "client", id: client.userId })
                  }
                  onRemove={() => {
                    setRemovingTarget({ type: "client", id: client.userId })
                    if (
                      editingTarget?.type === "client" &&
                      editingTarget.id === client.userId
                    ) {
                      setEditingTarget(null)
                    }
                  }}
                />
              ))}
              {pendingInvitations.map((invitation) => (
                <PendingClientRow
                  key={invitation.invitationId}
                  invitation={invitation}
                  canManage={canManageClients}
                  onEdit={() =>
                    setEditingTarget({
                      type: "invitation",
                      id: invitation.invitationId,
                    })
                  }
                  onRevoke={() => {
                    setRemovingTarget({
                      type: "invitation",
                      id: invitation.invitationId,
                    })
                    if (
                      editingTarget?.type === "invitation" &&
                      editingTarget.id === invitation.invitationId
                    ) {
                      setEditingTarget(null)
                    }
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex h-8 items-center justify-between">
            <p className="text-[12px] leading-[1.4] tracking-[-0.36px] text-[#777b84]">
              Mostrando {totalCount} de {totalCount} clientes
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled
                className="rounded-[10px] border border-[#afb3ba] px-[13px] py-1.5 text-[12px] font-medium leading-[1.4] text-[#43484e] opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-[10px] bg-[#ff7433] text-[12px] font-medium leading-[1.4] text-white"
                aria-current="page"
              >
                1
              </button>
              <button
                type="button"
                disabled
                className="rounded-[10px] border border-[#afb3ba] px-[13px] py-1.5 text-[12px] font-medium leading-[1.4] text-[#43484e] opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="rounded-[16px] border border-[#edeef0] bg-white px-4 py-12 text-center text-[14px] leading-5 text-[#777b84]"
          style={{ boxShadow: CLIENTES_CARD_SHADOW }}
        >
          No hay clientes en este proyecto.
        </div>
      )}

      <EditClientDialog
        target={editingClientTarget}
        unitOptions={unitOptions}
        assignedEmails={assignedEmails}
        open={canManageClients && editingClientTarget != null}
        onOpenChange={(open) => {
          if (!open) setEditingTarget(null)
        }}
        onSaveClient={handleSaveClient}
        onSaveInvitation={handleSaveInvitation}
      />

      <ConfirmActionDialog
        open={canManageClients && removingPerson != null}
        onOpenChange={(open) => {
          if (isRemoving) return
          if (!open) setRemovingTarget(null)
        }}
        title={isRevokingInvitation ? "¿Revocar invitación?" : "¿Eliminar cliente?"}
        description={
          removingPerson
            ? isRevokingInvitation
              ? `Se revocará la invitación de ${removingPerson.firstName} ${removingPerson.lastName}. ¿Deseás continuar?`
              : `Se quitará a ${removingPerson.firstName} ${removingPerson.lastName} del proyecto. ¿Deseás continuar?`
            : ""
        }
        confirmLabel={isRevokingInvitation ? "Revocar" : "Eliminar"}
        loading={isRemoving}
        loadingLabel={isRevokingInvitation ? "Revocando..." : "Eliminando..."}
        onConfirm={handleConfirmRemove}
      />
    </div>
  )
}
