"use client"

import { useState } from "react"
import { Clock, Mail, Phone, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  addProjectClientInvitation,
  removeProjectClient,
  revokeClientInvitation,
  type ProjectClientsData,
  type ProjectClient,
  type ProjectClientInvitation,
} from "./actions"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const clientInputClassName =
  "h-[44px] w-full rounded-[10px] border bg-white px-3 text-[14px] font-normal leading-5 text-[#0a0a0a] shadow-none placeholder:text-[#777b84] focus-visible:border-[#ff7433] focus-visible:ring-0"
const clientInputStyle = { borderColor: "#afb3ba" } as const

type Props = {
  projectId: string
  initialData: ProjectClientsData
}

function getInitials(firstName: string, lastName: string): string {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  return initials || "??"
}

function ClientRow({
  client,
  onRemove,
}: {
  client: ProjectClient
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-4 border-b border-[#edeef0] px-4 py-4 transition-colors last:border-b-0 hover:bg-[#fefcfb]">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#ff7433] text-[12px] font-semibold text-white">
        {getInitials(client.firstName, client.lastName)}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="truncate text-[14px] font-medium leading-5 text-[#1d293d]">
          {client.firstName} {client.lastName}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#43484e]">
          <span className="flex items-center gap-1.5">
            <Mail className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{client.email}</span>
          </span>
          {client.phone ? (
            <span className="flex items-center gap-1.5">
              <Phone className="size-3 shrink-0" aria-hidden />
              {client.phone}
            </span>
          ) : null}
        </div>
      </div>

      {client.units.length > 0 ? (
        <div className="hidden w-[200px] shrink-0 flex-col gap-1 lg:flex">
          <span className="text-[12px] font-medium leading-4 text-[#314158]">
            {client.units.length} unidad{client.units.length !== 1 ? "es" : ""}
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {client.units.map((unit) => (
              <span
                key={unit.id}
                title={unit.label}
                className="inline-flex items-center rounded-[8px] bg-[#ffeae0] px-[7px] py-px text-[11px] font-medium leading-4 text-[#d04c00]"
              >
                {unit.label.length > 18 ? `${unit.label.slice(0, 16)}…` : unit.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={onRemove}
          className="text-[#777b84] transition-opacity hover:opacity-80"
          aria-label={`Eliminar a ${client.firstName} ${client.lastName}`}
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}

function PendingClientRow({
  invitation,
  onRevoke,
}: {
  invitation: ProjectClientInvitation
  onRevoke: () => void
}) {
  return (
    <div className="flex items-center gap-4 border-b border-[#edeef0] px-4 py-4 transition-colors last:border-b-0 hover:bg-[#fefcfb]">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f0f1f3] text-[12px] font-semibold text-[#777b84]">
        {getInitials(invitation.firstName, invitation.lastName)}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[14px] font-medium leading-5 text-[#1d293d]">
            {invitation.firstName} {invitation.lastName}
          </h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fef9c3] px-2 py-0.5 text-[10px] font-medium leading-[10px] text-[#854d0e]">
            <Clock className="size-2.5" aria-hidden />
            Pendiente
          </span>
        </div>
        <span className="flex items-center gap-1.5 text-[12px] text-[#43484e]">
          <Mail className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{invitation.email}</span>
        </span>
      </div>

      <div className="flex shrink-0 items-center">
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

export function ClientesView({ projectId, initialData }: Props) {
  const [clients, setClients] = useState(initialData.clients)
  const [pendingInvitations, setPendingInvitations] = useState(
    initialData.pendingInvitations,
  )
  const [showForm, setShowForm] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [formError, setFormError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const assignedEmails = new Set([
    ...clients.map((c) => c.email.toLowerCase()),
    ...pendingInvitations.map((i) => i.email.toLowerCase()),
  ])

  const handleAddClient = async () => {
    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedFirst) { setFormError("Ingresá el nombre."); return }
    if (!trimmedLast) { setFormError("Ingresá el apellido."); return }
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
    setShowForm(false)
  }

  const handleRemoveClient = async (userId: string) => {
    const result = await removeProjectClient(projectId, userId)
    if (result.ok) {
      setClients((prev) => prev.filter((c) => c.userId !== userId))
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    const result = await revokeClientInvitation(invitationId, projectId)
    if (result.ok) {
      setPendingInvitations((prev) =>
        prev.filter((i) => i.invitationId !== invitationId),
      )
    }
  }

  const totalCount = clients.length + pendingInvitations.length

  return (
    <div
      className="flex flex-col gap-8 pt-6"
      style={{ maxWidth: "747px", width: "100%", margin: "0 auto" }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-recoleta text-[28px] font-normal leading-tight text-[#272a2d]">
            Clientes
          </h1>
          <p className="text-[14px] leading-5 text-[#43484e]">
            {clients.length} cliente{clients.length !== 1 ? "s" : ""} en este proyecto
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
              Agregar cliente
            </>
          )}
        </Button>
      </div>

      {/* Nuevo cliente form */}
      {showForm ? (
        <div
          className="flex flex-col gap-3 rounded-[16px] border border-[#edeef0] bg-white p-4"
          style={{ boxShadow: "0 0 10px rgba(243, 103, 31, 0.08)" }}
        >
          <h2 className="text-[20px] font-normal leading-7 text-[#272a2d]">Nuevo cliente</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value)
                if (formError) setFormError("")
              }}
              placeholder="Nombre"
              className={clientInputClassName}
              style={clientInputStyle}
            />
            <Input
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value)
                if (formError) setFormError("")
              }}
              placeholder="Apellido"
              className={clientInputClassName}
              style={clientInputStyle}
            />
            <div className="flex gap-2">
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
                    void handleAddClient()
                  }
                }}
                placeholder="correo@ejemplo.com"
                className={`${clientInputClassName} flex-1`}
                style={clientInputStyle}
              />
              <Button
                variant="brand"
                size="brand"
                onClick={() => void handleAddClient()}
                disabled={isSubmitting}
                className="shrink-0 text-[14px] font-normal leading-5"
              >
                <Plus className="size-4" aria-hidden />
                {isSubmitting ? "..." : "Agregar"}
              </Button>
            </div>
          </div>
          {formError ? (
            <p className="text-[13px] leading-5 text-[#dc2626]">{formError}</p>
          ) : null}
          <p className="text-[12px] leading-4 text-[#777b84]">
            Las unidades se asignan después de que el cliente acepte la invitación.
          </p>
        </div>
      ) : null}

      {/* Clients list */}
      {totalCount > 0 ? (
        <div className="flex flex-col gap-4">
          <div
            className="overflow-hidden rounded-[16px] border border-[#edeef0] bg-white"
            style={{ boxShadow: "0 0 10px rgba(243, 103, 31, 0.08)" }}
          >
            {clients.map((client) => (
              <ClientRow
                key={client.userId}
                client={client}
                onRemove={() => void handleRemoveClient(client.userId)}
              />
            ))}
            {pendingInvitations.map((invitation) => (
              <PendingClientRow
                key={invitation.invitationId}
                invitation={invitation}
                onRevoke={() => void handleRevokeInvitation(invitation.invitationId)}
              />
            ))}
          </div>
          <p className="text-[12px] leading-4 text-[#777b84]">
            Mostrando {totalCount} de {totalCount} clientes
          </p>
        </div>
      ) : (
        <div
          className="rounded-[16px] border border-[#edeef0] bg-white px-4 py-12 text-center text-[14px] leading-5 text-[#777b84]"
          style={{ boxShadow: "0 0 10px rgba(243, 103, 31, 0.08)" }}
        >
          No hay clientes en este proyecto.
        </div>
      )}
    </div>
  )
}
