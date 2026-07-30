import type { RubroGroupDraft, RubroItemDraft } from "@/lib/projects/createProjectDraft"

export type RubroWeightInput = {
  id: string
  weightPercent: number | null
}

/** Parsea el valor del draft: vacío o inválido = automático (null). */
export function parseRubroWeightInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const num = Number.parseFloat(trimmed.replace(",", "."))
  if (!Number.isFinite(num) || num <= 0) return null

  return Math.min(100, Math.round(num * 100) / 100)
}

/** Suma de pesos manuales de todos los rubros. */
export function getManualRubroWeightTotal(allRubros: RubroItemDraft[]): number {
  return allRubros.reduce((sum, rubro) => {
    const weight = parseRubroWeightInput(rubro.weightPercent)
    return weight != null ? sum + weight : sum
  }, 0)
}

export function isManualRubroWeightOverLimit(allRubros: RubroItemDraft[]): boolean {
  return getManualRubroWeightTotal(allRubros) > 100
}

/** Resuelve el peso efectivo de cada rubro (manual o automático). */
export function resolveRubroEffectiveWeights(
  rubros: RubroWeightInput[],
): Map<string, number> {
  const result = new Map<string, number>()

  if (rubros.length === 0) return result

  let manualTotal = 0
  const autoRubroIds: string[] = []

  for (const rubro of rubros) {
    if (rubro.weightPercent != null && rubro.weightPercent > 0) {
      result.set(rubro.id, rubro.weightPercent)
      manualTotal += rubro.weightPercent
    } else {
      autoRubroIds.push(rubro.id)
    }
  }

  const remaining = Math.max(0, 100 - manualTotal)
  const autoShare =
    autoRubroIds.length > 0 ? remaining / autoRubroIds.length : 0

  for (const rubroId of autoRubroIds) {
    result.set(rubroId, autoShare)
  }

  return result
}

export function getAllRubrosFromGroups(groups: RubroGroupDraft[]): RubroItemDraft[] {
  return groups.flatMap((group) => group.rubros)
}

export function rubroDraftToWeightInput(rubro: RubroItemDraft): RubroWeightInput {
  return {
    id: rubro.id,
    weightPercent: parseRubroWeightInput(rubro.weightPercent),
  }
}

export function formatRubroWeightDisplay(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`
}

export function getRubroEffectiveWeightValue(
  rubro: RubroItemDraft,
  allRubros: RubroItemDraft[],
): string {
  const weights = resolveRubroEffectiveWeights(allRubros.map(rubroDraftToWeightInput))
  const effective = weights.get(rubro.id) ?? 0
  const rounded = Math.round(effective * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export function getRubroEffectiveWeightDisplay(
  rubro: RubroItemDraft,
  allRubros: RubroItemDraft[],
): string {
  const weights = resolveRubroEffectiveWeights(allRubros.map(rubroDraftToWeightInput))
  const effective = weights.get(rubro.id) ?? 0
  return formatRubroWeightDisplay(effective)
}

export function isRubroWeightAuto(rubro: RubroItemDraft): boolean {
  return parseRubroWeightInput(rubro.weightPercent) == null
}

export const RUBRO_INCIDENCE_TOOLTIP =
  "Porcentaje de incidencia del rubro en el avance total de obra."

export const RUBRO_WEIGHT_OVER_LIMIT_MESSAGE =
  "La suma de los porcentajes manuales supera el 100%. Ajustá los valores para que el total no exceda el 100%."
