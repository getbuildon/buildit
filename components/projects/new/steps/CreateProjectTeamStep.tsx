"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, UserPlus, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserAvatar } from "@/components/user/UserAvatar"
import { getCompanyProjectMembers } from "@/app/projects/new/actions"
import {
  createTeamMemberDraft,
  getTeamRoleDisplay,
  teamMemberFullName,
  PROJECT_USER_TYPES,
  USER_TYPE_ROLES,
  type AvailableTeamMember,
  type CreateProjectDraft,
  type ProjectTeamRole,
  type ProjectUserType,
  type TeamMemberDraft,
} from "@/lib/projects/createProjectDraft"

type CreateProjectTeamStepProps = {
  draft: CreateProjectDraft
  onChange: (patch: Partial<CreateProjectDraft>) => void
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Inputs de esta etapa — Figma 1157:2323: 44px, r10, borde #edeef0, texto #0a0a0a
const teamInputClassName =
  "h-[44px] w-full rounded-[10px] border bg-white px-3 text-[14px] font-normal leading-5 text-[#0a0a0a] shadow-none placeholder:text-[#777b84] focus-visible:border-[#ff7433] focus-visible:ring-0"
const teamInputStyle = { borderColor: "#edeef0" } as const

const teamSelectTriggerClassName =
  "h-[44px] rounded-[10px] border-[#e2e8f0] bg-white text-[14px] font-normal leading-5 text-[#0a0a0a] shadow-none focus:border-[#ff7433] focus:ring-0 data-[placeholder]:text-[#777b84]"

function TeamSelect({
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
      <SelectTrigger id={id} aria-label={placeholder} className={teamSelectTriggerClassName}>
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

export function CreateProjectTeamStep({
  draft,
  onChange,
}: CreateProjectTeamStepProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [userType, setUserType] = useState<ProjectUserType | "">("")
  const [role, setRole] = useState<ProjectTeamRole | "">("")
  const [email, setEmail] = useState("")
  const [formError, setFormError] = useState("")
  const [companyMembers, setCompanyMembers] = useState<AvailableTeamMember[]>([])

  useEffect(() => {
    if (!draft.companyId) return
    void getCompanyProjectMembers(draft.companyId).then(setCompanyMembers)
  }, [draft.companyId])

  const setTeamMembers = (teamMembers: TeamMemberDraft[]) => {
    onChange({ teamMembers })
  }

  const assignedEmails = new Set(
    draft.teamMembers.map((member) => member.email.toLowerCase()),
  )

  const addMember = () => {
    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedFirst) {
      setFormError("Ingresá el nombre.")
      return
    }
    if (!trimmedLast) {
      setFormError("Ingresá el apellido.")
      return
    }
    if (!userType) {
      setFormError("Seleccioná el tipo de usuario.")
      return
    }
    if (!role) {
      setFormError("Seleccioná el rol.")
      return
    }
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      setFormError("Ingresá un correo electrónico válido.")
      return
    }
    if (assignedEmails.has(trimmedEmail)) {
      setFormError("Ese correo ya está en el equipo.")
      return
    }

    setTeamMembers([
      ...draft.teamMembers,
      createTeamMemberDraft(trimmedFirst, trimmedLast, trimmedEmail, userType, role),
    ])
    setFirstName("")
    setLastName("")
    setEmail("")
    setUserType("")
    setRole("")
    setFormError("")
  }

  const addAvailableMember = (memberId: string) => {
    const member = companyMembers.find((m) => m.id === memberId)
    if (!member || assignedEmails.has(member.email.toLowerCase())) return
    setTeamMembers([
      ...draft.teamMembers,
      createTeamMemberDraft(
        member.firstName,
        member.lastName,
        member.email,
        member.userType,
        member.role,
        member.avatarUrl,
      ),
    ])
  }

  const removeMember = (memberId: string) => {
    setTeamMembers(draft.teamMembers.filter((member) => member.id !== memberId))
  }

  const availableToAdd = companyMembers.filter(
    (member) => !assignedEmails.has(member.email.toLowerCase()),
  )

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[14px] leading-5" style={{ color: "#18191b" }}>
        Agrega los miembros del equipo que trabajarán en esta obra
      </p>

      {/* Nuevos miembros */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h4 className="text-[14px] font-medium leading-5" style={{ color: "#43484e" }}>
            Nuevos miembros
          </h4>
          <p className="text-[14px] font-normal leading-5" style={{ color: "#43484e" }}>
            Para usuarios que no están en otros proyectos.
          </p>
        </div>

        <div
          className="flex flex-col gap-3 rounded-[10px] border p-4"
          style={{ backgroundColor: "#fefcfb", borderColor: "#fff6f1" }}
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              id="member-first-name"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value)
                if (formError) setFormError("")
              }}
              placeholder="Nombre"
              className={teamInputClassName}
              style={teamInputStyle}
            />
            <Input
              id="member-last-name"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value)
                if (formError) setFormError("")
              }}
              placeholder="Apellido"
              className={teamInputClassName}
              style={teamInputStyle}
            />
            <TeamSelect
              id="member-user-type"
              value={userType}
              placeholder="Tipo de usuario"
              options={PROJECT_USER_TYPES}
              onChange={(value) => {
                setUserType(value as ProjectUserType)
                setRole("")
                if (formError) setFormError("")
              }}
            />
            <TeamSelect
              id="member-role"
              value={role}
              placeholder="Rol"
              options={userType ? USER_TYPE_ROLES[userType] : []}
              disabled={!userType}
              onChange={(value) => {
                setRole(value as ProjectTeamRole)
                if (formError) setFormError("")
              }}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              id="member-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (formError) setFormError("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addMember()
                }
              }}
              placeholder="correo@ejemplo.com"
              className={`${teamInputClassName} min-w-0 flex-1`}
              style={teamInputStyle}
            />
            <Button
              type="button"
              variant="brand"
              size="brand"
              onClick={addMember}
              className="shrink-0 text-[14px] font-normal leading-5"
            >
              <Plus className="size-4" aria-hidden />
              Agregar Miembro
            </Button>
          </div>

          {formError ? (
            <p className="text-[13px] leading-5 text-[#dc2626]">{formError}</p>
          ) : null}
        </div>
      </section>

      {/* Equipo Disponible */}
      {availableToAdd.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h4 className="text-[14px] font-medium leading-5" style={{ color: "#43484e" }}>
              Equipo Disponible
            </h4>
            <p className="text-[14px] font-normal leading-5" style={{ color: "#43484e" }}>
              Usuarios que ya están en otros proyectos de la empresa.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {availableToAdd.map((member) => (
              <div
                key={member.id}
                className="flex flex-col gap-2 rounded-[10px] border bg-white p-3"
                style={{
                  borderColor: "#edeef0",
                  boxShadow: "0 0 10px rgba(243, 103, 31, 0.08)",
                }}
              >
                <div className="flex items-center gap-2">
                  <UserAvatar
                    firstName={member.firstName}
                    lastName={member.lastName}
                    email={member.email}
                    avatarUrl={member.avatarUrl}
                    size="sm"
                    bgClassName="bg-[#ffeae0]"
                    textClassName="text-[12px] font-semibold text-[#f3671f]"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-[12px] font-medium leading-4"
                      style={{ color: "#1d293d" }}
                    >
                      {member.firstName} {member.lastName}
                    </p>
                    <p
                      className="truncate text-[12px] font-normal leading-4"
                      style={{ color: "#696e77" }}
                    >
                      {member.roleTitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => addAvailableMember(member.id)}
                  className="flex items-center justify-center gap-1 rounded-[4px] py-1 text-[12px] font-medium leading-4 transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "#ffeae0", color: "#f3671f" }}
                  aria-label={`Agregar ${member.firstName} ${member.lastName}`}
                >
                  <UserPlus className="size-3.5" aria-hidden />
                  Agregar
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Equipo asignado — Figma 1127:4524 */}
      <section className="flex flex-col gap-3">
        <h4 className="text-[14px] font-medium leading-[1.4]" style={{ color: "#43484e" }}>
          Equipo asignado a este proyecto:
        </h4>

        {draft.teamMembers.length === 0 ? (
          <div
            className="flex h-[136px] flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed bg-[#fefcfb]"
            style={{ borderColor: "#edeef0" }}
          >
            <Users className="size-10 shrink-0 text-[#777b84]" strokeWidth={1.5} aria-hidden />
            <p className="text-[14px] font-normal leading-[1.4] text-[#777b84]">
              No hay miembros asignados aún
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {draft.teamMembers.map((member) => {
              const roleDisplay = getTeamRoleDisplay(member.role)
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-4 rounded-[10px] border px-3 py-3"
                  style={{ borderColor: "#ffeae0", backgroundColor: "#fff6f1" }}
                >
                  <UserAvatar
                    firstName={member.firstName}
                    lastName={member.lastName}
                    email={member.email}
                    avatarUrl={member.avatarUrl}
                  />

                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-[14px] font-medium leading-5"
                      style={{ color: "#1d293d" }}
                    >
                      {teamMemberFullName(member)}
                    </p>
                    <p
                      className="mt-0.5 truncate text-[12px] font-normal leading-4"
                      style={{ color: "#43484e" }}
                    >
                      {member.email}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className="rounded-[12px] px-2 py-0.5 text-[10px] font-medium leading-[10px]"
                        style={{ backgroundColor: "#ffc9ae", color: "#321a10" }}
                      >
                        {roleDisplay.badge}
                      </span>
                      <span
                        className="text-[12px] font-normal leading-4"
                        style={{ color: "#321a10" }}
                      >
                        {roleDisplay.description}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    className="inline-flex size-6 shrink-0 items-center justify-center text-[#ce2c31] transition-opacity hover:opacity-80"
                    aria-label={`Eliminar ${teamMemberFullName(member)}`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
