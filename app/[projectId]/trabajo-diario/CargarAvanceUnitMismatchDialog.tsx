"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import type { CargarAvanceMultiUnitMismatch } from "@/lib/projects/cargarAvance"
import { cn } from "@/lib/utils"

type CargarAvanceUnitMismatchDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  floorLabel: string
  unitLabels: string[]
  rubroName: string
  mismatch: CargarAvanceMultiUnitMismatch
}

function ContextMeta({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <p className="whitespace-nowrap px-2 text-[14px] leading-[1.4] text-[#5a6169]">
      <span>{label} </span>
      <span className="font-medium text-[#272a2d]">{value}</span>
    </p>
  )
}

function TaskDetailRow({
  taskCode,
  taskName,
  unitLabels,
  suffix,
}: {
  taskCode: string
  taskName: string
  unitLabels: string[]
  suffix?: string
}) {
  return (
    <div className="w-full rounded-[10px] border border-[#edeef0] bg-white px-4 py-1.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 font-mono text-[12px] leading-[1.4] text-[#696e77]">
          {taskCode}
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span className="text-[14px] leading-[1.4] text-[#43484e]">{taskName}</span>
          {unitLabels.map((label) => (
            <span
              key={label}
              className="rounded-[8px] bg-[#edeef0] px-1.5 text-[12px] leading-[1.4] tracking-[-0.36px] text-[#43484e]"
            >
              {label}
            </span>
          ))}
          {suffix ? (
            <span className="text-[12px] leading-[1.4] text-[#777b84]">{suffix}</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function TaskSection({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      <p className="text-[18px] font-medium leading-[1.05] text-[#18191b]">{title}</p>
      <div className="flex max-h-[230px] flex-col gap-1 overflow-y-auto">{children}</div>
    </div>
  )
}

export function CargarAvanceUnitMismatchDialog({
  open,
  onOpenChange,
  floorLabel,
  unitLabels,
  rubroName,
  mismatch,
}: CargarAvanceUnitMismatchDialogProps) {
  const { partiallyLoadedTasks, unitSpecificTasks } = mismatch

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[680px] gap-6 rounded-[16px] border-[#e2e8f0] px-[33px] py-[41px] shadow-[0_0_5px_rgba(243,103,31,0.08)]"
      >
        <div className="flex flex-col gap-2">
          <DialogTitle className="font-serif text-[24px] font-normal leading-[1.05] text-[#18191b]">
            Tareas que requieren carga individual
          </DialogTitle>
          <DialogDescription className="text-[16px] leading-[1.4] text-[#18191b]">
            Estas tareas no están disponibles en todas las unidades seleccionadas. Para registrar su
            avance, deberás cargarlo individualmente en las unidades donde correspondan.
          </DialogDescription>
        </div>

        <div className="w-full rounded-[10px] bg-[#f8fafc] p-3">
          <div className="flex flex-wrap items-center gap-3">
            <ContextMeta label="Piso:" value={floorLabel} />
            <ContextMeta label="Unidades:" value={unitLabels.join(", ")} />
            <ContextMeta label="Rubro:" value={rubroName} />
          </div>
        </div>

        {partiallyLoadedTasks.length > 0 ? (
          <TaskSection title="Tareas con avance en algunas unidades">
            {partiallyLoadedTasks.map((task) => (
              <TaskDetailRow
                key={`loaded-${task.taskId}`}
                taskCode={task.taskCode}
                taskName={task.taskName}
                unitLabels={task.loadedUnitLabels}
                suffix={
                  task.pendingUnitLabels.length > 0
                    ? `Pendiente en: ${task.pendingUnitLabels.join(", ")}`
                    : undefined
                }
              />
            ))}
          </TaskSection>
        ) : null}

        {unitSpecificTasks.length > 0 ? (
          <TaskSection title="Tareas específicas">
            {unitSpecificTasks.flatMap((task) =>
              task.assignedUnitLabels.map((unitLabel) => (
                <TaskDetailRow
                  key={`${task.taskId}-${unitLabel}`}
                  taskCode={task.taskCode}
                  taskName={task.taskName}
                  unitLabels={[unitLabel]}
                  suffix={
                    task.missingUnitLabels.length > 0
                      ? `No aplica en: ${task.missingUnitLabels.join(", ")}`
                      : undefined
                  }
                />
              )),
            )}
          </TaskSection>
        ) : null}

        <Button
          variant="brand"
          size="brand"
          className="h-11 w-full rounded-[10px] text-[14px] font-normal shadow-[0_0_10px_rgba(243,103,31,0.3)]"
          onClick={() => onOpenChange(false)}
        >
          Entendido
        </Button>
      </DialogContent>
    </Dialog>
  )
}
