"use client"

import { Building2, Paperclip, Plus, Trash2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  CreateProjectFormField,
  createProjectCompactInputClassName,
  createProjectCompactInputStyle,
  createProjectSelectClassName,
} from "@/components/projects/new/CreateProjectFormField"
import {
  STRUCTURE_UNIT_TYPES,
  countStructureUnits,
  createDefaultFloor,
  createDefaultUnit,
  type CreateProjectDraft,
  type StructureFloorDraft,
  type StructureUnitDraft,
} from "@/lib/projects/createProjectDraft"
import { UnitVariantField } from "@/components/projects/UnitVariantField"

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-[14px] font-normal leading-5" style={{ color: "#272a2d" }}>
            Cantidad de pisos
          </p>
          <div className="flex flex-col gap-2">
            <p
              className="text-[24px] font-medium leading-[25px]"
              style={{ color: "#18191b" }}
            >
              {floorCount} {floorCount === 1 ? "piso" : "pisos"}
            </p>
            <p className="text-[14px] font-normal leading-5" style={{ color: "#18191b" }}>
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
        className="flex flex-col gap-4 rounded-[10px] p-4"
        style={{ backgroundColor: "#fefcfb" }}
      >
        <div className="flex flex-col gap-1">
          <h3 className="text-[14px] font-normal leading-5" style={{ color: "#18191b" }}>
            Unidades por Piso
          </h3>
          <p className="text-[12px] font-normal leading-4" style={{ color: "#43484e" }}>
            Configurá las unidades de cada piso:
          </p>
        </div>

        {draft.floors.length === 0 ? (
          <p
            className="rounded-[10px] bg-white py-6 text-center text-[12px] font-normal leading-4"
            style={{ color: "#afb3ba" }}
          >
            Todavía no hay pisos. Usá &quot;Agregar piso&quot; para empezar.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
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

      <div
        className="flex items-center gap-3 rounded-[10px] border px-4 py-4"
        style={{
          borderColor: "#ffeae0",
          backgroundColor: "#fff6f1",
        }}
      >
        <Building2 className="size-5 shrink-0" style={{ color: "#321a10" }} aria-hidden />
        <div className="flex flex-col">
          <p className="text-[14px] font-normal leading-5" style={{ color: "#321a10" }}>
            Resumen del Proyecto
          </p>
          <p className="text-[14px] font-normal leading-5" style={{ color: "#321a10" }}>
            Total: {floorCount} {floorCount === 1 ? "piso" : "pisos"} •{" "}
            {unitCount} {unitCount === 1 ? "unidad" : "unidades"}
          </p>
        </div>
      </div>
    </div>
  )
}

// Field styles for the structure step — Figma 1128:5510
// Label 12px/#43484e, input 34px tall, r4, border #edeef0, text #0a0a0a
const structureLabelClassName = "text-[12px] font-normal leading-4"
const structureLabelStyle = { color: "#43484e" } as const
const structureInputClassName =
  "h-[34px] w-full rounded-[4px] border bg-transparent px-3 py-1.5 text-[14px] font-normal leading-[17px] text-[#0a0a0a] shadow-none placeholder:text-[#afb3ba] focus-visible:border-[#ff7433] focus-visible:ring-0"
