"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Building2, Plus, Trash2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FieldLabelWithTooltip,
  FLOOR_IDENTIFIER_TOOLTIP,
  UNIT_CODE_TOOLTIP,
} from "@/components/projects/new/FieldLabelWithTooltip"
import { StructureSurfaceLimitBanner } from "@/components/projects/new/StructureSurfaceLimitBanner"
import { StructureUnitAttachUpload } from "@/components/projects/new/StructureUnitAttachUpload"
import { RequestPlanUpgradeModal } from "@/components/team/RequestPlanUpgradeModal"
import { CreateProjectFormField, createProjectFieldErrorInputClassName, createProjectFieldErrorInputStyle } from "@/components/projects/new/CreateProjectFormField"
import { FieldErrorTooltip } from "@/components/ui/field-error-tooltip"
import { normalizeTotalSurfaceInput } from "@/lib/projects/totalSurfaceInput"
import {
  STRUCTURE_UNIT_TYPES,
  countStructureUnits,
  createDefaultFloor,
  createDefaultUnit,
  type CreateProjectDraft,
  type StructureFloorDraft,
  type StructureUnitDraft,
} from "@/lib/projects/createProjectDraft"
import {
  structureFloorInputClassName,
  structureFloorInputStyle,
  structureFloorLabelStyle,
  structureLabelClassName,
  structureMutedLabelStyle,
  structureUnitInputClassName,
  structureUnitInputStyle,
  structureUnitSelectItemClassName,
  structureUnitSelectTriggerClassName,
  structureUnitFieldColumnClassName,
  STRUCTURE_STEP_COLORS,
  STRUCTURE_STEP_LAYOUT,
} from "@/lib/projects/structureStepTokens"
import {
  getUnitVariantField,
  getUnitVariantFieldLabel,
  isUnitVariantFieldEnabled,
  OFFICE_SIZE_OPTIONS,
  UNIT_ROOM_COUNT_OPTIONS,
} from "@/lib/projects/unitTypes"
import type { StructureFloorFieldErrors, StructureStepFieldErrors, StructureUnitFieldErrors } from "@/lib/projects/createProjectStructureValidation"
import { getStructureSurfaceLimitState, scrollToStructureSurfaceLimitBanner } from "@/lib/projects/structureSurfaceLimits"
import { cn } from "@/lib/utils"
import {
  newItemHighlightClass,
  useNewItemHighlight,
} from "@/components/projects/new/useNewItemHighlight"

const STRUCTURE_DELETE_CONFIRM = {
  title: "Confirmar cambios",
  confirmLabel: "Confirmar",
  floorDescription:
    "Al eliminar el piso se eliminan todas las unidades y, con ellas, todas las asignaciones de tareas que tienen. ¿Deseás continuar?",
  unitDescription:
    "Al eliminar esta unidad se eliminan todas las asignaciones de tareas que tiene. ¿Deseás continuar?",
} as const

type PendingStructureDelete =
  | { kind: "floor"; floorId: string }
  | { kind: "unit"; floorId: string; unitId: string }

function stripUnitTaskExclusions(
  exclusions: CreateProjectDraft["unitTaskExclusions"],
  unitIds: string[],
): CreateProjectDraft["unitTaskExclusions"] {
  if (unitIds.length === 0) return exclusions

  const next = { ...exclusions }
  for (const unitId of unitIds) {
    delete next[unitId]
  }
  return next
}

type CreateProjectStructureStepProps = {
  draft: CreateProjectDraft
  onChange: (patch: Partial<CreateProjectDraft>) => void
  fieldErrors?: StructureStepFieldErrors
  projectId?: string | null
  planSurfaceMaxM2?: number | null
}

