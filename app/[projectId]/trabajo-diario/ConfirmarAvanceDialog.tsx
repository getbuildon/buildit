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
  unitLabels: string[]
}

type ConfirmarAvanceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  floorLabel: string
  rubroName: string
  tasks: ConfirmarAvanceTaskItem[]
  saving: boolean
  saveStatus?: string | null
  saveError: string | null
  onConfirm: () => void
}

export function ConfirmarAvanceDialog({
  open,
  onOpenChange,
  floorLabel,
  rubroName,
  tasks,
  saving,
  saveStatus,
  saveError,
  onConfirm,
}: ConfirmarAvanceDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[calc(100vw-32px)] max-w-[680px] gap-0 p-0 sm:w-full">
        <div className="border-b border-[#edeef0] px-4 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-5">
          <AlertDialogTitle className="font-recoleta text-[20px] font-normal leading-[1.2] text-[#272a2d] sm:text-[24px]">
            Confirmar registro de avance
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-[14px] leading-[1.5] text-[#777b84]">
            Revisá los trabajos registrados antes de confirmar.
          </AlertDialogDescription>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5">
          <div className="rounded-[10px] bg-[#f5f6f7] px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[14px] leading-[1.4]">
              <p>
                <span className="text-[#777b84]">Piso: </span>
                <span className="font-medium text-[#272a2d]">{floorLabel}</span>
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
                className="flex min-h-[52px] flex-col gap-2 rounded-[10px] border border-[#edeef0] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] text-[#272a2d]">{task.name}</p>
                  {task.unitLabels.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[12px] leading-[1.4] text-[#777b84]">Unidades:</span>
                      {task.unitLabels.map((label) => (
                        <span
                          key={label}
                          className="rounded-[8px] bg-[#edeef0] px-1.5 text-[12px] leading-[1.4] tracking-[-0.36px] text-[#43484e]"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                {task.status === "pending" ? (
                  <span className="self-start text-[12px] font-medium text-[#777b84] sm:shrink-0">
                    Sin Iniciar
                  </span>
                ) : (
                  <span
                    className={cn(
                      CARGAR_AVANCE_BADGE_CLASSNAME,
                      "self-start sm:shrink-0",
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

        <div className="grid grid-cols-1 gap-3 border-t border-[#edeef0] px-4 py-4 sm:grid-cols-2 sm:px-6 sm:py-5">
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
            {saving && saveStatus ? saveStatus : saving ? "Guardando..." : "Confirmar"}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