const structureInputStyle = { borderColor: "#edeef0" } as const

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
      className="rounded-[10px] bg-white p-3"
      style={{ boxShadow: "0 0 15px rgba(0, 0, 0, 0.05)" }}
    >
      <div className="flex flex-col gap-3">
        <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <CreateProjectFormField
            label="Nombre del Piso"
            htmlFor={`floor-name-${floor.id}`}
            labelClassName={structureLabelClassName}
            labelStyle={structureLabelStyle}
          >
            <Input
              id={`floor-name-${floor.id}`}
              value={floor.name}
              onChange={(e) => onUpdateFloor({ name: e.target.value })}
              className={structureInputClassName}
              style={structureInputStyle}
            />
          </CreateProjectFormField>

          <CreateProjectFormField
            label="Nivel"
            htmlFor={`floor-level-${floor.id}`}
            labelClassName={structureLabelClassName}
            labelStyle={structureLabelStyle}
          >
            <Input
              id={`floor-level-${floor.id}`}
              placeholder="Ej: +1.90"
              value={floor.level}
              onChange={(e) => onUpdateFloor({ level: e.target.value })}
              className={structureInputClassName}
              style={structureInputStyle}
            />
          </CreateProjectFormField>

          <div
            className="flex h-[34px] shrink-0 items-center justify-start gap-4 px-6 sm:justify-end"
          >
            <button
              type="button"
              onClick={onAddUnit}
              className="inline-flex items-center gap-1 text-[12px] font-medium leading-4 transition-opacity hover:opacity-80"
              style={{ color: "#321a10" }}
            >
              <Plus className="size-3" aria-hidden />
              Agregar Unidad
            </button>
            <button
              type="button"
              onClick={onRemoveFloor}
              className="inline-flex shrink-0 items-center justify-center transition-opacity hover:opacity-80"
              style={{ color: "#ce2c31" }}
              aria-label={`Eliminar ${floor.name}`}
            >
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          </div>
        </div>

        {floor.units.length === 0 ? (
          <p
            className="py-1.5 text-center text-[12px] font-normal leading-4"
            style={{ color: "#afb3ba" }}
          >
            No hay unidades configuradas
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {floor.units.map((unit) => (
              <div
                key={unit.id}
                className="rounded-[10px] p-3"
                style={{ backgroundColor: "#faf8f7" }}
              >
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.6fr)_minmax(0,0.8fr)_auto_auto] lg:items-end">
                  <CreateProjectFormField label="Tipo" htmlFor={`unit-type-${unit.id}`}>
                    <select
                      id={`unit-type-${unit.id}`}
                      value={unit.type}
                      onChange={(e) =>
                        onUpdateUnit(unit.id, {
                          type: e.target.value as StructureUnitDraft["type"],
                          roomCount:
                            e.target.value === "Departamento" ? unit.roomCount : "",
                          officeSize: e.target.value === "Oficina" ? unit.officeSize : "",
                        })
                      }
                      className={createProjectSelectClassName}
                      style={createProjectCompactInputStyle}
                    >
                      {STRUCTURE_UNIT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </CreateProjectFormField>

                  <CreateProjectFormField label="m²" htmlFor={`unit-m2-${unit.id}`}>
                    <Input
                      id={`unit-m2-${unit.id}`}
                      inputMode="decimal"
                      placeholder="45"
                      value={unit.squareMeters}
                      onChange={(e) =>
                        onUpdateUnit(unit.id, { squareMeters: e.target.value })
                      }
                      className={createProjectCompactInputClassName}
                      style={createProjectCompactInputStyle}
                    />
                  </CreateProjectFormField>

                  <UnitVariantField
                    unitId={unit.id}
                    type={unit.type}
                    roomCount={unit.roomCount}
                    officeSize={unit.officeSize}
                    onChange={(patch) => onUpdateUnit(unit.id, patch)}
                  />

                  <CreateProjectFormField label="Planta">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full rounded-[10px] border-[#edeef0] bg-white text-[#321a10] hover:bg-[#fff6f1] hover:!text-[#321a10] dark:hover:!text-[#321a10]"
                    >
                      <Paperclip className="size-4" aria-hidden />
                      Adjuntar
                    </Button>
                  </CreateProjectFormField>

                  <div className="flex h-10 items-center justify-end">
                    <button
                      type="button"
                      onClick={() => onRemoveUnit(unit.id)}
                      className="inline-flex size-10 items-center justify-center rounded-[10px] text-[#ef4444] transition-colors hover:bg-white"
                      aria-label="Eliminar unidad"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
