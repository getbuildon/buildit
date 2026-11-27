"use client"

/* Paso de rubros y tareas (lo usan Crear obra y Configuración). Armado con la librería:
   grupos de rubros que se abren y cierran, rubros con su incidencia y tareas que se
   reordenan arrastrando. */

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
import { Check, ChevronDown, GripVertical, Plus, SquarePen, Trash2, X } from "lucide-react"
import { Button } from "@/library/atoms/button/Button"
import { IconButton } from "@/library/atoms/button/IconButton"
import { Icon } from "@/library/atoms/icon/Icon"
import { Input } from "@/library/atoms/input/Input"
import { Link } from "@/library/atoms/link/Link"
import { formatPercent } from "@/library/foundations/format/format"
import { cn } from "@/library/lib/cn"
import { ConfirmDialog } from "@/library/molecules/confirm-dialog/ConfirmDialog"
import { Dialog, DialogContent } from "@/library/molecules/dialog/Dialog"
import { Notice } from "@/library/molecules/notice/Notice"
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
  finalizeManualRubroWeightPercent,
  getAllRubrosFromGroups,
  getManualRubroWeightTotal,
  getRubroEffectiveWeightValue,
  isManualRubroWeightOverLimit,
  isRubroWeightAuto,
} from "@/lib/projects/rubroWeights"
import {
  newItemHighlightClass,
  useNewItemHighlight,
} from "@/components/projects/new/useNewItemHighlight"
import {
  EditorDeIncidencia,
  InsigniaDeIncidencia,
  validarIncidencia,
} from "@/components/projects/new/steps/rubros/ControlDeIncidencia"

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

type CreateProjectTasksStepProps = {
  draft: CreateProjectDraft
  onChange: (patch: Partial<CreateProjectDraft>) => void
}

function rubroKey(groupId: string, rubroId: string) {
  return `${groupId}:${rubroId}`
}

function plural(cantidad: number, singular: string, varios: string) {
  return `${cantidad} ${cantidad === 1 ? singular : varios}`
}

/** Flecha de abrir/cerrar: apunta abajo si está abierto. */
function FlechaDeExpandir({ abierto }: { abierto: boolean }) {
  return (
    <Icon
      icon={ChevronDown}
      className={cn(
        "text-ink-muted transition-transform duration-(--duration-base)",
        !abierto && "-rotate-90",
      )}
    />
  )
}

function AccionesEditarBorrar({
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
    <span className="flex shrink-0 items-center gap-related">
      <IconButton icon={SquarePen} label={editLabel} size="compact" onClick={onEdit} />
      <IconButton icon={Trash2} label={deleteLabel} size="compact" onClick={onDelete} />
    </span>
  )
}

