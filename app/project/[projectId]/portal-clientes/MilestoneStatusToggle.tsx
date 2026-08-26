"use client"

import { FieldErrorTooltip } from "@/components/ui/field-error-tooltip"
import {
  PORTAL_MILESTONE_STATUS_LABELS,
  PORTAL_MILESTONE_STATUS_OPTIONS,
  type PortalMilestoneStatus,
} from "@/lib/projects/portalClientesTypes"
import { cn } from "@/lib/utils"

type MilestoneStatusToggleProps = {
  value: PortalMilestoneStatus
  onChange: (value: PortalMilestoneStatus) => void
  disabled?: boolean
  errorMessage?: string | null
}

export function MilestoneStatusToggle({
  value,
  onChange,
  disabled = false,
  errorMessage = null,
}: MilestoneStatusToggleProps) {
  const hasError = Boolean(errorMessage)

  return (
    <div className="relative">
      {hasError && errorMessage ? (
        <span className="pointer-events-auto absolute -top-1 -right-1 z-10">
          <FieldErrorTooltip message={errorMessage} />
        </span>
      ) : null}
      <div
        className={cn(
          "flex h-[40px] items-center rounded-[10px] border bg-[#edeef0] p-1",
          hasError ? "border-[#eb8e90]" : "border-[#edeef0]",
        )}
        role="group"
        aria-label="Estado del hito"
        aria-invalid={hasError}
      >
        {PORTAL_MILESTONE_STATUS_OPTIONS.map((status) => {
          const active = value === status
          return (
            <button
              key={status}
              type="button"
              disabled={disabled}
              onClick={() => onChange(status)}
              className={cn(
                "flex h-full items-center justify-center rounded-[8px] px-4 text-[12px] font-medium leading-[1.4] whitespace-nowrap transition-colors",
                active
                  ? "bg-white text-[#272a2d] shadow-[0_0_2px_rgba(0,0,0,0.15)]"
                  : "text-[#696e77] hover:text-[#43484e]",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              {PORTAL_MILESTONE_STATUS_LABELS[status]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
