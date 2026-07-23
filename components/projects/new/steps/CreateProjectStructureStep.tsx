"use client"

import { Building2, Plus, Trash2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
import { StructureUnitAttachUpload } from "@/components/projects/new/StructureUnitAttachUpload"
import { CreateProjectFormField } from "@/components/projects/new/CreateProjectFormField"
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
import { cn } from "@/lib/utils"

type CreateProjectStructureStepProps = {
  draft: CreateProjectDraft
  onChange: (patch: Partial<CreateProjectDraft>) => void
}

export function CreateProjectStructureStep({
  draft,
  onChange,
}: CreateProjectStructureStepProps) {
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
    setFloors([...draft.floors, createDefaultFloor(draft.floors.length + 1)])
  }

  const removeFloor = (floorId: string) => {
    setFloors(draft.floors.filter((floor) => floor.id !== floorId))
  }

  const addUnit = (floorId: string) => {
    updateFloor(floorId, {
      units: [
        ...(draft.floors.find((f) => f.id === floorId)?.units ?? []),
        createDefaultUnit(),
      ],
    })
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
    const floor = draft.floors.find((f) => f.id === floorId)
    if (!floor) return
    updateFloor(floorId, {
      units: floor.units.filter((unit) => unit.id !== unitId),
    })
  }

  return (
    <div
      className="flex w-full flex-col gap-4"
      style={{ maxWidth: STRUCTURE_STEP_LAYOUT.contentMaxWidth }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
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
          className="text-[14px] font-normal leading-5"
        >
          <Plus className="size-4" aria-hidden />
          Agregar piso
        </Button>
      </div>

      <div
        className="flex w-full flex-col gap-4 rounded-[10px] p-4"
        style={{ backgroundColor: STRUCTURE_STEP_COLORS.unitRowBg }}
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
                onUpdateFloor={(patch) => updateFloor(floor.id, patch)}
                onRemoveFloor={() => removeFloor(floor.id)}
                onAddUnit={() => addUnit(floor.id)}
                onUpdateUnit={(unitId, patch) =>
                  updateUnit(floor.id, unitId, patch)
                }
                onRemoveUnit={(unitId) => removeUnit(floor.id, unitId)}
              />
            ))}
          </div>
        )}
      </div>

      <StructureProjectSummary floorCount={floorCount} unitCount={unitCount} />
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
  onUpdateFloor: (patch: Partial<StructureFloorDraft>) => void
  onRemoveFloor: () => void
  onAddUnit: () => void
  onUpdateUnit: (unitId: string, patch: Partial<StructureUnitDraft>) => void
  onRemoveUnit: (unitId: string) => void
}

function StructureFloorCard({
  floor,
  onUpdateFloor,
  onRemoveFloor,
  onAddUnit,
  onUpdateUnit,
  onRemoveUnit,
}: StructureFloorCardProps) {
  return (
    <div
      className="flex w-full flex-col gap-3 rounded-[10px] bg-white p-3"
      style={{
        maxWidth: STRUCTURE_STEP_LAYOUT.floorCardMaxWidth,
        boxShadow: "0 0 7.5px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        className="flex w-full items-center gap-2.5"
        style={{ maxWidth: STRUCTURE_STEP_LAYOUT.floorCardInnerWidth }}
      >
        <CreateProjectFormField
          label="Nombre del Piso"
          htmlFor={`floor-name-${floor.id}`}
          className="min-w-0 flex-1 gap-1"
          labelClassName={structureLabelClassName}
          labelStyle={structureFloorLabelStyle}
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
          <FieldLabelWithTooltip
            label="Identificador"
            tooltip={FLOOR_IDENTIFIER_TOOLTIP}
            htmlFor={`floor-identifier-${floor.id}`}
            labelClassName={structureLabelClassName}
            labelStyle={structureMutedLabelStyle}
          />
          <Input
            id={`floor-identifier-${floor.id}`}
            placeholder="Ej. PB, P01, SS."
            value={floor.identifier}
            maxLength={4}
            onChange={(e) => onUpdateFloor({ identifier: e.target.value })}
            className={structureFloorInputClassName}
            style={structureFloorInputStyle}
          />
        </div>

        <CreateProjectFormField
          label="Nivel"
          htmlFor={`floor-level-${floor.id}`}
          className="min-w-0 flex-1 gap-1"
          labelClassName={structureLabelClassName}
          labelStyle={structureFloorLabelStyle}
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

        <div className="flex shrink-0 items-center gap-4 px-6">
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
            className="inline-flex shrink-0 items-center justify-center transition-opacity hover:opacity-80"
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
        <div className="flex w-full flex-col gap-2">
          {floor.units.map((unit) => (
            <StructureUnitRow
              key={unit.id}
              unit={unit}
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
  onUpdateUnit: (patch: Partial<StructureUnitDraft>) => void
  onRemoveUnit: () => void
}

function StructureUnitRow({
  unit,
  onUpdateUnit,
  onRemoveUnit,
}: StructureUnitRowProps) {
  const variantEnabled = isUnitVariantFieldEnabled(unit.type)
  const variantLabel = getUnitVariantFieldLabel(unit.type)
  const variantField = getUnitVariantField(unit.type)
  const variantValue = variantField === "officeSize" ? unit.officeSize : unit.roomCount

  return (
    <div
      className="w-full rounded-[4px] px-3 pt-3 pb-3"
      style={{
        backgroundColor: STRUCTURE_STEP_COLORS.unitRowBg,
        maxWidth: STRUCTURE_STEP_LAYOUT.floorCardInnerWidth,
        minHeight: STRUCTURE_STEP_LAYOUT.unitRowMinHeight,
      }}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-end gap-2">
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
            <FieldLabelWithTooltip
              label="ID"
              tooltip={UNIT_CODE_TOOLTIP}
              htmlFor={`unit-code-${unit.id}`}
              labelClassName={structureLabelClassName}
              labelStyle={structureMutedLabelStyle}
            />
            <Input
              id={`unit-code-${unit.id}`}
              placeholder="Ej. 101"
              value={unit.code}
              maxLength={4}
              onChange={(e) => onUpdateUnit({ code: e.target.value })}
              className={structureUnitInputClassName}
              style={structureUnitInputStyle}
            />
          </div>

          <div className={cn("flex flex-col gap-1", structureUnitFieldColumnClassName.compact)}>
            <span className={structureLabelClassName} style={structureMutedLabelStyle}>
              m²
            </span>
            <Input
              id={`unit-m2-${unit.id}`}
              inputMode="decimal"
              placeholder="Ej. 45"
              value={unit.squareMeters}
              onChange={(e) => onUpdateUnit({ squareMeters: e.target.value })}
              className={structureUnitInputClassName}
              style={structureUnitInputStyle}
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
          className="inline-flex size-4 shrink-0 items-center justify-center self-center text-[#ce2c31] transition-opacity hover:opacity-80"
          aria-label="Eliminar unidad"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
