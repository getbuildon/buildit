"use client"

import { useState } from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Check,
  ChevronDown,
  GripVertical,
  Plus,
  SquarePen,
  Trash2,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { InlineEditInput } from "@/components/ui/inline-edit-input"
import { Button } from "@/components/ui/button"
import {
  createProjectInputClassName,
  createProjectInputStyle,
} from "@/components/projects/new/CreateProjectFormField"
import {
  createDefaultRubroItem,
  createDefaultRubroTask,
  createRubroGroup,
  getGroupDisplayStats,
  type CreateProjectDraft,
  type RubroGroupDraft,
  type RubroItemDraft,
  type RubroTaskDraft,
} from "@/lib/projects/createProjectDraft"
import {
  RubroIncidenceBadge,
  RubroIncidenceEditor,
  rubroRowStyles,
  RUBRO_STRUCTURE_COLORS,
  RUBRO_STRUCTURE_SHADOW,
  validateRubroWeightDraft,
} from "@/components/projects/new/RubroIncidenceBadge"
import { RubroProgressHelpModal } from "@/components/projects/new/RubroProgressHelpModal"
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog"
import { getAllRubrosFromGroups, getRubroEffectiveWeightValue, finalizeManualRubroWeightPercent, isManualRubroWeightOverLimit, isRubroWeightAuto, parseRubroWeightInput, RUBRO_WEIGHT_OVER_LIMIT_MESSAGE } from "@/lib/projects/rubroWeights"
import { cn } from "@/lib/utils"
import { AnimatedCollapsible } from "@/components/ui/animated-collapsible"
import {
  newItemHighlightClass,
  useNewItemHighlight,
} from "@/components/projects/new/useNewItemHighlight"

const RUBRO_STRUCTURE_DELETE_CONFIRM = {
  title: "Confirmar cambios",
  description:
    "Los cambios se verán reflejados en todas las unidades funcionales ¿Deseás continuar?",
  confirmLabel: "Confirmar",
} as const

type PendingRubroStructureDelete =
  | { kind: "group"; groupId: string }
  | { kind: "rubro"; groupId: string; rubroId: string }
  | { kind: "task"; groupId: string; rubroId: string; taskId: string }

type SortableTaskItemProps = {
  task: RubroTaskDraft
  index: number
  rubroNumber: string
  groupId: string
  rubroId: string
  isEditing: boolean
  editingName: string
  onStartEditing: (taskId: string, currentName: string) => void
  onSaveEditing: (groupId: string, rubroId: string, taskId: string) => void
  onCancelEditing: () => void
  onUpdateName: (name: string) => void
  onRemove: (groupId: string, rubroId: string, taskId: string) => void
  isHighlighted?: boolean
}

function SortableTaskItem({
  task,
  index,
  rubroNumber,
  groupId,
  rubroId,
  isEditing,
  editingName,
  onStartEditing,
  onSaveEditing,
  onCancelEditing,
  onUpdateName,
  onRemove,
  isHighlighted = false,
}: SortableTaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      data-new-item-id={task.id}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: RUBRO_STRUCTURE_COLORS.taskSurface,
        borderColor: RUBRO_STRUCTURE_COLORS.taskBorder,
      }}
      className={cn(
        "flex h-10 items-center gap-2 rounded-lg border px-2",
        newItemHighlightClass(isHighlighted),
      )}
    >
      {isEditing ? (
        <>
          <InlineEditInput
            autoFocus
            value={editingName}
            onChange={onUpdateName}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEditing(groupId, rubroId, task.id)
              if (e.key === "Escape") onCancelEditing()
            }}
            className="min-w-0 w-full flex-1 basis-0"
            aria-label="Nombre de la tarea"
          />
          <RowSaveCancelActions
            onSave={() => onSaveEditing(groupId, rubroId, task.id)}
            onCancel={onCancelEditing}
          />
        </>
      ) : (
        <>
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none active:cursor-grabbing"
            aria-label="Arrastrar para reordenar"
          >
            <GripVertical className="size-3.5 shrink-0 text-[#afb3ba]" aria-hidden />
          </button>
          <span
            className="shrink-0 text-[12px] font-normal leading-4 tabular-nums"
            style={{ color: "#572d1c" }}
          >
            {rubroNumber}.{index + 1}
          </span>
          <span
            className="min-w-0 flex-1 truncate text-[14px] text-[#314158]"
          >
            {task.name.trim() || "Tarea sin nombre"}
          </span>
          <RowEditDeleteActions
            onEdit={() => onStartEditing(task.id, task.name)}
            onDelete={() => onRemove(groupId, rubroId, task.id)}
            editLabel="Editar tarea"
            deleteLabel="Eliminar tarea"
          />
        </>
      )}
    </div>
  )
}

