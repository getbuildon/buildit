"use client"

type CargarAvanceUnitMismatchCalloutProps = {
  selectedUnitCount: number
  show: boolean
}

export function CargarAvanceUnitMismatchCallout({
  selectedUnitCount,
  show,
}: CargarAvanceUnitMismatchCalloutProps) {
  if (!show) return null

  return (
    <div className="mb-4 flex gap-[10px] overflow-hidden rounded-[8px] bg-[#e6f4fe] px-4 py-3">
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
          Existen tareas que pueden cargarse de forma conjunta y otras que no coinciden. Seleccioná
          en cada tarea a qué unidad querés aplicar el avance.
        </p>
      </div>
    </div>
  )
}