export function CreateProjectStructureStep({
  draft,
  onChange,
  fieldErrors = {},
  projectId = null,
  planSurfaceMaxM2 = null,
}: CreateProjectStructureStepProps) {
  const { markAsNew, isHighlighted } = useNewItemHighlight()
  const [pendingDelete, setPendingDelete] = useState<PendingStructureDelete | null>(null)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const surfaceLimitState = useMemo(
    () => getStructureSurfaceLimitState(draft.floors, planSurfaceMaxM2),
    [draft.floors, planSurfaceMaxM2],
  )
  const wasOverSurfaceLimit = useRef(false)

  useEffect(() => {
    if (surfaceLimitState.isOverLimit && !wasOverSurfaceLimit.current) {
      scrollToStructureSurfaceLimitBanner()
    }
    wasOverSurfaceLimit.current = surfaceLimitState.isOverLimit
  }, [surfaceLimitState.isOverLimit, surfaceLimitState.unitsSurfaceM2])
  const floorCount = draft.floors.length
  const unitCount = countStructureUnits(draft.floors)

  const setFloors = (floors: StructureFloorDraft[]) => {
    onChange({ floors })
  }

  const updateFloor = (
    floorId: string,
    patch: Partial<StructureFloorDraft>,
  ) => {
    setFloors(
      draft.floors.map((floor) =>
        floor.id === floorId ? { ...floor, ...patch } : floor,
      ),
    )
  }

  const addFloor = () => {
    const floor = createDefaultFloor(draft.floors.length + 1)
    setFloors([...draft.floors, floor])
    markAsNew(floor.id)
  }

  const removeFloor = (floorId: string) => {
    const floor = draft.floors.find((item) => item.id === floorId)
    const unitIds = floor?.units.map((unit) => unit.id) ?? []

    onChange({
      floors: draft.floors.filter((item) => item.id !== floorId),
      unitTaskExclusions: stripUnitTaskExclusions(draft.unitTaskExclusions, unitIds),
    })
  }

  const addUnit = (floorId: string) => {
    const unit = createDefaultUnit()
    updateFloor(floorId, {
      units: [
        ...(draft.floors.find((f) => f.id === floorId)?.units ?? []),
        unit,
      ],
    })
    markAsNew(unit.id)
  }

  const updateUnit = (
    floorId: string,
    unitId: string,
    patch: Partial<StructureUnitDraft>,
  ) => {
    const floor = draft.floors.find((f) => f.id === floorId)
    if (!floor) return
    updateFloor(floorId, {
      units: floor.units.map((unit) =>
        unit.id === unitId ? { ...unit, ...patch } : unit,
      ),
    })
  }

  const removeUnit = (floorId: string, unitId: string) => {
    onChange({
      floors: draft.floors.map((item) =>
        item.id === floorId
          ? { ...item, units: item.units.filter((unit) => unit.id !== unitId) }
          : item,
      ),
      unitTaskExclusions: stripUnitTaskExclusions(draft.unitTaskExclusions, [unitId]),
    })
  }

  const requestRemoveFloor = (floorId: string) => {
    setPendingDelete({ kind: "floor", floorId })
  }

  const requestRemoveUnit = (floorId: string, unitId: string) => {
    setPendingDelete({ kind: "unit", floorId, unitId })
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return

    if (pendingDelete.kind === "floor") {
      removeFloor(pendingDelete.floorId)
    } else {
      removeUnit(pendingDelete.floorId, pendingDelete.unitId)
    }

    setPendingDelete(null)
  }

  const pendingDeleteDescription =
    pendingDelete?.kind === "floor"
      ? STRUCTURE_DELETE_CONFIRM.floorDescription
      : pendingDelete?.kind === "unit"
        ? STRUCTURE_DELETE_CONFIRM.unitDescription
        : ""

  return (
    <div
      className="flex w-full flex-col gap-4"
      style={{ maxWidth: STRUCTURE_STEP_LAYOUT.contentMaxWidth }}
    >
      {surfaceLimitState.isOverLimit && surfaceLimitState.planSurfaceMaxM2 != null ? (
        <StructureSurfaceLimitBanner
          planSurfaceMaxM2={surfaceLimitState.planSurfaceMaxM2}
          onUpgradeClick={() => setUpgradeModalOpen(true)}
        />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-[14px] font-normal leading-5 text-[#272a2d]">
            Cantidad de pisos
          </p>
          <div className="flex flex-col gap-2">
            <p className="text-[24px] font-medium leading-[25px] text-[#18191b]">
              {floorCount} {floorCount === 1 ? "piso" : "pisos"}
            </p>
            <p className="text-[14px] font-normal leading-5 text-[#18191b]">
              Agregá o eliminá pisos según sea necesario.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="brand"
          size="brand"
          onClick={addFloor}
          className="w-full text-[14px] font-normal leading-5 sm:w-auto"
        >
          <Plus className="size-4" aria-hidden />
          Agregar piso
        </Button>
      </div>

      <div
        className="flex w-full flex-col gap-4 rounded-[10px] p-4"
        style={{ backgroundColor: STRUCTURE_STEP_COLORS.unitsSectionBg }}
      >
        <div className="flex flex-col gap-1">
          <h3 className="text-[14px] font-normal leading-5 text-[#18191b]">
            Unidades por Piso
          </h3>
          <p className="text-[12px] font-normal leading-4 text-[#43484e]">
            Configurá las unidades de cada piso:
          </p>
        </div>

        {draft.floors.length === 0 ? (
          <p className="rounded-[10px] bg-white py-6 text-center text-[12px] font-normal leading-4 text-[#afb3ba]">
            Todavía no hay pisos. Usá &quot;Agregar piso&quot; para empezar.
          </p>
        ) : (
          <div
            className="flex w-full flex-col gap-2"
            style={{ maxWidth: STRUCTURE_STEP_LAYOUT.floorCardMaxWidth }}
          >
            {draft.floors.map((floor) => (
              <StructureFloorCard
                key={floor.id}
                floor={floor}
                isHighlighted={isHighlighted(floor.id)}
                fieldErrors={fieldErrors[floor.id]}
                onUpdateFloor={(patch) => updateFloor(floor.id, patch)}
                onRemoveFloor={() => requestRemoveFloor(floor.id)}
                onAddUnit={() => addUnit(floor.id)}
                onUpdateUnit={(unitId, patch) =>
                  updateUnit(floor.id, unitId, patch)
                }
                onRemoveUnit={(unitId) => requestRemoveUnit(floor.id, unitId)}
                isUnitHighlighted={isHighlighted}
              />
            ))}
          </div>
        )}
      </div>

      <StructureProjectSummary floorCount={floorCount} unitCount={unitCount} />

      <ConfirmActionDialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={STRUCTURE_DELETE_CONFIRM.title}
        description={pendingDeleteDescription}
        confirmLabel={STRUCTURE_DELETE_CONFIRM.confirmLabel}
        onConfirm={handleConfirmDelete}
      />

      <RequestPlanUpgradeModal
        projectId={projectId}
        surfaceLimit={
          surfaceLimitState.isOverLimit && surfaceLimitState.planSurfaceMaxM2 != null
            ? {
                planSurfaceMaxM2: surfaceLimitState.planSurfaceMaxM2,
                unitsSurfaceM2: surfaceLimitState.unitsSurfaceM2,
              }
            : null
        }
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
      />
    </div>
  )
}

/** Figma 1128:5593 — resumen al pie del paso estructura. */
function StructureProjectSummary({
  floorCount,
  unitCount,
}: {
  floorCount: number
  unitCount: number
}) {
  return (
    <div
      className="w-full rounded-[10px] border p-[17px]"
      style={{
        borderColor: STRUCTURE_STEP_COLORS.summaryBorder,
        backgroundColor: STRUCTURE_STEP_COLORS.summaryBg,
      }}
    >
      <div className="flex items-start gap-3">
        <Building2
          className="mt-0.5 size-5 shrink-0"
          style={{ color: STRUCTURE_STEP_COLORS.summaryText }}
          aria-hidden
        />
        <div className="flex flex-col gap-1">
          <p
            className="text-[14px] font-normal leading-[1.4]"
            style={{ color: STRUCTURE_STEP_COLORS.summaryText }}
          >
            Resumen del Proyecto
          </p>
          <p
            className="text-[14px] font-normal leading-[1.4]"
            style={{ color: STRUCTURE_STEP_COLORS.summaryText }}
          >
            Total: {floorCount} {floorCount === 1 ? "piso" : "pisos"} • {unitCount}{" "}
            {unitCount === 1 ? "unidad" : "unidades"}
          </p>
        </div>
      </div>
    </div>
  )
}

type StructureFloorCardProps = {
  floor: StructureFloorDraft
  isHighlighted: boolean
  fieldErrors?: StructureFloorFieldErrors
  onUpdateFloor: (patch: Partial<StructureFloorDraft>) => void
  onRemoveFloor: () => void
  onAddUnit: () => void
  onUpdateUnit: (unitId: string, patch: Partial<StructureUnitDraft>) => void
  onRemoveUnit: (unitId: string) => void
  isUnitHighlighted: (unitId: string) => boolean
}

function StructureFloorCard({
  floor,
  isHighlighted,
  fieldErrors,
  onUpdateFloor,
  onRemoveFloor,
  onAddUnit,
  onUpdateUnit,
  onRemoveUnit,
  isUnitHighlighted,
}: StructureFloorCardProps) {
  const nameError = fieldErrors?.name
  const identifierError = fieldErrors?.identifier

  return (
    <div
      data-new-item-id={floor.id}
      data-structure-floor-id={floor.id}
      className={cn(
        "flex w-full flex-col rounded-[10px] border bg-white p-3",
        newItemHighlightClass(isHighlighted),
      )}
      style={{
        maxWidth: STRUCTURE_STEP_LAYOUT.floorCardMaxWidth,
        borderColor: STRUCTURE_STEP_COLORS.floorCardBorder,
        boxShadow: "0 0 7.5px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:gap-2.5"
      >
        <div className="grid grid-cols-1 gap-2.5 sm:flex sm:min-w-0 sm:flex-1 sm:items-start sm:gap-2.5">
        <CreateProjectFormField
          label="Nombre del Piso"
          htmlFor={`floor-name-${floor.id}`}
          className="min-w-0 flex-1 gap-1"
          labelClassName={structureLabelClassName}
          labelStyle={structureFloorLabelStyle}
          error={nameError}
          errorDisplay="tooltip"
        >
          <Input
            id={`floor-name-${floor.id}`}
            placeholder="Ej. Piso 1"
            value={floor.name}
            onChange={(e) => onUpdateFloor({ name: e.target.value })}
            className={structureFloorInputClassName}
            style={structureFloorInputStyle}
          />
        </CreateProjectFormField>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <FieldLabelWithTooltip
              label="Identificador"
              tooltip={FLOOR_IDENTIFIER_TOOLTIP}
              htmlFor={`floor-identifier-${floor.id}`}
              labelClassName={structureLabelClassName}
              labelStyle={structureMutedLabelStyle}
            />
            {identifierError ? <FieldErrorTooltip message={identifierError} /> : null}
          </div>
          <Input
            id={`floor-identifier-${floor.id}`}
            placeholder="Ej. PB, P01, SS."
            value={floor.identifier}
            maxLength={4}
            onChange={(e) => onUpdateFloor({ identifier: e.target.value })}
            className={cn(
              structureFloorInputClassName,
              identifierError && createProjectFieldErrorInputClassName,
            )}
            style={{
              ...structureFloorInputStyle,
              ...(identifierError ? createProjectFieldErrorInputStyle : {}),
              borderColor: identifierError
                ? createProjectFieldErrorInputStyle.borderColor
                : structureFloorInputStyle.borderColor,
            }}
            aria-invalid={Boolean(identifierError)}
          />
        </div>

        <CreateProjectFormField
          label="Nivel"
          htmlFor={`floor-level-${floor.id}`}
          className="min-w-0 flex-1 gap-1"
          labelClassName={structureLabelClassName}
          labelStyle={structureFloorLabelStyle}
          errorDisplay="tooltip"
        >
          <Input
            id={`floor-level-${floor.id}`}
            placeholder="Ej: +1.90"
            value={floor.level}
            onChange={(e) => onUpdateFloor({ level: e.target.value })}
            className={structureFloorInputClassName}
            style={structureFloorInputStyle}
          />
        </CreateProjectFormField>
        </div>

        <div className="flex shrink-0 items-center gap-4 sm:px-6">
          <button
            type="button"
            onClick={onAddUnit}
            className="inline-flex items-center gap-1 text-[12px] font-medium leading-[1.4] transition-opacity hover:opacity-80"
            style={{ color: STRUCTURE_STEP_COLORS.floorAction }}
          >
            <Plus className="size-3" aria-hidden />
            Agregar Unidad
          </button>
          <button
            type="button"
            onClick={onRemoveFloor}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center transition-opacity hover:opacity-80"
            style={{ color: STRUCTURE_STEP_COLORS.delete }}
            aria-label={`Eliminar ${floor.name}`}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>

      {floor.units.length === 0 ? (
        <p className="py-1.5 text-center text-[12px] font-normal leading-4 text-[#afb3ba]">
          No hay unidades configuradas
        </p>
      ) : (
        <div className="mt-3 flex w-full flex-col gap-2">
          {floor.units.map((unit) => (
            <StructureUnitRow
              key={unit.id}
              unit={unit}
              isHighlighted={isUnitHighlighted(unit.id)}
              fieldErrors={fieldErrors?.unitErrors?.[unit.id]}
              onUpdateUnit={(patch) => onUpdateUnit(unit.id, patch)}
              onRemoveUnit={() => onRemoveUnit(unit.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

type StructureUnitRowProps = {
  unit: StructureUnitDraft
  isHighlighted: boolean
  fieldErrors?: StructureUnitFieldErrors
  onUpdateUnit: (patch: Partial<StructureUnitDraft>) => void
  onRemoveUnit: () => void
}

function StructureUnitRow({
  unit,
  isHighlighted,
  fieldErrors,
  onUpdateUnit,
  onRemoveUnit,
}: StructureUnitRowProps) {
  const codeError = fieldErrors?.code
  const squareMetersError = fieldErrors?.squareMeters
  const variantEnabled = isUnitVariantFieldEnabled(unit.type)
  const variantLabel = getUnitVariantFieldLabel(unit.type)
  const variantField = getUnitVariantField(unit.type)
  const variantValue = variantField === "officeSize" ? unit.officeSize : unit.roomCount

  return (
    <div
      data-new-item-id={unit.id}
      data-structure-unit-id={unit.id}
      className={cn(
        "w-full rounded-[4px] px-3 pt-3 pb-3",
        newItemHighlightClass(isHighlighted),
      )}
      style={{
        backgroundColor: STRUCTURE_STEP_COLORS.unitRowBg,
        maxWidth: STRUCTURE_STEP_LAYOUT.floorCardInnerWidth,
        minHeight: STRUCTURE_STEP_LAYOUT.unitRowMinHeight,
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-end gap-2">
          <div className={cn("flex flex-col gap-1", structureUnitFieldColumnClassName.type)}>
            <span className={structureLabelClassName} style={structureMutedLabelStyle}>
              Tipo
            </span>
            <Select
              value={unit.type}
              onValueChange={(type) =>
                onUpdateUnit({
                  type: type as StructureUnitDraft["type"],
                  roomCount: type === "Departamento" ? unit.roomCount : "",
                  officeSize: type === "Oficina" ? unit.officeSize : "",
                })
              }
            >
              <SelectTrigger
                size="sm"
                aria-label="Tipo de unidad"
                className={structureUnitSelectTriggerClassName}
              >
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent position="popper">
                {STRUCTURE_UNIT_TYPES.map((type) => (
                  <SelectItem
                    key={type}
                    value={type}
                    className={structureUnitSelectItemClassName}
                  >
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={cn("flex flex-col gap-1", structureUnitFieldColumnClassName.compact)}>
            <div className="flex items-center justify-between gap-1">
              <FieldLabelWithTooltip
                label="ID"
                tooltip={UNIT_CODE_TOOLTIP}
                htmlFor={`unit-code-${unit.id}`}
                labelClassName={structureLabelClassName}
                labelStyle={structureMutedLabelStyle}
              />
              {codeError ? <FieldErrorTooltip message={codeError} /> : null}
            </div>
            <Input
              id={`unit-code-${unit.id}`}
              placeholder="Ej. 101"
              value={unit.code}
              maxLength={4}
              onChange={(e) => onUpdateUnit({ code: e.target.value })}
              className={cn(
                structureUnitInputClassName,
                codeError && createProjectFieldErrorInputClassName,
              )}
              style={{
                ...structureUnitInputStyle,
                ...(codeError ? createProjectFieldErrorInputStyle : {}),
                borderColor: codeError
                  ? createProjectFieldErrorInputStyle.borderColor
                  : structureUnitInputStyle.borderColor,
              }}
              aria-invalid={Boolean(codeError)}
            />
          </div>

          <div className={cn("flex flex-col gap-1", structureUnitFieldColumnClassName.compact)}>
            <div className="flex items-center justify-between gap-1">
              <span className={structureLabelClassName} style={structureMutedLabelStyle}>
                m²
              </span>
              {squareMetersError ? <FieldErrorTooltip message={squareMetersError} /> : null}
            </div>
            <Input
              id={`unit-m2-${unit.id}`}
              inputMode="numeric"
              placeholder="Ej. 45"
              value={unit.squareMeters}
              onChange={(e) =>
                onUpdateUnit({ squareMeters: normalizeTotalSurfaceInput(e.target.value) })
              }
              className={cn(
                structureUnitInputClassName,
                squareMetersError && createProjectFieldErrorInputClassName,
              )}
              style={{
                ...structureUnitInputStyle,
                ...(squareMetersError ? createProjectFieldErrorInputStyle : {}),
                borderColor: squareMetersError
                  ? createProjectFieldErrorInputStyle.borderColor
                  : structureUnitInputStyle.borderColor,
              }}
              aria-invalid={Boolean(squareMetersError)}
            />
          </div>

          <div className={cn("flex flex-col gap-1", structureUnitFieldColumnClassName.compact)}>
            <span className={structureLabelClassName} style={structureMutedLabelStyle}>
              {variantLabel}
            </span>
            <Select
              value={variantValue || undefined}
              onValueChange={(value) => {
                if (variantField === "officeSize") {
                  onUpdateUnit({ officeSize: value })
                  return
                }
                onUpdateUnit({ roomCount: value })
              }}
              disabled={!variantEnabled}
            >
              <SelectTrigger
                size="sm"
                aria-label={variantLabel}
                className={structureUnitSelectTriggerClassName}
              >
                <SelectValue
                  placeholder={variantField === "officeSize" ? "Tamaño" : "Cant."}
                />
              </SelectTrigger>
              <SelectContent position="popper">
                {variantField === "officeSize"
                  ? OFFICE_SIZE_OPTIONS.map((size) => (
                      <SelectItem
                        key={size}
                        value={size}
                        className={structureUnitSelectItemClassName}
                      >
                        {size}
                      </SelectItem>
                    ))
                  : UNIT_ROOM_COUNT_OPTIONS.map((count) => (
                      <SelectItem
                        key={count}
                        value={String(count)}
                        className={structureUnitSelectItemClassName}
                      >
                        {count}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>

          <div className={cn("flex flex-col gap-1", structureUnitFieldColumnClassName.attach)}>
            <span className={structureLabelClassName} style={structureMutedLabelStyle}>
              Planta
            </span>
            <StructureUnitAttachUpload
              value={unit.planImage}
              existingUrl={unit.planUrl}
              onChange={(planImage) =>
                onUpdateUnit({
                  planImage,
                  ...(planImage ? { planRemoved: false } : {}),
                })
              }
              onRemoveExisting={() =>
                onUpdateUnit({
                  planImage: null,
                  planUrl: null,
                  planRemoved: true,
                })
              }
            />
          </div>

          <div className={cn("flex flex-col gap-1", structureUnitFieldColumnClassName.attach)}>
            <span className={structureLabelClassName} style={structureMutedLabelStyle}>
              Render
            </span>
            <StructureUnitAttachUpload
              value={unit.renderImage}
              existingUrl={unit.renderUrl}
              onChange={(renderImage) =>
                onUpdateUnit({
                  renderImage,
                  ...(renderImage ? { renderRemoved: false } : {}),
                })
              }
              onRemoveExisting={() =>
                onUpdateUnit({
                  renderImage: null,
                  renderUrl: null,
                  renderRemoved: true,
                })
              }
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onRemoveUnit}
          className="inline-flex size-4 shrink-0 cursor-pointer items-center justify-center self-center text-[#ce2c31] transition-opacity hover:opacity-80"
          aria-label="Eliminar unidad"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
