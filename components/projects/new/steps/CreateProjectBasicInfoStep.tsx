"use client"

import { useEffect, useMemo, useRef } from "react"
import { MapPin } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { CreateProjectImageUpload } from "@/components/projects/new/CreateProjectImageUpload"
import { PlanSurfaceLimitNotice } from "@/components/projects/new/PlanSurfaceLimitNotice"
import {
  CreateProjectFormField,
  createProjectDatePickerClassName,
  createProjectFieldErrorInputClassName,
  createProjectFieldErrorInputStyle,
  createProjectInputClassName,
  createProjectInputStyle,
} from "@/components/projects/new/CreateProjectFormField"
import type { BasicInfoFieldErrors } from "@/lib/projects/createProjectBasicValidation"
import { addDaysToDraftDate } from "@/lib/projects/createProjectBasicValidation"
import {
  formatDraftDateString,
  parseDraftDateString,
  type CreateProjectDraft,
} from "@/lib/projects/createProjectDraft"
import type { ProjectCoverImageDraft } from "@/lib/projects/projectCoverPhoto.client"
import {
  isTotalSurfaceOverPlanLimit,
  parseTotalSurfaceM2,
  scrollToStructureSurfaceLimitBanner,
} from "@/lib/projects/structureSurfaceLimits"
import { normalizeTotalSurfaceInput } from "@/lib/projects/totalSurfaceInput"
import { getUserCompanies } from "@/lib/company/getCompanies"
import { cn } from "@/lib/utils"

type Props = {
  draft: CreateProjectDraft
  onChange: (patch: Partial<CreateProjectDraft>) => void
  coverImage: ProjectCoverImageDraft | null
  onCoverImageChange: (value: ProjectCoverImageDraft | null) => void
  existingCoverUrl?: string | null
  onExistingCoverRemove?: () => void
  fieldErrors?: BasicInfoFieldErrors
  projectId?: string | null
  planSurfaceMaxM2?: number | null
}

export function CreateProjectBasicInfoStep({
  draft,
  onChange,
  coverImage,
  onCoverImageChange,
  existingCoverUrl = null,
  onExistingCoverRemove,
  fieldErrors = {},
  projectId = null,
  planSurfaceMaxM2 = null,
}: Props) {
  useEffect(() => {
    let cancelled = false

    void getUserCompanies().then((data) => {
      if (cancelled || data.length === 0 || draft.companyId) return
      onChange({ companyId: data[0].id, companyName: data[0].name })
    })

    return () => {
      cancelled = true
    }
  }, [draft.companyId, onChange])

  const startDate = parseDraftDateString(draft.startDate)
  const endDate = parseDraftDateString(draft.endDate)
  const minEndDate = startDate ? addDaysToDraftDate(startDate, 1) : undefined
  const maxStartDate = endDate ? addDaysToDraftDate(endDate, -1) : undefined
  const totalSurfaceOverPlan = useMemo(
    () => isTotalSurfaceOverPlanLimit(draft.totalSurface, planSurfaceMaxM2),
    [draft.totalSurface, planSurfaceMaxM2],
  )
  const wasOverPlanLimit = useRef(false)

  useEffect(() => {
    if (totalSurfaceOverPlan && !wasOverPlanLimit.current) {
      scrollToStructureSurfaceLimitBanner()
    }
    wasOverPlanLimit.current = totalSurfaceOverPlan
  }, [totalSurfaceOverPlan])

  return (
    <div className="flex flex-col gap-4">
      {totalSurfaceOverPlan && planSurfaceMaxM2 != null ? (
        <PlanSurfaceLimitNotice
          planSurfaceMaxM2={planSurfaceMaxM2}
          projectId={projectId}
          reportedSurfaceM2={parseTotalSurfaceM2(draft.totalSurface) ?? 0}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <CreateProjectFormField
          label="Nombre del proyecto"
          htmlFor="project-name"
          error={fieldErrors.projectName}
        >
          <Input
            id="project-name"
            name="project-name"
            placeholder="Ej: Edificio Las Palmas"
            value={draft.projectName}
            onChange={(e) => onChange({ projectName: e.target.value })}
            className={createProjectInputClassName}
            style={createProjectInputStyle}
            aria-invalid={Boolean(fieldErrors.projectName)}
          />
        </CreateProjectFormField>

        <CreateProjectFormField
          label="Superficie total (m²)"
          htmlFor="project-total-surface"
          error={fieldErrors.totalSurface}
        >
          <Input
            id="project-total-surface"
            name="project-total-surface"
            inputMode="numeric"
            placeholder="Ej: 2.000"
            value={draft.totalSurface}
            onChange={(e) => onChange({ totalSurface: normalizeTotalSurfaceInput(e.target.value) })}
            className={cn(
              createProjectInputClassName,
              totalSurfaceOverPlan && createProjectFieldErrorInputClassName,
            )}
            style={{
              ...createProjectInputStyle,
              ...(totalSurfaceOverPlan ? createProjectFieldErrorInputStyle : {}),
            }}
            aria-invalid={Boolean(fieldErrors.totalSurface || totalSurfaceOverPlan)}
          />
        </CreateProjectFormField>
      </div>

      <CreateProjectFormField label="Ubicación" htmlFor="project-location">
        <div className="relative">
          <MapPin
            className="pointer-events-none absolute top-[13px] left-3 size-4 text-[#777b84]"
            aria-hidden
          />
          <Input
            id="project-location"
            name="project-location"
            placeholder="Dirección completa"
            value={draft.location}
            onChange={(e) => onChange({ location: e.target.value })}
            className={cn(createProjectInputClassName, "pl-10")}
            style={createProjectInputStyle}
          />
        </div>
      </CreateProjectFormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <CreateProjectFormField label="Fecha de Inicio" htmlFor="project-start">
          <DatePicker
            id="project-start"
            value={startDate}
            onChange={(date) => onChange({ startDate: formatDraftDateString(date) })}
            toDate={maxStartDate}
            placeholder="Seleccionar fecha"
            className={createProjectDatePickerClassName}
          />
        </CreateProjectFormField>

        <CreateProjectFormField
          label="Fecha de finalización estimada"
          htmlFor="project-end"
          error={fieldErrors.endDate}
        >
          <DatePicker
            id="project-end"
            value={endDate}
            onChange={(date) => onChange({ endDate: formatDraftDateString(date) })}
            fromDate={minEndDate}
            placeholder="Seleccionar fecha"
            className={createProjectDatePickerClassName}
          />
        </CreateProjectFormField>
      </div>

      <CreateProjectImageUpload
        value={coverImage}
        onChange={onCoverImageChange}
        existingCoverUrl={existingCoverUrl}
        onExistingCoverRemove={onExistingCoverRemove}
      />
    </div>
  )
}
