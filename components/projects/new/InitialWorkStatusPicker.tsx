"use client"

import { Circle } from "lucide-react"
import { InProcessStatusIcon } from "@/components/icons/InProcessStatusIcon"
import {
  INITIAL_WORK_STATUS_LABELS,
  type InitialWorkTaskStatus,
} from "@/lib/projects/initialWorkStatus"
import { cn } from "@/lib/utils"

type InitialWorkStatusPickerProps = {
  value: InitialWorkTaskStatus
  onChange: (value: InitialWorkTaskStatus) => void
  size?: "sm" | "md"
  ariaLabel: string
  disabled?: boolean
}

const STATUS_ORDER: InitialWorkTaskStatus[] = ["pending", "in_progress", "completed"]

/** Figma 1872:7845 (M) / 1872:8212 (S) */
const PICKER_SPECS = {
  md: {
    gap: "gap-[2px]",
    button: "h-8 w-8 rounded-[8px] p-2",
    border: "border border-[rgba(175,179,186,0.5)]",
    icon: "size-[14px]",
    shadow: "shadow-[0_0_2px_rgba(0,0,0,0.15)]",
  },
  sm: {
    gap: "gap-[1.6px]",
    button: "h-[25.6px] w-[25.6px] rounded-[6.4px] p-[6.4px]",
    border: "border-[0.8px] border-[rgba(175,179,186,0.5)]",
    icon: "size-[11.2px]",
    shadow: "shadow-[0_0_1.6px_rgba(0,0,0,0.15)]",
  },
} as const

function CompletedStatusIcon({
  active,
  className,
}: {
  active: boolean
  className?: string
}) {
  const color = active ? "#26997b" : "#afb3ba"

  return (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <circle cx="7" cy="7" r="5.5" stroke={color} strokeWidth="1.25" />
      <path
        d="M4.6 7.05L6.15 8.6L9.45 5.3"
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StatusIcon({
  status,
  active,
  className,
}: {
  status: InitialWorkTaskStatus
  active: boolean
  className?: string
}) {
  const inactiveClassName = "text-[#afb3ba]"

  switch (status) {
    case "completed":
      return <CompletedStatusIcon active={active} className={className} />
    case "in_progress":
      return (
        <InProcessStatusIcon
          className={cn(
            className,
            active ? "text-[#e2a336]" : inactiveClassName,
          )}
        />
      )
    default:
      return (
        <Circle
          className={cn("shrink-0", className, inactiveClassName)}
          strokeWidth={1.25}
          aria-hidden
        />
      )
  }
}

function getButtonClassName(
  status: InitialWorkTaskStatus,
  active: boolean,
  size: "sm" | "md",
): string {
  const specs = PICKER_SPECS[size]

  return cn(
    "flex items-center justify-center bg-white transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    specs.button,
    specs.border,
    active && status === "completed" && "border-[#56ba9f]",
    active && status === "in_progress" && "border-[#e2a336]",
    active &&
      (status === "completed" || status === "in_progress") &&
      specs.shadow,
  )
}

export function InitialWorkStatusPicker({
  value,
  onChange,
  size = "md",
  ariaLabel,
  disabled = false,
}: InitialWorkStatusPickerProps) {
  const specs = PICKER_SPECS[size]

  return (
    <div
      className={cn("flex items-center", specs.gap, size === "md" ? "rounded-[10px]" : "rounded-[8px]")}
      role="group"
      aria-label={ariaLabel}
    >
      {STATUS_ORDER.map((status) => {
        const active = value === status

        return (
          <button
            key={status}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            aria-label={INITIAL_WORK_STATUS_LABELS[status]}
            title={INITIAL_WORK_STATUS_LABELS[status]}
            onClick={() => onChange(status)}
            className={getButtonClassName(status, active, size)}
          >
            <StatusIcon status={status} active={active} className={specs.icon} />
          </button>
        )
      })}
    </div>
  )
}

export function InitialWorkStatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] border border-[#edeef0] px-[13px] py-[13px]">
      <span className="text-[12px] font-medium leading-[1.4] text-[#363a3f]">Estados:</span>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {STATUS_ORDER.map((status) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className="flex size-3.5 items-center justify-center">
              <StatusIcon
                status={status}
                active={status !== "pending"}
                className="size-[14px]"
              />
            </span>
            <span className="text-[12px] leading-[1.4] tracking-[-0.36px] text-[#111113]">
              {INITIAL_WORK_STATUS_LABELS[status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