/** Nombre en edición: Enter guarda, Escape cancela. */
function NombreEnEdicion({
  value,
  onChange,
  onSave,
  onCancel,
  label,
}: {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  label: string
}) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-related">
      <Input
        autoFocus
        size="compact"
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onSave()
          if (event.key === "Escape") onCancel()
        }}
        className="min-w-0 flex-1"
      />
      <IconButton icon={Check} label="Guardar" size="compact" onClick={onSave} />
      <IconButton icon={X} label="Cancelar" size="compact" onClick={onCancel} />
    </span>
  )
}

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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })
  const nombre = task.name.trim() || "Tarea sin nombre"

  return (
    <li
      ref={setNodeRef}
      data-new-item-id={task.id}
      // Solo la posición mientras se arrastra: es lo único que no puede ser una clase.
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex min-h-10 items-center gap-compact rounded-compact bg-canvas-sunken px-compact",
        isDragging && "opacity-50",
        newItemHighlightClass(isHighlighted),
      )}
    >
      {isEditing ? (
        <NombreEnEdicion
          value={editingName}
          onChange={onUpdateName}
          onSave={() => onSaveEditing(groupId, rubroId, task.id)}
          onCancel={onCancelEditing}
          label="Nombre de la tarea"
        />
      ) : (
        <>
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="focus-ring grid size-6 shrink-0 cursor-grab touch-none place-items-center rounded-compact text-ink-subtle active:cursor-grabbing"
            aria-label={`Arrastrar para reordenar ${nombre}`}
          >
            <Icon icon={GripVertical} size="xs" />
          </button>
          <span className="shrink-0 text-meta text-ink-muted tabular-nums">
            {rubroNumber}.{index + 1}
          </span>
          <span className="min-w-0 flex-1 truncate text-body">{nombre}</span>
          <AccionesEditarBorrar
            onEdit={() => onStartEditing(task.id, task.name)}
            onDelete={() => onRemove(groupId, rubroId, task.id)}
            editLabel={`Editar la tarea ${nombre}`}
            deleteLabel={`Eliminar la tarea ${nombre}`}
          />
        </>
      )}
    </li>
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
      const fieldError = validarIncidencia(editingWeightAuto, editingWeightPercent)
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
    onPorcentajeChange: (value: string) => {
      setEditingWeightPercent(value)
      syncEditingRubroWeightDraft(groupId, rubroId, false, value)
    },
    onAutoChange: (auto: boolean) => {
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
      const fieldError = validarIncidencia(editingWeightAuto, editingWeightPercent)
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

  // Al tocar los rubros de un grupo, deja de usar los conteos de la plantilla.
  const clearGroupSeed = (): Partial<RubroGroupDraft> => ({
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
      ...clearGroupSeed(),
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
      ...clearGroupSeed(),
    })
  }

  const removeRubroFromGroup = (groupId: string, rubroId: string) => {
    const group = draft.groups.find((g) => g.id === groupId)
    if (!group) return
    updateGroup(groupId, {
      rubros: group.rubros.filter((rubro) => rubro.id !== rubroId),
      ...clearGroupSeed(),
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
    <div className="flex flex-col gap-group">
      <div className="flex flex-col gap-related">
        <p className="text-body text-ink-muted">
          Los rubros están organizados en grupos jerárquicos. Podés agregar, eliminar o editar
          grupos, rubros y tareas, además de configurar el porcentaje de incidencia que cada rubro
          tendrá en el avance general de la obra.
        </p>
        <Link asChild className="self-start">
          <button type="button" className="cursor-pointer text-left text-label" onClick={() => setProgressHelpOpen(true)}>
            ¿Cómo se calcula el avance de la obra?
          </button>
        </Link>
      </div>

      <Dialog open={progressHelpOpen} onOpenChange={setProgressHelpOpen}>
        <DialogContent title="Cómo se calcula el avance de la obra" size="wide">
          <div className="flex flex-col gap-snug text-body">
            <p>
              Cada rubro aporta un porcentaje al avance general de la obra. Por defecto, los
              tres rubros de estructura representan el 30% del avance total, ya que suelen
              concentrar la mayor parte del progreso en una obra tradicional. El resto del
              porcentaje se distribuye automáticamente entre los demás rubros.
            </p>
            <p>Podés modificar estos valores si tu proyecto requiere una distribución diferente.</p>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={RUBRO_STRUCTURE_DELETE_CONFIRM.title}
        description={RUBRO_STRUCTURE_DELETE_CONFIRM.description}
        confirmLabel={RUBRO_STRUCTURE_DELETE_CONFIRM.confirmLabel}
        onConfirm={handleConfirmDelete}
      />

      {draft.workStage === "in_execution" ? (
        <Notice tone="info">
          No te preocupes por el estado de avance actual. En un siguiente paso vas a poder
          indicar qué rubros ya están completados o en proceso.
        </Notice>
      ) : null}

      {manualWeightOverLimit ? (
        <Notice tone="danger" title="La suma de los porcentajes manuales supera el 100%">
          Hoy suman {formatPercent(getManualRubroWeightTotal(rubrosForWeightDisplay), 1)}.
          Ajustá los valores para que el total no pase del 100%.
        </Notice>
      ) : null}

      <div className="flex flex-col gap-compact sm:flex-row">
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
          aria-label="Nuevo grupo de rubros"
          className="flex-1"
        />
        <Button type="button" onClick={addGroup} disabled={!newGroupName.trim()}>
          <Icon icon={Plus} /> Agregar grupo
        </Button>
      </div>

      <ol className="flex flex-col gap-compact">
        {draft.groups.map((group, groupIndex) => {
          const stats = getGroupDisplayStats(group)
          const isGroupExpanded = expandedGroupIds.has(group.id)
          const groupNumber = groupIndex + 1
          const contenidoGrupoId = `grupo-${group.id}-rubros`

          return (
            <li
              key={group.id}
              data-new-item-id={group.id}
              className={cn(
                "overflow-hidden rounded-control border bg-canvas-raised",
                isGroupExpanded ? "border-line-strong shadow-hint" : "border-line",
                newItemHighlightClass(isHighlighted(group.id)),
              )}
            >
              <div
                className={cn(
                  "flex min-h-15.5 items-center gap-snug px-group",
                  isGroupExpanded && "bg-action-soft",
                )}
              >
                {editingId === group.id ? (
                  <NombreEnEdicion
                    value={editingName}
                    onChange={setEditingName}
                    onSave={() => saveEditingGroup(group.id)}
                    onCancel={cancelEditing}
                    label="Nombre del grupo"
                  />
                ) : (
                  <>
                    <button
                      type="button"
                      aria-expanded={isGroupExpanded}
                      aria-controls={contenidoGrupoId}
                      onClick={() => toggleGroup(group.id)}
                      className="focus-ring flex min-w-0 flex-1 cursor-pointer items-center gap-snug rounded-box py-compact text-left"
                    >
                      <FlechaDeExpandir abierto={isGroupExpanded} />
                      <span className="grid size-7 shrink-0 place-items-center rounded-control bg-action text-label text-action-ink">
                        {groupNumber}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-label">{group.name}</span>
                        <span className="text-meta text-ink-muted">
                          {plural(stats.rubros, "rubro", "rubros")} •{" "}
                          {plural(stats.tareas, "tarea", "tareas")}
                        </span>
                      </span>
                    </button>
                    <AccionesEditarBorrar
                      onEdit={() => startEditingGroup(group.id, group.name)}
                      onDelete={() => requestRemoveGroup(group.id)}
                      editLabel={`Editar el grupo ${group.name}`}
                      deleteLabel={`Eliminar el grupo ${group.name}`}
                    />
                  </>
                )}
              </div>

              {isGroupExpanded ? (
                <div
                  id={contenidoGrupoId}
                  className="flex flex-col gap-compact border-t border-line p-snug"
                >
                  {group.rubros.map((rubro, rubroIndex) => {
                    const rubroNumber = `${groupNumber}.${rubroIndex + 1}`
                    const isRubroExpanded = expandedRubroIds.has(
                      rubroKey(group.id, rubro.id),
                    )
                    const taskCount = rubro.tasks.length
                    const nombreRubro = rubro.name.trim() || "Rubro sin nombre"
                    const contenidoRubroId = `rubro-${group.id}-${rubro.id}-tareas`

                    const isEditingRubroName = editingId === `rubro-${rubro.id}`
                    const isEditingRubroWeight = editingWeightRubroId === rubro.id
                    const editingWeightError =
                      !editingWeightAuto &&
                      isManualRubroWeightOverLimit(getEditingRubroWeightPreview(rubro.id))

                    return (
                      <div
                        key={rubro.id}
                        data-new-item-id={rubro.id}
                        className={cn(
                          "rounded-control border bg-canvas",
                          isRubroExpanded ? "border-line-strong" : "border-line",
                          newItemHighlightClass(isHighlighted(rubro.id)),
                        )}
                      >
                        <div className="flex flex-col gap-compact px-snug py-compact lg:flex-row lg:items-center">
                          {isEditingRubroName ? (
                            <>
                              <NombreEnEdicion
                                value={editingName}
                                onChange={setEditingName}
                                onSave={() => saveEditingRubro(group.id, rubro.id)}
                                onCancel={cancelEditing}
                                label="Nombre del rubro"
                              />
                              <EditorDeIncidencia
                                nombreRubro={nombreRubro}
                                porcentaje={editingWeightPercent}
                                auto={editingWeightAuto}
                                todosLosRubros={getEditingRubroWeightPreview(rubro.id)}
                                rubroId={rubro.id}
                                {...buildRubroWeightChangeHandlers(group.id, rubro.id)}
                                conError={editingWeightError}
                              />
                            </>
                          ) : (
                            <>
                              <span className="flex min-w-0 flex-1 items-center gap-compact">
                                <button
                                  type="button"
                                  aria-expanded={isRubroExpanded}
                                  aria-controls={contenidoRubroId}
                                  onClick={() => toggleRubro(group.id, rubro.id)}
                                  className="focus-ring flex min-w-0 flex-1 cursor-pointer items-center gap-compact rounded-box py-related text-left"
                                >
                                  <FlechaDeExpandir abierto={isRubroExpanded} />
                                  <span className="shrink-0 rounded-compact bg-action-soft px-1.5 text-meta font-medium text-action-text tabular-nums">
                                    {rubroNumber}
                                  </span>
                                  <span className="min-w-0 truncate text-label">{nombreRubro}</span>
                                  <span className="shrink-0 text-meta text-ink-muted">
                                    | {plural(taskCount, "tarea", "tareas")}
                                  </span>
                                </button>
                              </span>

                              <span className="flex shrink-0 flex-wrap items-center gap-compact">
                                {isEditingRubroWeight ? (
                                  <EditorDeIncidencia
                                    nombreRubro={nombreRubro}
                                    porcentaje={editingWeightPercent}
                                    auto={editingWeightAuto}
                                    todosLosRubros={getEditingRubroWeightPreview(rubro.id)}
                                    rubroId={rubro.id}
                                    enfocarAlAbrir={!editingWeightAuto}
                                    {...buildRubroWeightChangeHandlers(group.id, rubro.id)}
                                    onSalir={() => saveEditingRubroWeight(group.id, rubro.id)}
                                    conError={editingWeightError}
                                  />
                                ) : (
                                  <InsigniaDeIncidencia
                                    rubro={rubro}
                                    todosLosRubros={rubrosForWeightDisplay}
                                    conError={manualWeightOverLimit && !isRubroWeightAuto(rubro)}
                                    onActivar={(mode) => startEditingRubroWeight(rubro, mode)}
                                  />
                                )}

                                <AccionesEditarBorrar
                                  onEdit={() => {
                                    if (isEditingRubroWeight) {
                                      saveEditingRubroWeight(group.id, rubro.id)
                                    }
                                    startEditingRubro(rubro)
                                  }}
                                  onDelete={() => requestRemoveRubro(group.id, rubro.id)}
                                  editLabel={`Editar el rubro ${nombreRubro}`}
                                  deleteLabel={`Eliminar el rubro ${nombreRubro}`}
                                />
                              </span>
                            </>
                          )}
                        </div>

                        {isRubroExpanded ? (
                          <div id={contenidoRubroId} className="flex flex-col gap-related px-snug pb-snug">
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
                                  <ul className="flex flex-col gap-related">
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
                                  </ul>
                                </SortableContext>
                              </DndContext>
                            ) : null}

                            <Button
                              type="button"
                              variant="ghost"
                              size="compact"
                              className="self-start"
                              onClick={() => addTaskToRubro(group.id, rubro.id)}
                            >
                              <Icon icon={Plus} size="xs" /> Agregar tarea
                              <span className="sr-only"> a {nombreRubro}</span>
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    size="compact"
                    className="self-start border-dashed"
                    onClick={() => addRubroToGroup(group.id)}
                  >
                    <Icon icon={Plus} size="xs" /> Agregar rubro
                    <span className="sr-only"> a {group.name}</span>
                  </Button>
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
