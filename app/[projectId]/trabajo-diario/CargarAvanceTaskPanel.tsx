"use client"

import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Wrench,
} from "lucide-react"
import { InProcessStatusIcon } from "@/components/icons/InProcessStatusIcon"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { ProgressPhotoUpload } from "@/components/progress/ProgressPhotoUpload"
import {
  createEmptyTaskDraft,
  hasTaskDraftContent,
  CARGAR_AVANCE_BADGE_CLASSNAME,
  CARGAR_AVANCE_BADGE_STYLES,
  CARGAR_AVANCE_STATUS_LABELS,
  type CargarAvanceRubroOption,
  type CargarAvanceTaskDraft,
  type CargarAvanceTaskStatus,
} from "@/lib/projects/cargarAvance"
import type { TrabajoDiarioRubroTask } from "./actions"

const LEGEND_ITEMS: Array<{ status: CargarAvanceTaskStatus; label: string }> = [
  { status: "pending", label: "Sin Iniciar" },
  { status: "completed", label: "Completado" },
  { status: "in_progress", label: "En Proceso" },
  { status: "blocked", label: "Bloqueado" },
]

type EditableTaskStatus = Exclude<CargarAvanceTaskStatus, "pending">

const STATUS_BUTTON_STYLES: Array<{
  status: EditableTaskStatus
  label: string
  activeClassName: string
  activeIconClassName: string
}> = [
  {
    status: "completed",
    label: "Completado",
    activeClassName: "border-[#56BA9F] bg-[#F4FBF7] text-[#56BA9F]",
    activeIconClassName: "text-[#56BA9F]",
  },
  {
    status: "in_progress",
    label: "En Proceso",
    activeClassName: "border-[#c9a227] bg-[#FFFCF0] text-[#4f3422]",
    activeIconClassName: "text-[#c9a227]",
  },
  {
    status: "blocked",
    label: "Bloqueado",
    activeClassName: "border-[#c62828] bg-[#FFF5F5] text-[#641723]",
    activeIconClassName: "text-[#c62828]",
  },
]

/** Paleta de pills en la fila colapsada (más saturada que los botones selector). */
const BADGE_STYLES = CARGAR_AVANCE_BADGE_STYLES

const TASK_ROW_BADGE_CLASSNAME = CARGAR_AVANCE_BADGE_CLASSNAME

const STATUS_LABELS = CARGAR_AVANCE_STATUS_LABELS

function TaskStatusIcon({ status }: { status: CargarAvanceTaskStatus }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="size-5 shrink-0 text-[#208368]" aria-hidden />
    case "in_progress":
      return <InProcessStatusIcon className="text-[#c9a227]" />
    case "blocked":
      return <AlertCircle className="size-5 shrink-0 text-[#c62828]" aria-hidden />
    default:
      return <Circle className="size-5 shrink-0 text-[#afb3ba]" aria-hidden />
  }
}

function StatusOptionIcon({
  status,
  active,
  activeIconClassName,
}: {
  status: EditableTaskStatus
  active: boolean
  activeIconClassName?: string
}) {
  const inactiveClassName = "text-[#afb3ba]"

  switch (status) {
    case "completed":
      return (
        <CheckCircle2
          className={cn(
            "size-5 shrink-0",
            active ? activeIconClassName ?? "text-[#56BA9F]" : inactiveClassName,
          )}
          aria-hidden
        />
      )
    case "in_progress":
      return (
        <InProcessStatusIcon
          className={cn(active ? activeIconClassName ?? "text-[#c9a227]" : inactiveClassName)}
        />
      )
    case "blocked":
      return (
        <AlertCircle
          className={cn(
            "size-5 shrink-0",
            active ? activeIconClassName ?? "text-[#c62828]" : inactiveClassName,
          )}
          aria-hidden
        />
      )
  }
}

type CargarAvanceTaskPanelProps = {
  availableRubros: CargarAvanceRubroOption[]
  selectedRubroId: string
  onSelectRubro: (rubroId: string) => void
  tasks: TrabajoDiarioRubroTask[]
  expandedTaskIds: Set<string>
  taskDrafts: Record<string, CargarAvanceTaskDraft>
  onToggleTask: (taskId: string) => void
  onUpdateTaskDraft: (taskId: string, patch: Partial<CargarAvanceTaskDraft>) => void
  canSave: boolean
  saving: boolean
  saveError: string | null
  onReview: () => void
}

