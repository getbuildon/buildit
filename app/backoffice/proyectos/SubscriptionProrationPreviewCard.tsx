"use client"

import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"

import {
  previewBackofficeSubscriptionPlanChange,
  type BackofficeSubscriptionProrationPreview,
} from "@/app/backoffice/proyectos/actions"
import type { ProjectSubscriptionFormValue } from "@/app/backoffice/proyectos/ProjectSubscriptionFormFields"
import { formatProrationUsd } from "@/lib/backoffice/subscriptionProration"
import { cn } from "@/lib/utils"

type SubscriptionProrationPreviewCardProps = {
  projectId: string
  value: ProjectSubscriptionFormValue
  disabled?: boolean
}

export function SubscriptionProrationPreviewCard({
  projectId,
  value,
  disabled = false,
}: SubscriptionProrationPreviewCardProps) {
  const [preview, setPreview] = useState<BackofficeSubscriptionProrationPreview | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (disabled) {
      setPreview(null)
      return
    }

    const timeout = window.setTimeout(async () => {
      setIsLoading(true)

      try {
        const result = await previewBackofficeSubscriptionPlanChange(projectId, value)
        setPreview(result)
      } catch {
        setPreview(null)
      } finally {
        setIsLoading(false)
      }
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [projectId, value, disabled])

  if (disabled) return null

  if (isLoading && !preview) {
    return (
      <p className="text-xs leading-4 text-[#777b84]">Calculando prorrateo...</p>
    )
  }

  if (!preview || !preview.applies) {
    if (preview?.message && !preview.applies) {
      return null
    }
    return null
  }

  const proration = preview.proration

  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-3",
        preview.cycleReset
          ? "border-[#edeef0] bg-white"
          : proration?.isUpgrade
            ? "border-[#ffd6c2] bg-[#fff6f1]"
            : "border-[#dbeafe] bg-[#f0f7ff]",
      )}
    >
      <p className="text-xs font-medium leading-4 text-[#18191b]">
        {preview.cycleReset ? "Reinicio de ciclo" : "Ajuste prorrateado"}
      </p>

      {!preview.cycleReset && preview.fromPlanLabel && preview.toPlanLabel ? (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 text-xs leading-4 text-[#363a3f]">
          <span>{preview.fromPlanLabel}</span>
          <ArrowRight className="size-3 text-[#777b84]" aria-hidden />
          <span className="font-medium">{preview.toPlanLabel}</span>
        </div>
      ) : null}

      <p className="pt-2 text-xs leading-4 text-[#777b84]">{preview.message}</p>

      {proration?.canCalculate ? (
        <div className="grid grid-cols-3 gap-2 pt-3">
          <div className="rounded-lg bg-white/80 px-2 py-1.5">
            <p className="text-[10px] leading-4 text-[#777b84]">Crédito</p>
            <p className="text-xs font-medium tabular-nums text-[#363a3f]">
              {formatProrationUsd(-proration.creditUsd)}
            </p>
          </div>
          <div className="rounded-lg bg-white/80 px-2 py-1.5">
            <p className="text-[10px] leading-4 text-[#777b84]">Nuevo plan</p>
            <p className="text-xs font-medium tabular-nums text-[#363a3f]">
              {formatProrationUsd(proration.chargeUsd)}
            </p>
          </div>
          <div className="rounded-lg bg-white/80 px-2 py-1.5">
            <p className="text-[10px] leading-4 text-[#777b84]">Neto</p>
            <p
              className={cn(
                "text-xs font-semibold tabular-nums",
                proration.netAmountUsd > 0
                  ? "text-[#c2410c]"
                  : proration.netAmountUsd < 0
                    ? "text-[#208368]"
                    : "text-[#363a3f]",
              )}
            >
              {formatProrationUsd(proration.netAmountUsd)}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