type CreateProjectTasksStepProps = {
  draft: CreateProjectDraft
  onChange: (patch: Partial<CreateProjectDraft>) => void
}

function rubroKey(groupId: string, rubroId: string) {
  return `${groupId}:${rubroId}`
}

function ExpandToggleIcon({ expanded }: { expanded: boolean }) {
  return (
    <ChevronDown
      className={cn(
        "size-5 shrink-0 text-[#111113] transition-transform duration-300 ease-in-out",
        !expanded && "-rotate-90",
      )}
      aria-hidden
    />
  )
}

const rowActionButtonClassName =
  "inline-flex size-6 shrink-0 cursor-pointer items-center justify-center transition-opacity hover:opacity-80"

function RowEditDeleteActions({
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: {
  onEdit: () => void
  onDelete: () => void
  editLabel: string
  deleteLabel: string
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        onClick={onEdit}
        className={cn(rowActionButtonClassName, "text-[#777b84]")}
        aria-label={editLabel}
      >
        <SquarePen className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className={cn(rowActionButtonClassName, "text-[#ce2c31]")}
        aria-label={deleteLabel}
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </div>
  )
}

function RowSaveCancelActions({
  onSave,
  onCancel,
}: {
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        onClick={onSave}
        className={rowActionButtonClassName}
        aria-label="Guardar"
      >
        <Check className="size-4 text-[#15803d]" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className={rowActionButtonClassName}
        aria-label="Cancelar"
      >
        <X className="size-4 text-[#666]" aria-hidden />
      </button>
    </div>
  )
}

function DashedAddButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#cad5e2] bg-white px-4 py-2.5 text-[14px] font-medium leading-5 text-[#696e77] transition-colors hover:border-[#ff7433] hover:text-[#ff7433]"
    >
      <Plus className="size-4" aria-hidden />
      {label}
    </button>
  )
}

function InExecutionTasksCallout() {
  return (
    <div
      className="flex w-full items-center gap-2.5 overflow-hidden rounded-lg px-4 py-3"
      style={{ backgroundColor: "#e6f4fe" }}
      role="note"
    >
      <span
        className="flex size-5 shrink-0 items-center justify-center rounded-[10px] text-[12px] font-bold leading-none text-white"
        style={{ backgroundColor: "#0090ff" }}
        aria-hidden
      >
        i
      </span>
      <p
        className="min-w-0 flex-1 text-[12px] font-normal leading-[1.4] tracking-[-0.36px]"
        style={{ color: "#113264" }}
      >
        No te preocupes por el estado de avance actual. En un siguiente paso vas a poder
        indicar qué rubros ya están completados o en proceso.
      </p>
    </div>
  )
}

