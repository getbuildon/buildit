"use client"

import { useEffect, useRef, useState } from "react"
import { FieldErrorTooltip } from "@/components/ui/field-error-tooltip"
import { InfoTooltip } from "@/components/ui/info-tooltip"
import {
  getRubroEffectiveWeightDisplay,
  finalizeManualRubroWeightPercent,
  isRubroWeightAuto,
  parseRubroWeightInput,
  RUBRO_INCIDENCE_TOOLTIP,
  RUBRO_WEIGHT_OVER_LIMIT_MESSAGE,
} from "@/lib/projects/rubroWeights"
import type { RubroItemDraft } from "@/lib/projects/createProjectDraft"
import { cn } from "@/lib/utils"

const WEIGHT_SHELL =
  "inline-flex shrink-0 items-stretch overflow-hidden rounded-[16px] border bg-white transition-[border-color,box-shadow]"

const WEIGHT_PERCENT_SECTION =
  "flex items-center gap-1 py-1 pl-1"

const WEIGHT_PERCENT_TEXT =
  "text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#272a2d]"

type WeightModeToggleProps = {
  value: "auto" | "manual"
  onChange?: (value: "auto" | "manual") => void
  readOnly?: boolean
}

function WeightModeToggle({ value, onChange, readOnly = false }: WeightModeToggleProps) {
  return (
    <div
      data-weight-mode-toggle
      className="flex self-stretch items-stretch bg-[rgba(237,238,240,0.7)] px-1 py-0.5"
      role={readOnly ? undefined : "radiogroup"}
      aria-label="Modo de incidencia del rubro"
    >
      {(["auto", "manual"] as const).map((mode) => {
        const selected = value === mode
        const label = mode === "auto" ? "Auto" : "Manual"

        if (readOnly) {
          return (
            <span
              key={mode}
              className={cn(
                "flex items-center justify-center px-1 py-0.5 text-[10px] leading-[1.4] tracking-[-0.5px]",
                selected
                  ? "rounded-[14px] bg-white px-1.5 text-[#111113] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                  : "rounded-[12px] text-[#777b84]",
              )}
            >
              {label}
            </span>
          )
        }

        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={selected}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onChange?.(mode)}
            className={cn(
              "flex items-center justify-center px-1 py-0.5 text-[10px] leading-[1.4] tracking-[-0.5px] transition-all",
              selected
                ? "rounded-[14px] bg-white px-1.5 text-[#111113] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                : "rounded-[12px] text-[#777b84] hover:text-[#43484e]",
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

type RubroWeightControlProps = {
  displayPercent: string
  weightAuto: boolean
  editable?: boolean
  weightPercent?: string
  onWeightPercentChange?: (value: string) => void
  onWeightAutoChange?: (auto: boolean) => void
  onModeActivate?: (mode: "auto" | "manual") => void
  hasWeightError?: boolean
  weightErrorMessage?: string
  autoFocusPercent?: boolean
  onBlur?: () => void
}

function sanitizeInlinePercent(raw: string): string {
  const normalized = raw.replace(",", ".")
  if (normalized === "") return ""

  const cleaned = normalized.replace(/[^\d.]/g, "")
  const [whole, ...rest] = cleaned.split(".")
  const digits = rest.length === 0 ? whole : `${whole}.${rest.join("").slice(0, 1)}`

  const num = Number.parseFloat(digits)
  if (Number.isFinite(num) && num > 100) return "100"

  return digits
}

function formatPercentDraft(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""

  const num = Number.parseFloat(trimmed.replace(",", "."))
  if (!Number.isFinite(num)) return ""

  const clamped = Math.min(100, Math.max(0, num))
  const rounded = Math.round(clamped * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

function manualSeedFromAutoDisplay(displayPercent: string): string {
  return formatPercentDraft(displayPercent.replace(/%/g, "").trim())
}

function focusPercentInput(input: HTMLInputElement | null) {
  if (!input) return
  input.focus()
  input.select()
}

export function RubroWeightControl({
  displayPercent,
  weightAuto,
  editable = false,
  weightPercent = "",
  onWeightPercentChange,
  onWeightAutoChange,
  onModeActivate,
  hasWeightError = false,
  weightErrorMessage = RUBRO_WEIGHT_OVER_LIMIT_MESSAGE,
  autoFocusPercent = false,
  onBlur,
}: RubroWeightControlProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPercentFocused, setIsPercentFocused] = useState(false)
  const showEditablePercent = editable && !weightAuto
  const showWeightError = hasWeightError && !weightAuto

  useEffect(() => {
    if (!autoFocusPercent || !showEditablePercent) return
    focusPercentInput(inputRef.current)
  }, [autoFocusPercent, showEditablePercent])

  const handleModeChange = (mode: "auto" | "manual") => {
    if (onModeActivate) {
      onModeActivate(mode)
      if (mode === "manual") {
        requestAnimationFrame(() => focusPercentInput(inputRef.current))
      }
      return
    }

    const nextAuto = mode === "auto"
    onWeightAutoChange?.(nextAuto)
    if (!nextAuto && !weightPercent.trim()) {
      onWeightPercentChange?.(manualSeedFromAutoDisplay(displayPercent))
    }
    if (!nextAuto) {
      requestAnimationFrame(() => focusPercentInput(inputRef.current))
    }
  }

  return (
    <div
      ref={rootRef}
      onBlur={(event) => {
        if (!editable || !onBlur) return
        const next = event.relatedTarget as Node | null
        if (next && rootRef.current?.contains(next)) return
        onBlur()
      }}
      className={cn(
        WEIGHT_SHELL,
        hasWeightError && !weightAuto
          ? "border-[#ce2c31]"
          : editable && showEditablePercent
            ? "border-[#ff7433]"
            : "border-[rgba(237,238,240,0.7)]",
      )}
      aria-label={`Incidencia del rubro: ${displayPercent}${weightAuto ? " (automático)" : ""}${showWeightError ? `. ${weightErrorMessage}` : ""}`}
    >
      <div className={WEIGHT_PERCENT_SECTION}>
        {showWeightError ? (
          <FieldErrorTooltip
            message={weightErrorMessage}
            iconClassName="size-3"
          />
        ) : (
          <InfoTooltip
            text={RUBRO_INCIDENCE_TOOLTIP}
            iconClassName="size-3 text-[#777b84]"
          />
        )}
        {showEditablePercent ? (
          <div className="flex w-[30px] shrink-0 items-center gap-px">
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              aria-label="Porcentaje de incidencia manual"
              aria-invalid={showWeightError}
              value={weightPercent}
              onFocus={() => setIsPercentFocused(true)}
              onBlur={(event) => {
                setIsPercentFocused(false)

                const formatted = finalizeManualRubroWeightPercent(weightPercent)
                if (formatted !== weightPercent) {
                  onWeightPercentChange?.(formatted)
                }

                const next = event.relatedTarget as Node | null
                if (next && rootRef.current?.contains(next)) return
                onBlur?.()
              }}
              onChange={(event) =>
                onWeightPercentChange?.(sanitizeInlinePercent(event.target.value))
              }
              className={cn(
                "min-w-[4px] flex-1 border-0 bg-transparent p-0 outline-none caret-[#ff7433]",
                isPercentFocused ? "max-w-[30px] text-center" : "max-w-[22px] text-right",
                WEIGHT_PERCENT_TEXT,
              )}
            />
            {!isPercentFocused ? (
              <span className={WEIGHT_PERCENT_TEXT}>%</span>
            ) : null}
          </div>
        ) : (
          <span className={cn("w-[30px] shrink-0", WEIGHT_PERCENT_TEXT)}>{displayPercent}</span>
        )}
        {!showEditablePercent ? (
          <span className="sr-only">{weightAuto ? "modo automático" : "modo manual"}</span>
        ) : null}
      </div>

      <WeightModeToggle
        value={weightAuto ? "auto" : "manual"}
        readOnly={!editable && !onModeActivate}
        onChange={editable || onModeActivate ? handleModeChange : undefined}
      />
    </div>
  )
}

type RubroIncidenceBadgeProps = {
  rubro: RubroItemDraft
  allRubros: RubroItemDraft[]
  hasWeightError?: boolean
  weightErrorMessage?: string
  onActivate?: (mode?: "auto" | "manual") => void
}

export function RubroIncidenceBadge({
  rubro,
  allRubros,
  hasWeightError = false,
  weightErrorMessage,
  onActivate,
}: RubroIncidenceBadgeProps) {
  const displayLabel = getRubroEffectiveWeightDisplay(rubro, allRubros)
  const isAuto = isRubroWeightAuto(rubro)

  if (onActivate) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("[data-weight-mode-toggle]")) return
          onActivate()
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onActivate()
          }
        }}
        className="cursor-pointer rounded-[16px] transition-opacity hover:opacity-90"
        aria-label={`Editar incidencia del rubro: ${displayLabel}`}
      >
        <RubroWeightControl
          displayPercent={displayLabel}
          weightAuto={isAuto}
          hasWeightError={hasWeightError}
          weightErrorMessage={weightErrorMessage}
          onModeActivate={(mode) => onActivate(mode)}
        />
      </div>
    )
  }

  return (
    <RubroWeightControl
      displayPercent={displayLabel}
      weightAuto={isAuto}
      hasWeightError={hasWeightError}
      weightErrorMessage={weightErrorMessage}
    />
  )
}

type RubroIncidenceEditorProps = {
  weightPercent: string
  weightAuto: boolean
  allRubros: RubroItemDraft[]
  rubroId: string
  onWeightPercentChange: (value: string) => void
  onWeightAutoChange: (auto: boolean) => void
  hasWeightError?: boolean
  weightErrorMessage?: string
  autoFocusPercent?: boolean
  onBlur?: () => void
}

export function RubroIncidenceEditor({
  weightPercent,
  weightAuto,
  allRubros,
  rubroId,
  onWeightPercentChange,
  onWeightAutoChange,
  hasWeightError = false,
  weightErrorMessage,
  autoFocusPercent = false,
  onBlur,
}: RubroIncidenceEditorProps) {
  const previewRubro: RubroItemDraft = {
    id: rubroId,
    name: "",
    trackingType: "Porcentaje",
    weightPercent: weightAuto ? "" : weightPercent,
    tasks: [],
  }

  const previewAllRubros = allRubros.map((rubro) =>
    rubro.id === rubroId ? previewRubro : rubro,
  )

  const displayLabel = getRubroEffectiveWeightDisplay(previewRubro, previewAllRubros)

  return (
    <div className="relative shrink-0">
      <RubroWeightControl
        displayPercent={displayLabel}
        weightAuto={weightAuto}
        editable
        weightPercent={weightPercent}
        onWeightPercentChange={onWeightPercentChange}
        onWeightAutoChange={onWeightAutoChange}
        hasWeightError={hasWeightError}
        weightErrorMessage={weightErrorMessage}
        autoFocusPercent={autoFocusPercent}
        onBlur={onBlur}
      />
    </div>
  )
}

export function validateRubroWeightDraft(
  weightAuto: boolean,
  weightPercent: string,
): string | null {
  if (weightAuto) return null

  const normalized = finalizeManualRubroWeightPercent(weightPercent)
  const parsed = parseRubroWeightInput(normalized)
  if (parsed == null) {
    return "Ingresá un porcentaje válido entre 0 y 100."
  }

  return null
}

export {
  RUBRO_STRUCTURE_BORDER,
  RUBRO_STRUCTURE_COLORS,
  RUBRO_STRUCTURE_SHADOW,
} from "@/lib/projects/rubroStructureTokens"

export const rubroRowStyles = {
  card: "overflow-hidden rounded-[10px] border bg-[#fefcfb] p-px",
  cardRest: "border-[#e2e8f0]",
  cardActive: "border-[#cad5e2] p-0 shadow-[0_0_7.5px_rgba(0,0,0,0.05)]",
  header:
    "flex h-12 w-full items-center justify-between gap-2 bg-[#fefcfb] p-3",
  headerExpanded: "rounded-t-[10px] border-b border-[#cad5e2]",
  headerCollapsed: "rounded-[10px]",
  tasksBody: "space-y-2 rounded-b-[10px] bg-white px-3 py-3",
  leftCluster: "flex h-6 min-w-0 flex-1 items-center gap-2",
  rightCluster: "flex shrink-0 items-center gap-2",
  indexBadge:
    "flex shrink-0 items-center justify-center rounded px-2 py-0.5 text-[14px] font-normal leading-[1.4] text-[#d04c00] bg-[#ffd7c2]",
  title: "min-w-0 shrink truncate text-left text-[16px] font-normal leading-[1.4] text-[#363a3f]",
  titleGroup: "flex min-w-0 flex-1 items-center gap-2 overflow-hidden",
  taskCount:
    "shrink-0 border-l border-[#afb3ba] pl-2 text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#5a6169]",
  iconButton:
    "inline-flex size-6 shrink-0 cursor-pointer items-center justify-center text-[#777b84] transition-opacity hover:opacity-80",
  deleteButton:
    "inline-flex size-6 shrink-0 cursor-pointer items-center justify-center text-[#ce2c31] transition-opacity hover:opacity-80",
} as const
