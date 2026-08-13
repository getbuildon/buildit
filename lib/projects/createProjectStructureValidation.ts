import type { CreateProjectDraft } from "@/lib/projects/createProjectDraft"

export type StructureUnitFieldErrors = {
  code?: string
  squareMeters?: string
}

export type StructureFloorFieldErrors = {
  name?: string
  identifier?: string
  unitErrors?: Record<string, StructureUnitFieldErrors>
}

export type StructureStepFieldErrors = Record<string, StructureFloorFieldErrors>

export function hasUnitSquareMetersValue(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false

  const parsed = Number(trimmed.replace(",", "."))
  return Number.isFinite(parsed) && parsed > 0
}

export function getStructureStepFieldErrors(
  draft: CreateProjectDraft,
): StructureStepFieldErrors {
  const errors: StructureStepFieldErrors = {}

  for (const floor of draft.floors) {
    const floorErrors: StructureFloorFieldErrors = {}
    const unitErrors: Record<string, StructureUnitFieldErrors> = {}

    if (!floor.name.trim()) {
      floorErrors.name = "El nombre del piso es obligatorio."
    }

    if (!floor.identifier.trim()) {
      floorErrors.identifier = "El identificador es obligatorio."
    }

    for (const unit of floor.units) {
      const unitFieldErrors: StructureUnitFieldErrors = {}

      if (!unit.code.trim()) {
        unitFieldErrors.code = "El ID es obligatorio."
      }

      if (!hasUnitSquareMetersValue(unit.squareMeters)) {
        unitFieldErrors.squareMeters = "Los metros cuadrados son obligatorios."
      }

      if (Object.keys(unitFieldErrors).length > 0) {
        unitErrors[unit.id] = unitFieldErrors
      }
    }

    if (Object.keys(unitErrors).length > 0) {
      floorErrors.unitErrors = unitErrors
    }

    if (Object.keys(floorErrors).length > 0) {
      errors[floor.id] = floorErrors
    }
  }

  return errors
}

export function hasStructureStepFieldErrors(
  errors: StructureStepFieldErrors,
): boolean {
  return Object.keys(errors).length > 0
}

export function getFirstStructureFieldErrorTarget(
  errors: StructureStepFieldErrors,
): { floorId: string; unitId?: string } | null {
  for (const [floorId, floorErrors] of Object.entries(errors)) {
    if (floorErrors.name || floorErrors.identifier) {
      return { floorId }
    }

    const firstUnitId = Object.keys(floorErrors.unitErrors ?? {})[0]
    if (firstUnitId) {
      return { floorId, unitId: firstUnitId }
    }
  }

  return null
}