export function CreateProjectTasksStep({
  draft,
  onChange,
}: CreateProjectTasksStepProps) {
  const { markAsNew, isHighlighted } = useNewItemHighlight()
  const [newGroupName, setNewGroupName] = useState("")
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(() => {
    const first = draft.groups[0]
    return first ? new Set([first.id]) : new Set()
  })
  const [expandedRubroIds, setExpandedRubroIds] = useState<Set<string>>(() => {
    const first = draft.groups[0]
    if (!first) return new Set()
    const keys = new Set<string>()
    for (const rubro of first.rubros) {
      if (rubro.tasks.length > 0) {
        keys.add(rubroKey(first.id, rubro.id))
      }
    }
    return keys
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingWeightRubroId, setEditingWeightRubroId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [editingWeightPercent, setEditingWeightPercent] = useState("")
  const [editingWeightAuto, setEditingWeightAuto] = useState(true)
  const [progressHelpOpen, setProgressHelpOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<PendingRubroStructureDelete | null>(
    null,
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  const allRubros = getAllRubrosFromGroups(draft.groups)

  const getEditingRubroWeightPreview = (rubroId: string) => {
    return allRubros.map((rubro) =>
      rubro.id === rubroId
        ? {
            ...rubro,
            weightPercent: editingWeightAuto ? "" : editingWeightPercent,
          }
        : rubro,
    )
  }

  const rubrosForWeightDisplay = editingWeightRubroId
    ? getEditingRubroWeightPreview(editingWeightRubroId)
    : allRubros

  const manualWeightOverLimit = isManualRubroWeightOverLimit(rubrosForWeightDisplay)

  const setGroups = (groups: RubroGroupDraft[]) => {
    onChange({ groups })
  }

  const startEditingGroup = (groupId: string, currentName: string) => {
    setEditingId(groupId)
    setEditingName(currentName)
  }

  const saveEditingGroup = (groupId: string) => {
    if (!editingName.trim()) {
      setEditingId(null)
      return
    }
    updateGroup(groupId, { name: editingName })
    setEditingId(null)
  }

  const startEditingRubro = (rubro: RubroItemDraft) => {
    setEditingWeightRubroId(null)
    setEditingId(`rubro-${rubro.id}`)
    setEditingName(rubro.name)
    setEditingWeightPercent(rubro.weightPercent)
    setEditingWeightAuto(isRubroWeightAuto(rubro))
  }

  const startEditingRubroWeight = (
    rubro: RubroItemDraft,
    mode?: "auto" | "manual",
  ) => {
    setEditingId(null)
    setEditingWeightRubroId(rubro.id)
    const nextAuto = mode ? mode === "auto" : isRubroWeightAuto(rubro)
    setEditingWeightAuto(nextAuto)
    if (!nextAuto && !rubro.weightPercent.trim()) {
      setEditingWeightPercent(getRubroEffectiveWeightValue(rubro, allRubros))
    } else {
      setEditingWeightPercent(rubro.weightPercent)
    }
  }

  const persistRubroWeight = (groupId: string, rubroId: string): boolean => {
    if (!editingWeightAuto) {
      const fieldError = validateRubroWeightDraft(editingWeightAuto, editingWeightPercent)
      if (fieldError) return false

      if (isManualRubroWeightOverLimit(getEditingRubroWeightPreview(rubroId))) {
        return false
      }
    }

    const parsedWeight = editingWeightAuto
      ? ""
      : finalizeManualRubroWeightPercent(editingWeightPercent)

    updateRubroInGroup(groupId, rubroId, { weightPercent: parsedWeight })
    return true
  }

  const saveEditingRubroWeight = (groupId: string, rubroId: string) => {
    if (persistRubroWeight(groupId, rubroId)) {
      setEditingWeightRubroId(null)
    }
  }

  const syncEditingRubroWeightDraft = (
    groupId: string,
    rubroId: string,
    auto: boolean,
    percent: string,
  ) => {
    updateRubroInGroup(groupId, rubroId, {
      weightPercent: auto ? "" : percent,
    })
  }

  const buildRubroWeightChangeHandlers = (groupId: string, rubroId: string) => ({
    onWeightPercentChange: (value: string) => {
      setEditingWeightPercent(value)
      syncEditingRubroWeightDraft(groupId, rubroId, false, value)
    },
    onWeightAutoChange: (auto: boolean) => {
      setEditingWeightAuto(auto)
      if (auto) {
        syncEditingRubroWeightDraft(groupId, rubroId, true, "")
      }
    },
  })

  const saveEditingRubro = (groupId: string, rubroId: string) => {
    if (!editingName.trim()) {
      setEditingId(null)
      return
    }

    if (!editingWeightAuto) {
      const fieldError = validateRubroWeightDraft(editingWeightAuto, editingWeightPercent)
      if (fieldError) return

      if (isManualRubroWeightOverLimit(getEditingRubroWeightPreview(rubroId))) {
        return
      }
    }

    const parsedWeight = editingWeightAuto
      ? ""
      : finalizeManualRubroWeightPercent(editingWeightPercent)

    updateRubroInGroup(groupId, rubroId, {
      name: editingName,
      weightPercent: parsedWeight,
    })
    setEditingId(null)
    setEditingWeightRubroId(null)
  }

  const startEditingTask = (taskId: string, currentName: string) => {
    setEditingId(taskId)
    setEditingName(currentName)
  }

  const saveEditingTask = (groupId: string, rubroId: string, taskId: string) => {
    if (!editingName.trim()) {
      setEditingId(null)
      return
    }
    updateTaskInRubro(groupId, rubroId, taskId, { name: editingName })
    setEditingId(null)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingWeightRubroId(null)
    setEditingName("")
    setEditingWeightPercent("")
    setEditingWeightAuto(true)
  }

  const clearGroupSeed = (group: RubroGroupDraft): Partial<RubroGroupDraft> => ({
    seedRubrosCount: undefined,
    seedTasksCount: undefined,
  })

  const updateGroup = (groupId: string, patch: Partial<RubroGroupDraft>) => {
    setGroups(
      draft.groups.map((group) =>
        group.id === groupId ? { ...group, ...patch } : group,
      ),
    )
  }

  const toggleGroup = (groupId: string) => {
    const willExpand = !expandedGroupIds.has(groupId)
    setExpandedGroupIds((current) => {
      const next = new Set(current)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
    if (willExpand) {
      const group = draft.groups.find((g) => g.id === groupId)
      if (group) {
        setExpandedRubroIds((current) => {
          const next = new Set(current)
          for (const rubro of group.rubros) {
            if (rubro.tasks.length > 0) {
              next.add(rubroKey(groupId, rubro.id))
            }
          }
          return next
        })
      }
    }
  }

  const toggleRubro = (groupId: string, rubroId: string) => {
    const key = rubroKey(groupId, rubroId)
    setExpandedRubroIds((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const reorderTasksInRubro = (groupId: string, rubroId: string, event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const group = draft.groups.find((g) => g.id === groupId)
    const rubro = group?.rubros.find((r) => r.id === rubroId)
    if (!rubro) return
    const oldIndex = rubro.tasks.findIndex((t) => t.id === active.id)
    const newIndex = rubro.tasks.findIndex((t) => t.id === over.id)
    updateRubroInGroup(groupId, rubroId, { tasks: arrayMove(rubro.tasks, oldIndex, newIndex) })
  }

  const addGroup = () => {
    const name = newGroupName.trim()
    if (!name) return
    const group = createRubroGroup(name)
    setGroups([...draft.groups, group])
    setNewGroupName("")
    setExpandedGroupIds((current) => new Set(current).add(group.id))
    markAsNew(group.id)
  }

  const removeGroup = (groupId: string) => {
    setGroups(draft.groups.filter((group) => group.id !== groupId))
    setExpandedGroupIds((current) => {
      const next = new Set(current)
      next.delete(groupId)
      return next
    })
    setExpandedRubroIds((current) => {
      const next = new Set(current)
      for (const key of next) {
        if (key.startsWith(`${groupId}:`)) next.delete(key)
      }
      return next
    })
  }

  const addRubroToGroup = (groupId: string) => {
    const group = draft.groups.find((g) => g.id === groupId)
    if (!group) return
    const rubro = createDefaultRubroItem()
    rubro.name = "Nuevo rubro"
    updateGroup(groupId, {
      rubros: [...group.rubros, rubro],
      ...clearGroupSeed(group),
    })
    setExpandedRubroIds((current) =>
      new Set(current).add(rubroKey(groupId, rubro.id)),
    )
    markAsNew(rubro.id)
  }

  const updateRubroInGroup = (
    groupId: string,
    rubroId: string,
    patch: Partial<RubroItemDraft>,
  ) => {
    const group = draft.groups.find((g) => g.id === groupId)
    if (!group) return
    updateGroup(groupId, {
      rubros: group.rubros.map((rubro) =>
        rubro.id === rubroId ? { ...rubro, ...patch } : rubro,
      ),
      ...clearGroupSeed(group),
    })
  }

  const removeRubroFromGroup = (groupId: string, rubroId: string) => {
    const group = draft.groups.find((g) => g.id === groupId)
    if (!group) return
    updateGroup(groupId, {
      rubros: group.rubros.filter((rubro) => rubro.id !== rubroId),
      ...clearGroupSeed(group),
    })
    setExpandedRubroIds((current) => {
      const next = new Set(current)
      next.delete(rubroKey(groupId, rubroId))
      return next
    })
  }

  const addTaskToRubro = (groupId: string, rubroId: string) => {
    const group = draft.groups.find((g) => g.id === groupId)
    const rubro = group?.rubros.find((r) => r.id === rubroId)
    if (!group || !rubro) return
    const task = createDefaultRubroTask()
    task.name = "Nueva tarea"
    updateRubroInGroup(groupId, rubroId, {
      tasks: [...rubro.tasks, task],
    })
    setExpandedRubroIds((current) =>
      new Set(current).add(rubroKey(groupId, rubroId)),
    )
    markAsNew(task.id)
  }

  const updateTaskInRubro = (
    groupId: string,
    rubroId: string,
    taskId: string,
    patch: Partial<RubroTaskDraft>,
  ) => {
    const group = draft.groups.find((g) => g.id === groupId)
    const rubro = group?.rubros.find((r) => r.id === rubroId)
    if (!rubro) return
    updateRubroInGroup(groupId, rubroId, {
      tasks: rubro.tasks.map((task) =>
        task.id === taskId ? { ...task, ...patch } : task,
      ),
    })
  }

  const removeTaskFromRubro = (
    groupId: string,
    rubroId: string,
    taskId: string,
  ) => {
    const group = draft.groups.find((g) => g.id === groupId)
    const rubro = group?.rubros.find((r) => r.id === rubroId)
    if (!rubro) return
    updateRubroInGroup(groupId, rubroId, {
      tasks: rubro.tasks.filter((task) => task.id !== taskId),
    })
  }

  const requestRemoveGroup = (groupId: string) => {
    setPendingDelete({ kind: "group", groupId })
  }

  const requestRemoveRubro = (groupId: string, rubroId: string) => {
    setPendingDelete({ kind: "rubro", groupId, rubroId })
  }

  const requestRemoveTask = (groupId: string, rubroId: string, taskId: string) => {
    setPendingDelete({ kind: "task", groupId, rubroId, taskId })
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return

    cancelEditing()

    switch (pendingDelete.kind) {
      case "group":
        removeGroup(pendingDelete.groupId)
        break
      case "rubro":
        removeRubroFromGroup(pendingDelete.groupId, pendingDelete.rubroId)
        break
      case "task":
        removeTaskFromRubro(
          pendingDelete.groupId,
          pendingDelete.rubroId,
          pendingDelete.taskId,
        )
        break
    }

    setPendingDelete(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-[14px] leading-[1.4] text-[#18191b]">
          Los rubros están organizados en grupos jerárquicos. Podés agregar, eliminar o editar
          grupos, rubros y tareas, además de configurar el porcentaje de incidencia que cada rubro
          tendrá en el avance general de la obra.
        </p>
        <button
          type="button"
          onClick={() => setProgressHelpOpen(true)}
          className="w-fit text-left text-[14px] font-medium leading-[1.4] text-[#113264] transition-opacity hover:opacity-80"
        >
          ¿Cómo se calcula el avance de la obra?
        </button>
      </div>

      <RubroProgressHelpModal open={progressHelpOpen} onOpenChange={setProgressHelpOpen} />

      <ConfirmActionDialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={RUBRO_STRUCTURE_DELETE_CONFIRM.title}
        description={RUBRO_STRUCTURE_DELETE_CONFIRM.description}
        confirmLabel={RUBRO_STRUCTURE_DELETE_CONFIRM.confirmLabel}
        onConfirm={handleConfirmDelete}
      />

      {draft.workStage === "in_execution" ? <InExecutionTasksCallout /> : null}

      {manualWeightOverLimit ? (
        <div
          className="flex items-start gap-2 rounded-lg border border-[#f3aeb5] bg-[#fff7f7] px-4 py-3"
          role="alert"
        >
          <span className="mt-0.5 size-2 shrink-0 rounded-full bg-[#ce2c31]" aria-hidden />
          <p className="text-[12px] leading-[1.4] tracking-[-0.36px] text-[#ce2c31]">
            {RUBRO_WEIGHT_OVER_LIMIT_MESSAGE}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <Input
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addGroup()
            }
          }}
          placeholder="Agregar nuevo grupo de rubros..."
          className={createProjectInputClassName}
          style={createProjectInputStyle}
        />
        <Button
          type="button"
          variant="brand"
          size="brand"
          onClick={addGroup}
          disabled={!newGroupName.trim()}
          className="w-full shrink-0 text-[14px] font-normal leading-5 disabled:opacity-50 sm:w-auto"
        >
          <Plus className="size-4" aria-hidden />
          Agregar grupo
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {draft.groups.map((group, groupIndex) => {
          const stats = getGroupDisplayStats(group)
          const isGroupExpanded = expandedGroupIds.has(group.id)
          const groupNumber = groupIndex + 1

          return (
            <div
              key={group.id}
              data-new-item-id={group.id}
              className={cn(
                "rounded-[10px] border",
                newItemHighlightClass(isHighlighted(group.id)),
              )}
              style={{
                borderColor: isGroupExpanded
                  ? RUBRO_STRUCTURE_COLORS.borderActive
                  : RUBRO_STRUCTURE_COLORS.borderRest,
                boxShadow: isGroupExpanded ? RUBRO_STRUCTURE_SHADOW : undefined,
                backgroundColor: isGroupExpanded
                  ? RUBRO_STRUCTURE_COLORS.groupCanvas
                  : RUBRO_STRUCTURE_COLORS.groupHeaderRest,
              }}
            >
              <div
                className={`flex min-h-[62px] w-full items-center gap-3 px-3 py-3 ${
                  isGroupExpanded ? "rounded-t-[10px] border-b" : "rounded-[10px]"
                }`}
                style={{
                  backgroundColor: isGroupExpanded
                    ? RUBRO_STRUCTURE_COLORS.groupHeaderOpen
                    : RUBRO_STRUCTURE_COLORS.groupHeaderRest,
                  borderColor: isGroupExpanded
                    ? RUBRO_STRUCTURE_COLORS.borderActive
                    : undefined,
                }}
              >
                {editingId === group.id ? (
                  <>
                    <InlineEditInput
                      autoFocus
                      value={editingName}
                      onChange={setEditingName}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEditingGroup(group.id)
                        if (e.key === "Escape") cancelEditing()
                      }}
                      className="min-w-0 w-full flex-1 basis-0"
                      aria-label="Nombre del grupo"
                    />
                    <RowSaveCancelActions
                      onSave={() => saveEditingGroup(group.id)}
                      onCancel={cancelEditing}
                    />
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className="inline-flex shrink-0 items-center justify-center"
                      aria-expanded={isGroupExpanded}
                      aria-label={isGroupExpanded ? "Colapsar grupo" : "Expandir grupo"}
                    >
                      <ExpandToggleIcon expanded={isGroupExpanded} />
                    </button>

                    <span
                      className="flex size-7 shrink-0 items-center justify-center rounded-[10px] text-[14px] font-normal leading-5 text-white"
                      style={{ backgroundColor: "#ff7433" }}
                    >
                      {groupNumber}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span
                        className="block truncate text-[14px] font-medium leading-5"
                        style={{ color: "#18191b" }}
                      >
                        {group.name}
                      </span>
                      <span
                        className="mt-0.5 block text-[12px] leading-4"
                        style={{ color: "#43484e" }}
                      >
                        {stats.rubros} {stats.rubros === 1 ? "rubro" : "rubros"} •{" "}
                        {stats.tareas} {stats.tareas === 1 ? "tarea" : "tareas"}
                      </span>
                    </button>

                    <RowEditDeleteActions
                      onEdit={() => startEditingGroup(group.id, group.name)}
                      onDelete={() => requestRemoveGroup(group.id)}
                      editLabel={`Editar ${group.name}`}
                      deleteLabel={`Eliminar ${group.name}`}
                    />
                  </>
                )}
              </div>

              <AnimatedCollapsible open={isGroupExpanded}>
                <div
                  className="space-y-2 rounded-b-[10px] px-3 py-3"
                  style={{ backgroundColor: RUBRO_STRUCTURE_COLORS.groupCanvas }}
                >
                  {group.rubros.map((rubro, rubroIndex) => {
                    const rubroNumber = `${groupNumber}.${rubroIndex + 1}`
                    const isRubroExpanded = expandedRubroIds.has(
                      rubroKey(group.id, rubro.id),
                    )
                    const taskCount = rubro.tasks.length

                    const isEditingRubroName = editingId === `rubro-${rubro.id}`
                    const isEditingRubroWeight = editingWeightRubroId === rubro.id

                    return (
                      <div
                        key={rubro.id}
                        data-new-item-id={rubro.id}
                        className={cn(
                          rubroRowStyles.card,
                          isRubroExpanded
                            ? rubroRowStyles.cardActive
                            : rubroRowStyles.cardRest,
                          newItemHighlightClass(isHighlighted(rubro.id)),
                        )}
                      >
                        <div
                          className={cn(
                            rubroRowStyles.header,
                            isRubroExpanded
                              ? rubroRowStyles.headerExpanded
                              : rubroRowStyles.headerCollapsed,
                          )}
                        >
                          {isEditingRubroName ? (
                            <>
                              <InlineEditInput
                                autoFocus
                                value={editingName}
                                onChange={setEditingName}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEditingRubro(group.id, rubro.id)
                                  if (e.key === "Escape") cancelEditing()
                                }}
                                className="h-auto min-w-0 flex-1 rounded-[12px] border-[#ff7433] px-[9px] py-[5px] focus-within:ring-0"
                                inputClassName="px-0 text-[14px] leading-[1.4]"
                                aria-label="Nombre del rubro"
                              />
                              <div className={rubroRowStyles.rightCluster}>
                                <RubroIncidenceEditor
                                  weightPercent={editingWeightPercent}
                                  weightAuto={editingWeightAuto}
                                  allRubros={getEditingRubroWeightPreview(rubro.id)}
                                  rubroId={rubro.id}
                                  {...buildRubroWeightChangeHandlers(group.id, rubro.id)}
                                  hasWeightError={
                                    !editingWeightAuto &&
                                    isManualRubroWeightOverLimit(
                                      getEditingRubroWeightPreview(rubro.id),
                                    )
                                  }
                                />
                                <RowSaveCancelActions
                                  onSave={() => saveEditingRubro(group.id, rubro.id)}
                                  onCancel={cancelEditing}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className={rubroRowStyles.leftCluster}>
                                <button
                                  type="button"
                                  onClick={() => toggleRubro(group.id, rubro.id)}
                                  className="inline-flex shrink-0 items-center justify-center"
                                  aria-expanded={isRubroExpanded}
                                  aria-label={isRubroExpanded ? "Colapsar rubro" : "Expandir rubro"}
                                >
                                  <ExpandToggleIcon expanded={isRubroExpanded} />
                                </button>

                                <span className={rubroRowStyles.indexBadge}>{rubroNumber}</span>

                                <div className={rubroRowStyles.titleGroup}>
                                  <button
                                    type="button"
                                    onClick={() => toggleRubro(group.id, rubro.id)}
                                    className={rubroRowStyles.title}
                                  >
                                    {rubro.name.trim() || "Rubro sin nombre"}
                                  </button>

                                  <span className={rubroRowStyles.taskCount}>
                                    {taskCount} {taskCount === 1 ? "tarea" : "tareas"}
                                  </span>
                                </div>
                              </div>

                              <div className={rubroRowStyles.rightCluster}>
                                {isEditingRubroWeight ? (
                                  <RubroIncidenceEditor
                                    weightPercent={editingWeightPercent}
                                    weightAuto={editingWeightAuto}
                                    allRubros={getEditingRubroWeightPreview(rubro.id)}
                                    rubroId={rubro.id}
                                    autoFocusPercent={!editingWeightAuto}
                                    {...buildRubroWeightChangeHandlers(group.id, rubro.id)}
                                    onBlur={() => saveEditingRubroWeight(group.id, rubro.id)}
                                    hasWeightError={
                                      !editingWeightAuto &&
                                      isManualRubroWeightOverLimit(
                                        getEditingRubroWeightPreview(rubro.id),
                                      )
                                    }
                                  />
                                ) : (
                                  <RubroIncidenceBadge
                                    rubro={rubro}
                                    allRubros={rubrosForWeightDisplay}
                                    hasWeightError={
                                      manualWeightOverLimit && !isRubroWeightAuto(rubro)
                                    }
                                    onActivate={(mode) => startEditingRubroWeight(rubro, mode)}
                                  />
                                )}

                                <RowEditDeleteActions
                                  onEdit={() => {
                                    if (isEditingRubroWeight) {
                                      saveEditingRubroWeight(group.id, rubro.id)
                                    }
                                    startEditingRubro(rubro)
                                  }}
                                  onDelete={() => requestRemoveRubro(group.id, rubro.id)}
                                  editLabel={`Editar ${rubro.name}`}
                                  deleteLabel={`Eliminar ${rubro.name}`}
                                />
                              </div>
                            </>
                          )}
                        </div>

                        <AnimatedCollapsible open={isRubroExpanded}>
                          <div className={rubroRowStyles.tasksBody}>
                            {rubro.tasks.length > 0 ? (
                              <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={(e) => reorderTasksInRubro(group.id, rubro.id, e)}
                              >
                                <SortableContext
                                  items={rubro.tasks.map((t) => t.id)}
                                  strategy={verticalListSortingStrategy}
                                >
                                  <div className="flex flex-col gap-1">
                                    {rubro.tasks.map((task, taskIndex) => (
                                      <SortableTaskItem
                                        key={task.id}
                                        task={task}
                                        index={taskIndex}
                                        rubroNumber={rubroNumber}
                                        groupId={group.id}
                                        rubroId={rubro.id}
                                        isEditing={editingId === task.id}
                                        editingName={editingName}
                                        onStartEditing={startEditingTask}
                                        onSaveEditing={saveEditingTask}
                                        onCancelEditing={cancelEditing}
                                        onUpdateName={setEditingName}
                                        onRemove={requestRemoveTask}
                                        isHighlighted={isHighlighted(task.id)}
                                      />
                                    ))}
                                  </div>
                                </SortableContext>
                              </DndContext>
                            ) : null}

                            <DashedAddButton
                              label="Agregar Tarea"
                              onClick={() => addTaskToRubro(group.id, rubro.id)}
                            />
                          </div>
                        </AnimatedCollapsible>
                      </div>
                    )
                  })}

                  <DashedAddButton
                    label="Agregar Rubro"
                    onClick={() => addRubroToGroup(group.id)}
                  />
                </div>
              </AnimatedCollapsible>
            </div>
          )
        })}
      </div>
    </div>
  )
}
