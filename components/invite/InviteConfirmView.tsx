"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { confirmInvitationAcceptance, type InvitationSetupData } from "@/app/invite/setup/actions"
import { projectHref } from "@/lib/project/routes"
import { Button } from "@/components/ui/button"
import { getUserInitials } from "@/lib/profile/userInitials"
import { LOGIN_COLORS, LOGIN_TYPE } from "@/lib/login/designTokens"
import { cn } from "@/lib/utils"

type InviteConfirmViewProps = {
  data: InvitationSetupData
}

export function InviteConfirmView({ data }: InviteConfirmViewProps) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const initials = getUserInitials(data.firstName, data.lastName, "")

  const invitationLead = data.organizationName ? (
    <>
      <span className="font-medium text-[#272a2d]">{data.inviterName}</span> te invitó a
      colaborar en{" "}
      <span className="font-medium text-[#272a2d]">{data.projectName}</span> de{" "}
      <span className="font-medium text-[#272a2d]">{data.organizationName}</span> como{" "}
      <span className="font-medium text-[#272a2d]">{data.userTypeLabel}</span>, con el rol de{" "}
      <span className="font-medium text-[#272a2d]">{data.roleLabel}</span>.
    </>
  ) : (
    <>
      <span className="font-medium text-[#272a2d]">{data.inviterName}</span> te invitó a
      colaborar en{" "}
      <span className="font-medium text-[#272a2d]">{data.projectName}</span> como{" "}
      <span className="font-medium text-[#272a2d]">{data.userTypeLabel}</span>, con el rol de{" "}
      <span className="font-medium text-[#272a2d]">{data.roleLabel}</span>.
    </>
  )

  const handleConfirm = async () => {
    setError("")
    setLoading(true)
    try {
      const result = await confirmInvitationAcceptance(data.invitationId, data.token)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.replace(projectHref(result.projectId))
    } catch {
      setError("No pudimos aceptar la invitación. Intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#f5f5f7]">
      <div className="pointer-events-none absolute inset-0 bg-black/40" aria-hidden />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div
          className="relative z-10 w-full max-w-[448px] rounded-[16px] bg-white px-8 py-8 shadow-[0_0_39px_4px_rgba(0,0,0,0.08)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-confirm-title"
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-[#ffeae0] text-[20px] font-semibold text-[#321a10]">
              {initials}
            </div>
            <h1
              id="invite-confirm-title"
              className="mt-4 font-recoleta text-[24px] font-normal leading-[1.05] text-[#272a2d]"
            >
              ¡Hola {data.firstName}!
            </h1>
            <p className="mt-3 text-[14px] leading-[1.5] text-[#43484e]">{invitationLead}</p>
            <p className="mt-2 text-[14px] leading-[1.4] text-[#777b84]">
              Ya tenés una cuenta. Confirmá para unirte a este proyecto.
            </p>
          </div>

          {error ? (
            <p
              className="mt-4 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            disabled={loading}
            onClick={() => void handleConfirm()}
            className={cn(
              "mt-6 h-[46px] w-full rounded-[10px] py-2.5 hover:opacity-90",
              LOGIN_TYPE.button,
            )}
            style={{ backgroundColor: LOGIN_COLORS.primary, color: "#ffffff" }}
          >
            {loading ? "Confirmando…" : "Aceptar invitación"}
          </Button>
        </div>
      </div>
    </div>
  )
}
