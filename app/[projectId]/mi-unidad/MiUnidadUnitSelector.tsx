"use client"

import { Building2, CalendarDays } from "lucide-react"
import { getUnitDisplayCode } from "@/lib/projects/floorLabels"
import type { MiUnidadAssignedUnit } from "@/lib/projects/miUnidadTypes"
import { normalizeUnitType } from "@/lib/projects/unitTypes"
import { cn } from "@/lib/utils"

type MiUnidadUnitSelectorProps = {
  units: MiUnidadAssignedUnit[]
  projectName: string
  projectEndDateLabel: string | null
  selectedUnitId: string
  onSelectUnit: (unitId: string) => void
}

function buildUnitMeta(unit: MiUnidadAssignedUnit, projectName: string): string {
  const parts: string[] = []

  if (unit.roomCount != null && unit.roomCount > 0) {
    parts.push(`${unit.roomCount} ambientes`)
  }

  if (unit.floorLabel) {
    parts.push(`Piso ${unit.floorLabel}`)
  }

  parts.push(projectName)
  return parts.join(" · ")
}

function UnitRenderPreview({ unit }: { unit: MiUnidadAssignedUnit }) {
  if (unit.renderUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={unit.renderUrl}
        alt={`Render de unidad ${unit.code}`}
        className="size-full object-cover"
      />
    )
  }

  return (
    <div className="flex size-full items-center justify-center bg-[#f1f5f9]">
      <Building2 className="size-6 text-[#cad5e2]" strokeWidth={1.5} aria-hidden />
    </div>
  )
}

export function MiUnidadUnitSelector({
  units,
  projectName,
  projectEndDateLabel,
  selectedUnitId,
  onSelectUnit,
}: MiUnidadUnitSelectorProps) {
  const selectedUnit =
    units.find((unit) => unit.id === selectedUnitId) ?? units[0] ?? null
  const otherUnits = units.filter((unit) => unit.id !== selectedUnit?.id)

  if (!selectedUnit) {
    return (
      <div className="rounded-[14px] border border-dashed border-[#edeef0] bg-white px-6 py-8 text-center text-[14px] text-[#696e77] shadow-[0_0_5px_rgba(243,103,31,0.08)]">
        Todavía no tenés una unidad asignada en este proyecto.
      </div>
    )
  }

  const unitType = normalizeUnitType(selectedUnit.unitType) ?? selectedUnit.unitType

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
      <article className="flex min-h-[82px] min-w-0 flex-1 overflow-hidden rounded-[14px] border border-[#edeef0] bg-white shadow-[0_0_5px_rgba(243,103,31,0.08)]">
        <div className="relative h-[80px] w-[110px] shrink-0 overflow-hidden bg-[#f1f5f9]">
          <UnitRenderPreview unit={selectedUnit} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 px-[18px] py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[16px] font-medium leading-[1.4] text-[#1d293d]">
                Unidad {getUnitDisplayCode(selectedUnit)}
              </p>
              {unitType ? (
                <span className="rounded-full border border-[#ff7433] bg-[#ffeae0] px-2 py-[3px] text-[12px] leading-[1.4] tracking-[-0.36px] text-[#f3671f]">
                  {unitType}
                </span>
              ) : null}
            </div>
            <p className="pt-2 text-[14px] leading-[1.4] text-[#696e77]">
              {buildUnitMeta(selectedUnit, projectName)}
            </p>
          </div>

          {projectEndDateLabel ? (
            <div className="flex shrink-0 items-center gap-2 self-start rounded-[9px] border border-[#edeef0] bg-[#fefcfb] px-[13px] py-[9px] sm:self-center">
              <CalendarDays className="size-[13px] shrink-0 text-[#777b84]" aria-hidden />
              <div>
                <p className="text-[10px] leading-[1.4] tracking-[-0.5px] text-[#777b84]">
                  Entrega estimada
                </p>
                <p className="pt-0.5 text-[14px] font-medium leading-[1.4] text-[#1d293d]">
                  {projectEndDateLabel}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </article>

      {otherUnits.length > 0 ? (
        <div className="flex gap-2 self-stretch">
          {otherUnits.map((unit) => {
            const otherUnitType = normalizeUnitType(unit.unitType) ?? unit.unitType

            return (
              <button
                key={unit.id}
                type="button"
                onClick={() => onSelectUnit(unit.id)}
                className={cn(
                  "flex min-h-[82px] flex-col justify-center rounded-[10px] border border-[#edeef0] bg-white px-[13px] py-2 text-left shadow-[0_0_5px_rgba(243,103,31,0.08)] transition-colors hover:border-[#d5d7db]",
                )}
              >
                <p className="text-[12px] font-medium leading-[1.2] text-[#1d293d]">
                  Unidad {getUnitDisplayCode(unit)}
                </p>
                {otherUnitType ? (
                  <p className="pt-px text-[10px] font-medium leading-[1.2] text-[#777b84]">
                    {otherUnitType}
                  </p>
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
