"use client"

import type { CargarAvanceMultiUnitMismatch } from "@/lib/projects/cargarAvance"

type CargarAvanceUnitMismatchCalloutProps = {
  selectedUnitCount: number
  mismatch: CargarAvanceMultiUnitMismatch
  onViewDetail: () => void
}

export function CargarAvanceUnitMismatchCallout({
  selectedUnitCount,
  mismatch,
  onViewDetail,
}: CargarAvanceUnitMismatchCalloutProps) {
  if (!mismatch.shouldShowDisclaimer) return null

  return (
    <div className="flex gap-[10px] overflow-hidden rounded-[8px] bg-[#e6f4fe] px-4 py-3 mb-4">
      <div
        className="flex size-5 shrink-0 items-center justify-center rounded-[10px] bg-[#0090ff]"
        aria-hidden
      >
        <span className="text-[12px] font-bold leading-none text-white">i</span>
      </div>
      <div className="min-w-0 flex-1 text-[12px] leading-[1.4] tracking-[-0.36px] text-[#113264]">
        <p className="mb-0 font-medium">
          Se seleccionaron {selectedUnitCount} unidades funcionales:
        </p>
        <p className="mb-0 mt-0 font-normal">
          Las tareas comunes podrán cargarse de forma conjunta. Las tareas que no coincidan entre
          las unidades deberán registrarse individualmente.
        </p>
        <button
          type="button"
          onClick={onViewDetail}
          className="mt-0 cursor-pointer font-medium underline decoration-solid underline-offset-2"
        >
          Ver detalle
        </button>
      </div>
    </div>
  )
}
