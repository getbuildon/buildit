"use client"

import { useMemo, useState, type ReactNode } from "react"
import {
  Check,
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
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { UserAvatar } from "@/components/user/UserAvatar"
import { cn } from "@/lib/utils"
import { CLIENTES_LAYOUT } from "@/lib/project/designTokens"
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

  const resetForm = () => {
    setFirstName("")
    setLastName("")
    setEmail("")
    setPhone("")
    setSelectedUnitIds([])
    setEditingTarget(null)
    setShowAddForm(false)
    setFormError("")
  }

  const closeForm = () => {
    resetForm()
  }

  const openAddForm = () => {
    setEditingTarget(null)
    setFirstName("")
    setLastName("")
    setEmail("")
    setPhone("")
    setSelectedUnitIds([])
    setFormError("")
    setShowAddForm(true)
  }

  const startEditClient = (client: ProjectClient) => {
    setShowAddForm(false)
    setEditingTarget({ type: "client", id: client.userId })
    setFirstName(client.firstName)
    setLastName(client.lastName)
    setEmail(client.email)
    setPhone(client.phone ?? "")
    setSelectedUnitIds(client.units.map((unit) => unit.id))
    setFormError("")
  }

  const startEditInvitation = (invitation: ProjectClientInvitation) => {
    setShowAddForm(false)
    setEditingTarget({ type: "invitation", id: invitation.invitationId })
    setFirstName(invitation.firstName)
    setLastName(invitation.lastName)
    setEmail(invitation.email)
    setPhone(invitation.phone ?? "")
    setSelectedUnitIds(invitation.units.map((unit) => unit.id))
    setFormError("")
  }

  const handleSubmit = async () => {
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
    if (!editingTarget && assignedEmails.has(trimmedEmail)) {
      setFormError("Ese correo ya está registrado.")
      return
    }
    if (
      editingTarget?.type === "invitation" &&
      assignedEmails.has(trimmedEmail)
    ) {
      setFormError("Ese correo ya está registrado.")
      return
    }

    setIsSubmitting(true)
    setFormError("")

    if (editingTarget?.type === "client") {
      const result = await updateProjectClient(projectId, editingTarget.id, {
        firstName: trimmedFirst,
        lastName: trimmedLast,
        phone: trimmedPhone || null,
        unitIds: selectedUnitIds,
      })

      setIsSubmitting(false)

      if (!result.ok) {
        setFormError(result.error)
        return
      }

      setClients((prev) =>
        prev.map((client) =>
          client.userId === editingTarget.id ? result.client : client,
        ),
      )
      resetForm()
      return
    }

    if (editingTarget?.type === "invitation") {
      const result = await updateProjectClientInvitation(
        projectId,
        editingTarget.id,
        {
          firstName: trimmedFirst,
          lastName: trimmedLast,
          email: trimmedEmail,
          phone: trimmedPhone || null,
          unitIds: selectedUnitIds,
        },
      )

      setIsSubmitting(false)

      if (!result.ok) {
        setFormError(result.error)
        return
      }

      setPendingInvitations((prev) =>
        prev.map((invitation) =>
          invitation.invitationId === editingTarget.id
            ? result.invitation
            : invitation,
        ),
      )
      resetForm()
      void refreshSeatSummary()
      return
    }

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

    resetForm()
    void refreshSeatSummary()
  }

  const handleRemoveClient = async (userId: string) => {
    const result = await removeProjectClient(projectId, userId)
    if (result.ok) {
      setClients((prev) => prev.filter((client) => client.userId !== userId))
      if (editingTarget?.type === "client" && editingTarget.id === userId) {
        resetForm()
      }
      void refreshSeatSummary()
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    const result = await revokeClientInvitation(invitationId, projectId)
    if (result.ok) {
      setPendingInvitations((prev) =>
        prev.filter((invitation) => invitation.invitationId !== invitationId),
      )
      if (
        editingTarget?.type === "invitation" &&
        editingTarget.id === invitationId
      ) {
        resetForm()
      }
      void refreshSeatSummary()
    }
  }

  const isEditing = editingTarget !== null
  const isFormOpen = showAddForm || isEditing
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
            if (isFormOpen) {
              closeForm()
            } else {
              openAddForm()
            }
          }}
          disabled={!canManageClients}
          className="text-[14px] font-normal leading-[1.4]"
        >
          {isFormOpen ? (
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

      {isFormOpen && canManageClients ? (
        <div
          className="flex flex-col gap-3 rounded-[16px] border border-[#edeef0] bg-white px-4 pb-8 pt-4"
          style={{ boxShadow: CLIENTES_CARD_SHADOW }}
        >
          <h2 className="text-[20px] font-normal leading-[1.4] text-[#272a2d]">
            {isEditing ? "Editar cliente" : "Nuevo cliente"}
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
              disabled={editingTarget?.type === "client"}
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
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="h-[44px] shrink-0 px-4 text-[14px] font-normal leading-[1.4]"
            >
              {isEditing ? (
                <>
                  <Check className="size-4" aria-hidden />
                  {isSubmitting ? "..." : "Guardar"}
                </>
              ) : (
                <>
                  <Plus className="size-4" aria-hidden />
                  {isSubmitting ? "..." : "Agregar"}
                </>
              )}
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
                  onEdit={() => startEditClient(client)}
                  onRemove={() => void handleRemoveClient(client.userId)}
                />
              ))}
              {pendingInvitations.map((invitation) => (
                <PendingClientRow
                  key={invitation.invitationId}
                  invitation={invitation}
                  canManage={canManageClients}
                  onEdit={() => startEditInvitation(invitation)}
                  onRevoke={() =>
                    void handleRevokeInvitation(invitation.invitationId)
                  }
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
    </div>
  )
}