export function CargarAvanceTaskPanel({
  availableRubros,
  selectedRubroId,
  onSelectRubro,
  tasks,
  expandedTaskIds,
  taskDrafts,
  onToggleTask,
  onUpdateTaskDraft,
  canSave,
  saving,
  saveError,
  onReview,
}: CargarAvanceTaskPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[14px] border border-[#edeef0] bg-white p-6 shadow-[0_0_5px_rgba(243,103,31,0.08)]">
        <div className="mb-3 flex items-center gap-2">
          <Wrench className="size-4 text-[#314158]" aria-hidden />
          <p className="text-[16px] font-normal leading-[1.4] text-[#314158]">Rubro</p>
        </div>
        <Select value={selectedRubroId} onValueChange={onSelectRubro}>
          <SelectTrigger aria-label="Seleccionar rubro">
            <SelectValue placeholder="Seleccioná un rubro" />
          </SelectTrigger>
          <SelectContent>
            {availableRubros.map((rubro) => (
              <SelectItem key={rubro.id} value={rubro.id}>
                {rubro.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-[14px] border border-[#edeef0] bg-white p-6 shadow-[0_0_5px_rgba(243,103,31,0.08)]">
        <div className="mb-4 flex flex-col gap-1">
          <h3 className="text-[16px] font-normal leading-[1.4] text-[#314158]">
            Estado de Trabajos por Tarea
          </h3>
          <p className="text-[14px] leading-[1.4] text-[#777b84]">
            Hacé click en cada tarea realizada para agregar detalles
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[10px] bg-[#f5f6f7] px-4 py-3">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.status} className="flex items-center gap-2">
              <TaskStatusIcon status={item.status} />
              <span className="text-[12px] text-[#43484e]">{item.label}</span>
            </div>
          ))}
        </div>

        {tasks.length === 0 ? (
          <p className="text-[14px] text-[#777b84]">
            No hay tareas pendientes de carga para las unidades seleccionadas.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {tasks.map((task) => {
              const expanded = expandedTaskIds.has(task.id)
              const draft = taskDrafts[task.id] ?? createEmptyTaskDraft()
              const showBadge = draft.taskStatus !== "pending"

              return (
                <div
                  key={task.id}
                  className="overflow-hidden rounded-[12px] border border-[#edeef0] bg-white"
                >
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    aria-expanded={expanded}
                    className="flex h-[52px] w-full items-center gap-3 px-3.5 text-left transition-colors hover:bg-[#fafafa]"
                  >
                    <TaskStatusIcon status={draft.taskStatus} />
                    <span className="min-w-0 flex-1 truncate text-[14px] leading-[1.4] text-[#272a2d]">
                      {task.name}
                    </span>
                    <span
                      className={cn(
                        TASK_ROW_BADGE_CLASSNAME,
                        showBadge
                          ? BADGE_STYLES[
                              draft.taskStatus as Exclude<CargarAvanceTaskStatus, "pending">
                            ]
                          : "invisible",
                      )}
                      aria-hidden={!showBadge}
                    >
                      {showBadge
                        ? STATUS_LABELS[draft.taskStatus]
                        : STATUS_LABELS.blocked}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-[#43484e] transition-transform",
                        expanded && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>

                  {expanded ? (
                    <div className="border-t border-[#edeef0] bg-white p-4">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <p className="text-[12px] font-normal text-[#777b84]">
                            Estado de la Tarea
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {STATUS_BUTTON_STYLES.map((option) => {
                              const isActive = draft.taskStatus === option.status

                              return (
                                <button
                                  key={option.status}
                                  type="button"
                                  onClick={() =>
                                    onUpdateTaskDraft(task.id, { taskStatus: option.status })
                                  }
                                  aria-pressed={isActive}
                                  className={cn(
                                    "inline-flex items-center justify-center gap-2 rounded-[10px] border-2 px-3 py-[10px] text-[14px] font-medium transition-colors",
                                    isActive
                                      ? option.activeClassName
                                      : "border-[#edeef0] bg-white text-[#777b84] hover:bg-[#fafafa]",
                                  )}
                                >
                                  <StatusOptionIcon
                                    status={option.status}
                                    active={isActive}
                                    activeIconClassName={option.activeIconClassName}
                                  />
                                  {option.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor={`comment-${task.id}`}
                            className="text-[12px] font-normal text-[#777b84]"
                          >
                            Comentarios y Observaciones
                          </label>
                          <textarea
                            id={`comment-${task.id}`}
                            value={draft.comment}
                            onChange={(event) =>
                              onUpdateTaskDraft(task.id, { comment: event.target.value })
                            }
                            rows={3}
                            placeholder="Agrega notas sobre esta tarea..."
                            className="w-full resize-none rounded-[10px] border border-[#afb3ba] bg-white px-3 py-2.5 text-[14px] text-[#272a2d] outline-none focus:border-[#ff7433]"
                          />
                        </div>

                        <ProgressPhotoUpload
                          photos={draft.photos}
                          onChange={(photos) => onUpdateTaskDraft(task.id, { photos })}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-6 flex flex-col items-end gap-3 border-t border-[#edeef0] pt-6">
          {saveError ? (
            <p className="w-full text-[14px] text-[#641723]">{saveError}</p>
          ) : null}
          <Button
            variant="brand"
            size="brand"
            className="min-w-[200px] rounded-[12px] px-5 text-[14px] font-medium shadow-[0_4px_14px_rgba(241,132,77,0.35)]"
            disabled={!canSave || saving}
            onClick={onReview}
          >
            {saving ? <Spinner className="size-4" /> : <Check className="size-4" aria-hidden />}
            Revisar y Confirmar
          </Button>
        </div>
      </div>
    </div>
  )
}
