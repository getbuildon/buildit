"use client"

import { Building2 } from "lucide-react"
import { UnitBuildingIcon } from "@/components/icons/UnitBuildingIcon"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { getUnitDisplayCode } from "@/lib/projects/floorLabels"
import type { MiUnidadAssignedUnit } from "@/lib/projects/miUnidadTypes"
import { normalizeUnitType } from "@/lib/projects/unitTypes"

type MiUnidadUnitDialogProps = {
  unit: MiUnidadAssignedUnit | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDialogMeta(unit: MiUnidadAssignedUnit): string {
  const parts: string[] = []
  const squareMeters =
    unit.squareMeters != null && Number.isFinite(unit.squareMeters) && unit.squareMeters > 0
      ? unit.squareMeters
      : null

  if (unit.roomCount != null && unit.roomCount > 0) {
    parts.push(unit.roomCount === 1 ? "1 Ambiente" : `${unit.roomCount} Ambientes`)
  }

  if (squareMeters != null) {
    const formatted = new Intl.NumberFormat("es-AR").format(Math.round(squareMeters))
    parts.push(`${formatted}m²`)
  }

  if (unit.floorLabel) {
    parts.push(`Piso ${unit.floorLabel}`)
  }

  return parts.join(" • ")
}

export function MiUnidadUnitDialog({
  unit,
  open,
  onOpenChange,
}: MiUnidadUnitDialogProps) {
  const unitType = unit
    ? normalizeUnitType(unit.unitType) ?? unit.unitType
    : null
  const meta = unit ? formatDialogMeta(unit) : ""
  const title = unit ? `Unidad ${getUnitDisplayCode(unit)}` : "Unidad"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[1104px] max-w-[min(1104px,calc(100vw-48px))] gap-4 rounded-[10px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_8px_32px_rgba(24,25,27,0.12)]"
      >
        <div className="flex min-h-[27px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <DialogTitle className="text-[18px] font-medium leading-[1.05] text-[#1d293d]">
              {title}
            </DialogTitle>
            {unitType ? (
              <span className="rounded-full border border-[#ff7433] bg-[#ffeae0] px-2 py-[3px] text-[12px] leading-[1.4] tracking-[-0.36px] text-[#f3671f]">
                {unitType}
              </span>
            ) : null}
          </div>
          {meta ? (
            <DialogDescription asChild>
              <p className="flex items-center gap-2 text-[16px] leading-[1.4] text-[#272a2d]">
                <UnitBuildingIcon className="text-[#272a2d]" />
                <span>{meta}</span>
              </p>
            </DialogDescription>
          ) : (
            <DialogDescription className="sr-only">
              Detalle de la unidad
            </DialogDescription>
          )}
        </div>

        <div className="aspect-[1054/593] min-h-0 w-full max-h-[min(593px,calc(90vh-140px))] overflow-hidden rounded-[14px] bg-[#f1f5f9]">
          {unit?.renderUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={unit.renderUrl}
              alt={`Render de ${title}`}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Building2 className="size-12 text-[#cad5e2]" strokeWidth={1.5} aria-hidden />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
