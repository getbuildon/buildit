"use client"

import { CircleAlert } from "lucide-react"

import { getUserTypeLimitDisplayLabel } from "@/lib/company/projectSubscriptionLimits"
import type { ProjectUserType } from "@/lib/projects/createProjectDraft"

type TeamSeatLimitBannerProps = {
  userType: ProjectUserType
  onUpgradeClick: () => void
}

export function TeamSeatLimitBanner({
  userType,
  onUpgradeClick,
}: TeamSeatLimitBannerProps) {
  const userTypeLabel = getUserTypeLimitDisplayLabel(userType)

  return (
    <div className="flex w-full items-start gap-4 rounded-[10px] border border-[#d5efff] bg-[#f4faff] p-[17px]">
      <CircleAlert
        className="mt-0.5 size-5 shrink-0 text-[#113264]"
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-[14px] font-medium leading-[1.4] text-[#113264]">
          Alcanzaste el límite de usuarios tipo “{userTypeLabel}”.
        </p>
        <p className="text-[14px] font-normal leading-[1.4] text-[#113264]">
          Para poder agregar más usuarios de este tipo, debés solicitar una
          mejora del plan al administrador de la organización.
        </p>
        <button
          type="button"
          onClick={onUpgradeClick}
          className="w-fit text-left text-[14px] font-medium leading-[1.4] text-[#113264] underline"
        >
          Mejorar Plan
        </button>
      </div>
    </div>
  )
}
