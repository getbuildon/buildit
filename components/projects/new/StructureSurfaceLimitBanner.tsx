"use client"

import { CircleAlert } from "lucide-react"

import { formatSquareMeters } from "@/lib/projects/structureSurfaceLimits"

type StructureSurfaceLimitBannerProps = {
  planSurfaceMaxM2: number
  onUpgradeClick: () => void
  upgradeDisabled?: boolean
}

export function StructureSurfaceLimitBanner({
  planSurfaceMaxM2,
  onUpgradeClick,
  upgradeDisabled = false,
}: StructureSurfaceLimitBannerProps) {
  return (
    <div
      data-structure-surface-limit-banner
      className="flex w-full items-start gap-4 rounded-[10px] border border-[#d5efff] bg-[#f4faff] p-[17px]"
    >
      <CircleAlert
        className="mt-0.5 size-5 shrink-0 text-[#113264]"
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-[14px] font-medium leading-[1.4] text-[#113264]">
          Superaste la superficie permitida por tu plan ({formatSquareMeters(planSurfaceMaxM2)}).
        </p>
        <p className="text-[14px] font-normal leading-[1.4] text-[#113264]">
          Para poder agregar más metros cuadrados, debés solicitar una mejora del plan al
          administrador de la organización.
        </p>
        <button
          type="button"
          onClick={onUpgradeClick}
          disabled={upgradeDisabled}
          className="w-fit text-left text-[14px] font-medium leading-[1.4] text-[#113264] underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
        >
          Mejorar Plan
        </button>
      </div>
    </div>
  )
}
