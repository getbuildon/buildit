"use client"

import {
  CARGAR_AVANCE_BADGE_STYLES,
  CARGAR_AVANCE_STATUS_LABELS,
  type CargarAvanceTaskStatus,
} from "@/lib/projects/cargarAvance"
import { CERTIFICACION_CHECKBOX } from "@/lib/project/certificacionesDesignTokens"
import { cn } from "@/lib/utils"

type TaskTargetUnitChipProps = {
  unitLabel: string
  status: CargarAvanceTaskStatus
  selected: boolean
  disabled?: boolean
  onToggle: () => void
}

function ChipStatusBadge({ status }: { status: CargarAvanceTaskStatus }) {
  if (status === "pending") {
    return (
      <span className="rounded-[6px] bg-[#f4f4f5] px-1.5 py-0.5 text-[10px] font-medium leading-4 text-[#696e77]">
        {CARGAR_AVANCE_STATUS_LABELS.pending}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "rounded-[6px] px-1.5 py-0.5 text-[10px] font-medium leading-4",
        CARGAR_AVANCE_BADGE_STYLES[status],
      )}
    >
      {CARGAR_AVANCE_STATUS_LABELS[status]}
    </span>
  )
}

function ChipCheckboxIndicator({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        CERTIFICACION_CHECKBOX.base,
        checked ? CERTIFICACION_CHECKBOX.checked : CERTIFICACION_CHECKBOX.unchecked,
      )}
    >
      {checked ? (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  )
}

export function TaskTargetUnitChip({
  unitLabel,
  status,
  selected,
  disabled = false,
  onToggle,
}: TaskTargetUnitChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`Aplicar cambios en unidad ${unitLabel}`}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "inline-flex w-fit max-w-full items-center gap-2 rounded-[10px] border bg-white px-2.5 py-1.5 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18191b]/10 focus-visible:ring-offset-1",
        disabled && "cursor-not-allowed opacity-60",
        !disabled && "cursor-pointer hover:border-[#d8d9db] hover:bg-[#fafafa]",
        selected && !disabled
          ? "border-[#c8cad0] bg-[#f7f8f9] shadow-[inset_0_0_0_1px_rgba(24,25,27,0.04)]"
          : "border-[#edeef0]",
      )}
    >
      <ChipCheckboxIndicator checked={selected} />
      <span className="shrink-0 text-[13px] font-medium leading-none tracking-[-0.02em] text-[#272a2d]">
        {unitLabel}
      </span>
      <span className="h-3 w-px shrink-0 bg-[#e4e5e7]" aria-hidden />
      <ChipStatusBadge status={status} />
    </button>
  )
}
