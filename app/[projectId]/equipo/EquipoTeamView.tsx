"use client"

import { useState } from "react"
import { Building2, ChevronDown, Mail, Plus, Search, ShieldCheck, SquarePen, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type TeamMember = {
  id: string
  name: string
  role: string
  subrole: string
  email: string
  department: string
  online?: boolean
  isYou?: boolean
}

const MOCK_TEAM: TeamMember[] = [
  { id: "1", name: "Carlos Mendoza", role: "Admin", subrole: "Administrador", email: "c.mendoza@alamogrupo.com", department: "Administración", online: true, isYou: true },
  { id: "2", name: "María Fernández", role: "Supervisor", subrole: "Director/a de Obra", email: "m.fernandez@alamogrupo.com", department: "Administración", online: true },
  { id: "3", name: "Diego Ramirez", role: "Operador", subrole: "Capataz", email: "d.ramirez@alamogrupo.com", department: "Obra", online: true },
  { id: "4", name: "Patricia Torres", role: "Supervisor", subrole: "Representante Técnico", email: "p.torres@alamogrupo.com", department: "Técnica" },
  { id: "5", name: "Roberto Silva", role: "Operador", subrole: "Capataz", email: "r.silva@alamogrupo.com", department: "Obra" },
  { id: "6", name: "Lucas Herrera", role: "Supervisor", subrole: "Director de Obra", email: "l.herrera@alamogrupo.com", department: "Obra", online: true },
  { id: "7", name: "Valentina Suarez", role: "Operador", subrole: "Capataz", email: "v.suarez@alamogrupo.com", department: "Obra" },
  { id: "8", name: "Martín Rojas", role: "Supervisor", subrole: "Representante Técnico", email: "m.rojas@alamogrupo.com", department: "Técnica" },
]

const PENDING_TEAM: TeamMember[] = [
  { id: "p1", name: "Alejandro Cáceres", role: "Operador", subrole: "Capataz", email: "a.caceres@alamogrupo.com", department: "Administración", online: true },
  { id: "p2", name: "Pablo Gimenez", role: "Supervisor", subrole: "Representante Técnico", email: "p.gimenez@alamogrupo.com", department: "Administración" },
]

const USER_TYPES = ["Interno", "Externo", "Cliente", "Contratista"] as const
const TEAM_ROLES = ["Administrador", "Director de Obra", "Residente de Obra", "Arquitecto", "Cliente"] as const

const PERMISSION_COLUMNS = ["Owner", "Admin", "Supervisor", "Operador", "Cliente"] as const

// true = permitido (✓), false = denegado (✕), "unidad" = permitido con alcance "Su unidad"
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

// Inputs del formulario — Figma 1284:3351: 44px, r10, borde #edeef0, texto #0a0a0a
const formInputClassName =
  "h-[44px] w-full rounded-[10px] border bg-white px-3 text-[14px] font-normal leading-5 text-[#0a0a0a] shadow-none placeholder:text-[#777b84] focus-visible:border-[#ff7433] focus-visible:ring-0"
const formInputStyle = { borderColor: "#edeef0" } as const

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
        className="h-[44px] w-full appearance-none rounded-[10px] border bg-white px-3 pr-8 text-[14px] font-normal leading-5 shadow-none outline-none focus:border-[#ff7433] focus:outline-none focus-visible:border-[#ff7433] focus-visible:outline-none focus-visible:ring-0"
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

function MemberRow({ member }: { member: TeamMember }) {
  return (
    <div className="flex items-center gap-4 border-b border-[#edeef0] px-4 py-4 transition-colors last:border-b-0 hover:bg-[#fefcfb]">
      {/* Avatar with online status */}
      <div className="relative shrink-0">
        <div className="flex size-10 items-center justify-center rounded-full bg-[#ff7433] text-[12px] font-semibold text-white">
          {getInitials(member.name)}
        </div>
        {member.online ? (
          <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[#fff6f1] bg-[#05df72]" />
        ) : null}
      </div>

      {/* Name + badges */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[14px] font-medium leading-5 text-[#1d293d]">
            {member.name}
          </h3>
          {member.isYou ? (
            <span className="inline-flex items-center rounded-full bg-[#ff7433] px-2 py-0.5 text-[10px] font-medium leading-[10px] text-[#fefcfb]">
              Tú
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center rounded-[12px] bg-[#ffeae0] px-2 py-0.5 text-[10px] font-medium leading-[10px] text-[#321a10]">
            {member.role}
          </span>
          <span className="text-[12px] leading-4 text-[#321a10]">{member.subrole}</span>
        </div>
      </div>

      {/* Email */}
      <div className="hidden w-[280px] shrink-0 items-center gap-2 text-[12px] text-[#5a6169] lg:flex">
        <Mail className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{member.email}</span>
      </div>

      {/* Department */}
      <div className="hidden w-[160px] shrink-0 items-center gap-2 text-[12px] text-[#5a6169] xl:flex">
        <Building2 className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{member.department}</span>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="text-[#777b84] transition-opacity hover:opacity-80"
          aria-label={`Editar a ${member.name}`}
        >
          <SquarePen className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className="text-[#777b84] transition-opacity hover:opacity-80"
          aria-label={`Eliminar a ${member.name}`}
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}

export function EquipoTeamView() {
  const [showForm, setShowForm] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [userType, setUserType] = useState("")
  const [role, setRole] = useState("")
  const [email, setEmail] = useState("")
  const [permisosOpen, setPermisosOpen] = useState(true)

  const totalItems = MOCK_TEAM.length

  return (
    <div
      className="flex flex-col gap-8 pt-6"
      style={{
        maxWidth: "747px",
        width: "100%",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-recoleta text-[28px] font-normal leading-tight text-[#272a2d]">
            Equipo de trabajo
          </h1>
          <p className="text-[14px] leading-5 text-[#43484e]">
            {totalItems} miembros en este proyecto
          </p>
        </div>
        <Button
          variant="brand"
          size="brand"
          onClick={() => setShowForm((v) => !v)}
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
          <h2 className="text-[20px] font-normal leading-7 text-[#272a2d]">
            Nuevo miembro
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Nombre"
              className={formInputClassName}
              style={formInputStyle}
            />
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Apellido"
              className={formInputClassName}
              style={formInputStyle}
            />
            <FormSelect
              value={userType}
              placeholder="Tipo de usuario"
              options={USER_TYPES}
              onChange={setUserType}
            />
            <FormSelect
              value={role}
              placeholder="Rol"
              options={TEAM_ROLES}
              onChange={setRole}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className={`${formInputClassName} min-w-0 flex-1`}
              style={formInputStyle}
            />
            <Button
              variant="brand"
              size="brand"
              className="shrink-0 px-6 text-[14px] font-normal leading-5"
            >
              <Plus className="size-4" aria-hidden />
              Agregar miembro
            </Button>
          </div>
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
            placeholder="Buscar miembros del equipo..."
            className="h-[42px] rounded-[12px] border-0 bg-transparent pl-11 text-[14px] text-[#18191b] shadow-none placeholder:text-[#696e77] focus-visible:ring-0"
          />
        </div>

        {/* Members list */}
        <div
          className="overflow-hidden rounded-[16px] border border-[#edeef0] bg-white"
          style={{ boxShadow: "0 0 10px rgba(243, 103, 31, 0.08)" }}
        >
          {MOCK_TEAM.map((member) => (
            <MemberRow key={member.id} member={member} />
          ))}
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] leading-4 text-[#777b84]">
            Mostrando 1–{totalItems} de 12 miembros
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="h-[29px] rounded-[10px] border border-[#afb3ba] px-3 text-[12px] font-medium leading-4 text-[#43484e] transition-colors hover:bg-[#fefcfb]"
            >
              Anterior
            </button>
            <button
              type="button"
              className="flex size-[31px] items-center justify-center rounded-[10px] bg-[#ff7433] text-[12px] font-medium leading-4 text-white"
            >
              1
            </button>
            <button
              type="button"
              className="flex size-[31px] items-center justify-center rounded-[10px] border border-[#afb3ba] text-[12px] font-medium leading-4 text-[#45556c] transition-colors hover:bg-[#fefcfb]"
            >
              2
            </button>
            <button
              type="button"
              className="h-[29px] rounded-[10px] border border-[#afb3ba] px-3 text-[12px] font-medium leading-4 text-[#43484e] transition-colors hover:bg-[#fefcfb]"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Usuarios pendientes de activación */}
      <div className="flex flex-col gap-4">
        <h2 className="text-[18px] font-normal leading-5 text-[#272a2d]">
          Usuarios pendientes de activación
        </h2>
        <div className="overflow-hidden rounded-[16px] border border-[#edeef0] bg-white">
          {PENDING_TEAM.map((member) => (
            <MemberRow key={member.id} member={member} />
          ))}
        </div>
      </div>

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
