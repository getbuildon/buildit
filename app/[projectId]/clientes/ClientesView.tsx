"use client"

import { useState } from "react"
import { Building2, Check, ChevronDown, Mail, Phone, Plus, SquarePen, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Client = {
  id: string
  name: string
  email: string
  phone: string
  units: string[]
  department: string
  online?: boolean
}

const MOCK_CLIENTS: Client[] = [
  { id: "1", name: "Ana García", email: "ana.garcia@gmail.com", phone: "+595 981 123 456", units: ["301", "802"], department: "Administración", online: true },
  { id: "2", name: "Roberto Martinez", email: "rob.martinez@gmail.com", phone: "+595 981 123 456", units: ["301", "502"], department: "Administración", online: true },
  { id: "3", name: "Laura Benitez", email: "laura_1908@gmail.com", phone: "+595 981 123 456", units: ["601", "603"], department: "Administración", online: true },
  { id: "4", name: "Javier Sosa", email: "javi_sosa88@gmail.com", phone: "+595 981 123 456", units: ["701", "802"], department: "Administración", online: true },
]

const AVAILABLE_UNITS = [
  "101", "102", "103", "104",
  "201", "202", "203", "204",
  "301", "302", "303", "304",
  "401", "402", "403", "404",
]

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

// Inputs del formulario — Figma 1427:889: 44px, r10, borde #afb3ba, placeholder #777b84
const clientInputClassName =
  "h-[44px] w-full rounded-[10px] border bg-white px-3 text-[14px] font-normal leading-5 text-[#0a0a0a] shadow-none placeholder:text-[#777b84] focus-visible:border-[#ff7433] focus-visible:ring-0"
const clientInputStyle = { borderColor: "#afb3ba" } as const

function UnitMultiSelect({
  selected,
  onToggle,
}: {
  selected: string[]
  onToggle: (unit: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-[44px] w-full items-center justify-between rounded-[10px] border bg-white px-3 text-[14px] font-normal leading-5 outline-none focus:border-[#ff7433]"
        style={{ borderColor: "#afb3ba", color: selected.length > 0 ? "#0a0a0a" : "#777b84" }}
      >
        <span className="truncate">
          {selected.length > 0 ? `${selected.length} unidad${selected.length > 1 ? "es" : ""}` : "Unidad"}
        </span>
        <ChevronDown className="size-4 shrink-0 text-[#777b84]" aria-hidden />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div
            className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-[240px] overflow-y-auto rounded-[10px] border border-[#edeef0] bg-white p-2"
            style={{ boxShadow: "0 0 10px rgba(243, 103, 31, 0.08)" }}
          >
            {AVAILABLE_UNITS.map((unit) => {
              const checked = selected.includes(unit)
              return (
                <label
                  key={unit}
                  className="flex cursor-pointer items-center gap-2 rounded-[4px] px-3 py-2 transition-colors hover:bg-[#fff6f1]"
                >
                  <span
                    className="flex size-4 shrink-0 items-center justify-center rounded-[3px] border"
                    style={{
                      borderColor: checked ? "#ff7433" : "#afb3ba",
                      backgroundColor: checked ? "#ff7433" : "transparent",
                    }}
                  >
                    {checked ? <Check className="size-3 text-white" aria-hidden /> : null}
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(unit)}
                    className="sr-only"
                  />
                  <span className="text-[14px] font-medium leading-5 text-[#314158]">
                    Unidad {unit}
                  </span>
                </label>
              )
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}

function ClientRow({ client }: { client: Client }) {
  return (
    <div className="flex items-center gap-4 border-b border-[#edeef0] px-4 py-4 transition-colors last:border-b-0 hover:bg-[#fefcfb]">
      {/* Avatar with online status */}
      <div className="relative shrink-0">
        <div className="flex size-10 items-center justify-center rounded-full bg-[#ff7433] text-[12px] font-semibold text-white">
          {getInitials(client.name)}
        </div>
        {client.online ? (
          <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[#fff6f1] bg-[#05df72]" />
        ) : null}
      </div>

      {/* Name + contact */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="truncate text-[14px] font-medium leading-5 text-[#1d293d]">
          {client.name}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-[#43484e]">
          <span className="flex items-center gap-1.5">
            <Mail className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{client.email}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Phone className="size-3 shrink-0" aria-hidden />
            {client.phone}
          </span>
        </div>
      </div>

      {/* Units */}
      <div className="hidden w-[200px] shrink-0 flex-col gap-2 lg:flex">
        <span className="text-[14px] font-medium leading-5 text-[#314158]">
          {client.units.length} unidades
        </span>
        <div className="flex flex-wrap items-center gap-1">
          {client.units.map((unit) => (
            <span
              key={unit}
              className="inline-flex items-center rounded-[8px] bg-[#ffeae0] px-[7px] py-px text-[12px] font-medium leading-4 text-[#d04c00]"
            >
              {unit}
            </span>
          ))}
        </div>
      </div>

      {/* Department */}
      <div className="hidden w-[160px] shrink-0 items-center gap-2 text-[12px] text-[#5a6169] xl:flex">
        <Building2 className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{client.department}</span>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="text-[#777b84] transition-opacity hover:opacity-80"
          aria-label={`Editar ${client.name}`}
        >
          <SquarePen className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className="text-[#777b84] transition-opacity hover:opacity-80"
          aria-label={`Eliminar ${client.name}`}
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}

export function ClientesView() {
  const [showForm, setShowForm] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [selectedUnits, setSelectedUnits] = useState<string[]>([])

  const totalClients = MOCK_CLIENTS.length

  const toggleUnit = (unit: string) => {
    setSelectedUnits((current) =>
      current.includes(unit)
        ? current.filter((u) => u !== unit)
        : [...current, unit],
    )
  }

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
            Clientes
          </h1>
          <p className="text-[14px] leading-5 text-[#43484e]">
            {totalClients} clientes en este proyecto
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
          <h2 className="text-[20px] font-normal leading-7 text-[#272a2d]">
            Nuevo cliente
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto]">
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Nombre"
              className={clientInputClassName}
              style={clientInputStyle}
            />
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Apellido"
              className={clientInputClassName}
              style={clientInputStyle}
            />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className={clientInputClassName}
              style={clientInputStyle}
            />
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+595 981 123 456"
              className={clientInputClassName}
              style={clientInputStyle}
            />
            <UnitMultiSelect selected={selectedUnits} onToggle={toggleUnit} />
            <Button
              variant="brand"
              size="brand"
              className="shrink-0 text-[14px] font-normal leading-5"
            >
              <Plus className="size-4" aria-hidden />
              Agregar
            </Button>
          </div>
        </div>
      ) : null}

      {/* Clients list */}
      <div className="flex flex-col gap-4">
        <div
          className="overflow-hidden rounded-[16px] border border-[#edeef0] bg-white"
          style={{ boxShadow: "0 0 10px rgba(243, 103, 31, 0.08)" }}
        >
          {MOCK_CLIENTS.map((client) => (
            <ClientRow key={client.id} client={client} />
          ))}
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] leading-4 text-[#777b84]">
            Mostrando {totalClients} de {totalClients} clientes
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
    </div>
  )
}
