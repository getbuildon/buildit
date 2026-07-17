"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  CARGAR_AVANCE_BADGE_CLASSNAME,
  CARGAR_AVANCE_BADGE_STYLES,
  CARGAR_AVANCE_STATUS_LABELS,
  type CargarAvanceTaskStatus,
} from "@/lib/projects/cargarAvance"
import { cn } from "@/lib/utils"

export type ConfirmarAvanceTaskItem = {
  id: string
  name: string
  status: CargarAvanceTaskStatus
}

type ConfirmarAvanceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  floorLabel: string
  unitLabels: string[]
  rubroName: string
  tasks: ConfirmarAvanceTaskItem[]
  saving: boolean
  saveError: string | null
  onConfirm: () => void
}

export function ConfirmarAvanceDialog({
  open,
  onOpenChange,
  floorLabel,
  unitLabels,
  rubroName,
  tasks,
  saving,
  saveError,
  onConfirm,
}: ConfirmarAvanceDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[680px] gap-0 p-0">
        <div className="border-b border-[#edeef0] px-6 pt-6 pb-5">
          <AlertDialogTitle className="font-recoleta text-[24px] font-normal leading-[1.2] text-[#272a2d]">
            Confirmar registro de avance
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-[14px] leading-[1.5] text-[#777b84]">
            Revisá los trabajos registrados antes de confirmar.
          </AlertDialogDescription>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          <div className="rounded-[10px] bg-[#f5f6f7] px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[14px] leading-[1.4]">
              <p>
                <span className="text-[#777b84]">Piso: </span>
                <span className="font-medium text-[#272a2d]">{floorLabel}</span>
              </p>
              <p>
                <span className="text-[#777b84]">Unidades: </span>
                <span className="font-medium text-[#272a2d]">{unitLabels.join(", ")}</span>
              </p>
              <p>
                <span className="text-[#777b84]">Rubro: </span>
                <span className="font-medium text-[#272a2d]">{rubroName}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex h-[52px] items-center justify-between gap-3 rounded-[10px] border border-[#edeef0] bg-white px-4"
              >
                <span className="min-w-0 truncate text-[14px] text-[#272a2d]">{task.name}</span>
                {task.status === "pending" ? (
                  <span className="text-[12px] font-medium text-[#777b84]">Sin Iniciar</span>
                ) : (
                  <span
                    className={cn(
                      CARGAR_AVANCE_BADGE_CLASSNAME,
                      CARGAR_AVANCE_BADGE_STYLES[task.status],
                    )}
                  >
                    {CARGAR_AVANCE_STATUS_LABELS[task.status]}
                  </span>
                )}
              </div>
            ))}
          </div>

          {saveError ? <p className="text-[14px] text-[#641723]">{saveError}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-[#edeef0] px-6 py-5">
          <AlertDialogCancel className="mt-0 w-full sm:mt-0">
            Volver a editar
          </AlertDialogCancel>
          <Button
            variant="brand"
            size="brand"
            className="h-[44px] w-full rounded-[12px] text-[14px] font-medium shadow-[0_4px_14px_rgba(241,132,77,0.35)]"
            disabled={saving}
            onClick={onConfirm}
          >
            {saving ? <Spinner className="size-4" /> : null}
            Confirmar
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
