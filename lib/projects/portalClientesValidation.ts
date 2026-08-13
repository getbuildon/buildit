import {
  PORTAL_MILESTONE_STATUS_OPTIONS,
  type PortalMilestoneSaveInput,
  type PortalMilestoneStatus,
  type PortalNewsSaveInput,
} from "@/lib/projects/portalClientesTypes"

export type PortalNewsFieldErrors = {
  title?: string
  description?: string
  image?: string
}

export type PortalMilestoneFieldErrors = {
  name?: string
  estimatedDate?: string
  status?: string
}

export type PortalClientesValidationResult =
  | {
      ok: true
      newsErrors: Record<string, PortalNewsFieldErrors>
      milestoneErrors: Record<string, PortalMilestoneFieldErrors>
    }
  | {
      ok: false
      error: string
      newsErrors: Record<string, PortalNewsFieldErrors>
      milestoneErrors: Record<string, PortalMilestoneFieldErrors>
    }

type ValidateNewsOptions = {
  hasImageDraft?: boolean
  clearedImage?: boolean
}

export function validatePortalNewsItem(
  item: Pick<PortalNewsSaveInput, "title" | "description" | "imageUrl">,
  _index: number,
  options: ValidateNewsOptions = {},
): PortalNewsFieldErrors {
  const errors: PortalNewsFieldErrors = {}

  if (!item.title.trim()) {
    errors.title = "El título es obligatorio."
  }

  if (!item.description.trim()) {
    errors.description = "La descripción es obligatoria."
  }

  const hasImage =
    options.hasImageDraft ||
    (!options.clearedImage && Boolean(item.imageUrl?.trim()))

  if (!hasImage) {
    errors.image = "La imagen es obligatoria."
  }

  return errors
}

export function validatePortalMilestoneItem(
  item: Pick<PortalMilestoneSaveInput, "name" | "estimatedDate" | "status">,
  _index: number,
): PortalMilestoneFieldErrors {
  const errors: PortalMilestoneFieldErrors = {}

  if (!item.name.trim()) {
    errors.name = "El nombre es obligatorio."
  }

  if (!item.estimatedDate?.trim()) {
    errors.estimatedDate = "La fecha estimada es obligatoria."
  }

  if (
    !item.status ||
    !PORTAL_MILESTONE_STATUS_OPTIONS.includes(item.status as PortalMilestoneStatus)
  ) {
    errors.status = "Seleccioná un estado."
  }

  return errors
}

function hasFieldErrors<T extends object>(errors: T): boolean {
  return Object.values(errors).some(Boolean)
}

function countFieldErrorMessages(
  newsErrors: Record<string, PortalNewsFieldErrors>,
  milestoneErrors: Record<string, PortalMilestoneFieldErrors>,
): number {
  let count = 0

  for (const entry of Object.values(newsErrors)) {
    if (entry.title) count += 1
    if (entry.description) count += 1
    if (entry.image) count += 1
  }

  for (const entry of Object.values(milestoneErrors)) {
    if (entry.name) count += 1
    if (entry.estimatedDate) count += 1
    if (entry.status) count += 1
  }

  return count
}

export function formatPortalValidationSaveError(errorCount: number): string {
  if (errorCount === 1) {
    return "1 error no permite guardar."
  }

  return `${errorCount} errores no permiten guardar.`
}

export function validatePortalClientesContent(
  news: PortalNewsSaveInput[],
  milestones: PortalMilestoneSaveInput[],
  newsImageState: Record<string, ValidateNewsOptions> = {},
): PortalClientesValidationResult {
  const newsErrors: Record<string, PortalNewsFieldErrors> = {}
  const milestoneErrors: Record<string, PortalMilestoneFieldErrors> = {}

  news.forEach((item, index) => {
    const itemErrors = validatePortalNewsItem(item, index, newsImageState[item.id] ?? {})
    if (hasFieldErrors(itemErrors)) {
      newsErrors[item.id] = itemErrors
    }
  })

  milestones.forEach((item, index) => {
    const itemErrors = validatePortalMilestoneItem(item, index)
    if (hasFieldErrors(itemErrors)) {
      milestoneErrors[item.id] = itemErrors
    }
  })

  if (!hasFieldErrors(newsErrors) && !hasFieldErrors(milestoneErrors)) {
    return { ok: true, newsErrors, milestoneErrors }
  }

  const errorCount = countFieldErrorMessages(newsErrors, milestoneErrors)

  return {
    ok: false,
    error: formatPortalValidationSaveError(errorCount),
    newsErrors,
    milestoneErrors,
  }
}
