"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { BackButton } from "@/components/ui/BackButton"
import { formatArgentinaCalendarDate } from "@/lib/datetime/argentinaDateTime"
import { cn } from "@/lib/utils"
import { getCompanyMembers, type CompanyMember } from "./actions"

type CompanyMemberRole = CompanyMember["role"]

const ROLE_LABELS: Record<CompanyMemberRole, string> = {
  owner: "Propietario",
  admin: "Administrador",
  billing: "Facturación",
  member: "Miembro",
}

const ROLE_DESCRIPTIONS: Array<{ label: string; description: string }> = [
  {
    label: "Propietario",
    description: "Accede a todas las obras. No va al equipo ni ocupa cupo.",
  },
  {
    label: "Administrador",
    description:
      "Accede a todas las obras. No va al equipo ni ocupa cupo. Gestiona usuarios y configuración.",
  },
  {
    label: "Facturación",
    description: "Acceso a la facturación y pagos.",
  },
  {
    label: "Miembro",
    description: "Acceso de lectura a los datos de la empresa.",
  },
]

type MembersViewProps = {
  companyId: string
}

export function MembersView({ companyId }: MembersViewProps) {
  const [members, setMembers] = useState<CompanyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMembers = async () => {
      const result = await getCompanyMembers(companyId)
      if (result.ok) {
        setMembers(result.members)
      } else {
        setError(result.error)
      }
      setLoading(false)
    }
    void loadMembers()
  }, [companyId])

  if (loading) {
    return <p className="text-[14px] text-[#777b84]">Cargando...</p>
  }

  if (error) {
    return <p className="text-[14px] text-[#b91c1c]">{error}</p>
  }

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <header className="mb-6 flex flex-col gap-4">
        <BackButton href="/home" />
        <div className="flex flex-col gap-0.5">
          <h1 className="font-recoleta text-[24px] font-normal leading-[1.05] text-[#272a2d]">
            Miembros
          </h1>
          <p className="text-[14px] leading-[1.4] text-[#272a2d]">
            Usuarios de la empresa y sus roles
          </p>
        </div>
      </header>

      <div className="overflow-hidden rounded-[16px] border border-[#edeef0] bg-white shadow-[0_0_5px_rgba(243,103,31,0.08)]">
        {members.length === 0 ? (
          <div className="px-6 py-10 text-center text-[14px] text-[#777b84]">
            No hay miembros en esta empresa aún.
          </div>
        ) : (
          members.map((member, index) => {
            const isInvitation = member.user_id === null

            return (
              <div
                key={member.id}
                className={cn(
                  "flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
                  index < members.length - 1 && "border-b border-[#edeef0]",
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[14px] font-medium leading-5 text-[#1d293d]">
                      {member.email}
                    </p>
                    {isInvitation ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#fef9c3] px-2 py-0.5 text-[10px] font-medium leading-none tracking-[-0.5px] text-[#854d0e]">
                        <Clock className="size-2.5" aria-hidden />
                        Pendiente
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[12px] leading-[1.4] text-[#777b84]">
                    {isInvitation
                      ? `Invitado el ${member.joined_at ? formatArgentinaCalendarDate(member.joined_at) : "N/A"}`
                      : `Se unió el ${member.joined_at ? formatArgentinaCalendarDate(member.joined_at) : "N/A"}`}
                  </p>
                </div>

                <span className="inline-flex w-fit shrink-0 items-center rounded-[12px] bg-[#ffeae0] px-2 py-0.5 text-[10px] font-medium leading-none tracking-[-0.5px] text-[#321a10]">
                  {ROLE_LABELS[member.role]}
                </span>
              </div>
            )
          })
        )}
      </div>

      <div className="mt-6 rounded-[16px] border border-[#edeef0] bg-[#fefcfb] px-5 py-4">
        <p className="mb-3 text-[12px] font-medium tracking-[-0.24px] text-[#777b84]">
          Roles disponibles
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLE_DESCRIPTIONS.map((role) => (
            <div key={role.label}>
              <p className="text-[13px] font-medium leading-[1.4] text-[#272a2d]">{role.label}</p>
              <p className="mt-0.5 text-[12px] leading-[1.4] text-[#777b84]">{role.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
