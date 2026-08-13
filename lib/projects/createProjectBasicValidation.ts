import {
  parseDraftDateString,
  type CreateProjectDraft,
} from "@/lib/projects/createProjectDraft"
import { hasTotalSurfaceValue } from "@/lib/projects/totalSurfaceInput"

export function addDaysToDraftDate(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function isEndDateAfterStartDate(startDate: string, endDate: string): boolean {
  const start = parseDraftDateString(startDate)
  const end = parseDraftDateString(endDate)
  if (!start || !end) return true
  return end > start
}

export type ConfigBasicsFieldErrors = {
  projectName?: string
  location?: string
  startDate?: string
  endDate?: string
}

export function getConfigBasicsFieldErrors(input: {
  name: string
  location: string
  startDate: string
  endDate: string
}): ConfigBasicsFieldErrors {
  const errors: ConfigBasicsFieldErrors = {}

  if (!input.name.trim()) {
    errors.projectName = "El nombre del proyecto es obligatorio."
  }

  if (!input.location.trim()) {
    errors.location = "La ubicación es obligatoria."
  }

  if (!input.startDate.trim()) {
    errors.startDate = "La fecha de inicio es obligatoria."
  }

  if (!input.endDate.trim()) {
    errors.endDate = "La fecha de finalización es obligatoria."
  } else if (
    input.startDate.trim() &&
    !isEndDateAfterStartDate(input.startDate, input.endDate)
  ) {
    errors.endDate = "La fecha de finalización debe ser posterior a la de inicio."
  }

  return errors
}

export type BasicInfoFieldErrors = {
  projectName?: string
  totalSurface?: string
  startDate?: string
  endDate?: string
}

export function getBasicInfoFieldErrors(draft: CreateProjectDraft): BasicInfoFieldErrors {
  const errors: BasicInfoFieldErrors = {}

  if (!draft.projectName.trim()) {
    errors.projectName = "El nombre del proyecto es obligatorio."
  }

  if (!hasTotalSurfaceValue(draft.totalSurface)) {
    errors.totalSurface = "La superficie total es obligatoria."
  }

  if (!draft.startDate.trim()) {
    errors.startDate = "La fecha de inicio es obligatoria."
  }

  if (!draft.endDate.trim()) {
    errors.endDate = "La fecha de finalización es obligatoria."
  } else if (
    draft.startDate.trim() &&
    !isEndDateAfterStartDate(draft.startDate, draft.endDate)
  ) {
    errors.endDate = "La fecha de finalización debe ser posterior a la de inicio."
  }

  return errors
}

export function validateBasicInfoStep(draft: CreateProjectDraft): string | null {
  const errors = getBasicInfoFieldErrors(draft)
  return (
    errors.projectName ??
    errors.totalSurface ??
    errors.startDate ??
    errors.endDate ??
    null
  )
}
