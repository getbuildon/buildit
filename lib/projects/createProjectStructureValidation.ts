import type { CreateProjectDraft } from "@/lib/projects/createProjectDraft"
import { extractTotalSurfaceDigits } from "@/lib/projects/totalSurfaceInput"

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
  const digits = extractTotalSurfaceDigits(value)
  if (!digits) return false

  const parsed = Number(digits)
  return Number.isFinite(parsed) && parsed > 0
}

const STRUCTURE_ID_DUPLICATE_MESSAGE = "Este ID ya está en uso en el proyecto."

function normalizeStructureId(value: string): string {
  return value.trim().toUpperCase()
}

type StructureIdUsage = {
  floorId: string
  unitId?: string
}

function collectStructureIdUsages(draft: CreateProjectDraft): Map<string, StructureIdUsage[]> {
  const usages = new Map<string, StructureIdUsage[]>()

  const register = (rawValue: string, usage: StructureIdUsage) => {
    const key = normalizeStructureId(rawValue)
    if (!key) return

    const current = usages.get(key) ?? []
    current.push(usage)
    usages.set(key, current)
  }

  for (const floor of draft.floors) {
    register(floor.identifier, { floorId: floor.id })

    for (const unit of floor.units) {
      register(unit.code, { floorId: floor.id, unitId: unit.id })
    }
  }

  return usages
}

function applyDuplicateStructureIdErrors(
  draft: CreateProjectDraft,
  errors: StructureStepFieldErrors,
): void {
  for (const entries of collectStructureIdUsages(draft).values()) {
    if (entries.length <= 1) continue

    for (const entry of entries) {
      const floorErrors = errors[entry.floorId] ?? {}

      if (entry.unitId) {
        const unitErrors = floorErrors.unitErrors ?? {}
        unitErrors[entry.unitId] = {
          ...unitErrors[entry.unitId],
          code: STRUCTURE_ID_DUPLICATE_MESSAGE,
        }
        floorErrors.unitErrors = unitErrors
      } else {
        floorErrors.identifier = STRUCTURE_ID_DUPLICATE_MESSAGE
      }

      errors[entry.floorId] = floorErrors
    }
  }
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

  applyDuplicateStructureIdErrors(draft, errors)

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
    const firstUnitId = Object.keys(floorErrors.unitErrors ?? {})[0]
    if (firstUnitId) {
      return { floorId, unitId: firstUnitId }
    }

    if (floorErrors.identifier || floorErrors.name) {
      return { floorId }
    }
  }

  return null
}
