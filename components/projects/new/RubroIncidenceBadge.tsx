"use client"

import { InfoTooltip } from "@/components/ui/info-tooltip"
import {
  getRubroEffectiveWeightDisplay,
  getRubroEffectiveWeightValue,
  isRubroWeightAuto,
  parseRubroWeightInput,
  RUBRO_INCIDENCE_TOOLTIP,
} from "@/lib/projects/rubroWeights"
import type { RubroItemDraft } from "@/lib/projects/createProjectDraft"
import { PercentInput } from "@/components/ui/percent-input"
import { cn } from "@/lib/utils"

type RubroIncidenceBadgeProps = {
  rubro: RubroItemDraft
  allRubros: RubroItemDraft[]
  hasWeightError?: boolean
}

export function RubroIncidenceBadge({
  rubro,
  allRubros,
  hasWeightError = false,
}: RubroIncidenceBadgeProps) {
  const displayLabel = getRubroEffectiveWeightDisplay(rubro, allRubros)
  const isAuto = isRubroWeightAuto(rubro)
  const isManual = !isAuto

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center gap-1 rounded border bg-white px-2 py-0.5 text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#43484e]",
        hasWeightError && isManual
          ? "border-[#ce2c31] bg-[#fff7f7]"
          : "border-[#edeef0]",
      )}
      aria-label={`Incidencia del rubro: ${displayLabel}${isAuto ? " (automático)" : ""}`}
    >
      <span>{displayLabel}</span>
      <InfoTooltip text={RUBRO_INCIDENCE_TOOLTIP} />
    </div>
  )
}

type WeightModeToggleProps = {
  value: "auto" | "manual"
  onChange: (value: "auto" | "manual") => void
}

function WeightModeToggle({ value, onChange }: WeightModeToggleProps) {
  return (
    <div
      className="inline-flex shrink-0 rounded-lg border border-[#edeef0] bg-[#f4f5f6] p-0.5"
      role="radiogroup"
      aria-label="Modo de incidencia del rubro"
    >
      {(["auto", "manual"] as const).map((mode) => {
        const selected = value === mode
        const label = mode === "auto" ? "Auto" : "Manual"

        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(mode)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[12px] font-normal leading-4 transition-all",
              selected
                ? "bg-white text-[#363a3f] shadow-sm"
                : "text-[#777b84] hover:text-[#43484e]",
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
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
}

export function RubroIncidenceEditor({
  weightPercent,
  weightAuto,
  allRubros,
  rubroId,
  onWeightPercentChange,
  onWeightAutoChange,
  hasWeightError = false,
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

  const effectiveValue = getRubroEffectiveWeightValue(previewRubro, previewAllRubros)

  return (
    <div className="relative shrink-0">
      <div className="flex items-center gap-2">
        <WeightModeToggle
          value={weightAuto ? "auto" : "manual"}
          onChange={(mode) => {
            const nextAuto = mode === "auto"
            onWeightAutoChange(nextAuto)
            if (!nextAuto && !weightPercent.trim()) {
              onWeightPercentChange("10")
            }
          }}
        />

        <PercentInput
          value={weightAuto ? effectiveValue : weightPercent}
          onChange={onWeightPercentChange}
          disabled={weightAuto}
          invalid={hasWeightError && !weightAuto}
          aria-label={
            weightAuto
              ? "Porcentaje de incidencia automático"
              : "Porcentaje de incidencia manual"
          }
        />
      </div>

      {hasWeightError && !weightAuto ? (
        <p className="pointer-events-none absolute left-0 top-full z-10 mt-1 whitespace-nowrap text-[11px] leading-4 text-[#ce2c31]">
          La suma de porcentajes manuales supera el 100%.
        </p>
      ) : null}
    </div>
  )
}

export function validateRubroWeightDraft(
  weightAuto: boolean,
  weightPercent: string,
): string | null {
  if (weightAuto) return null

  const parsed = parseRubroWeightInput(weightPercent)
  if (parsed == null) {
    return "Ingresá un porcentaje válido mayor a 0."
  }

  return null
}
