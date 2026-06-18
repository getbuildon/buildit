"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  SquarePen,
  Trash2,
  Wrench,
} from "lucide-react"
import { Input } from "@/components/ui/input"
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

type CreateProjectTasksStepProps = {
  draft: CreateProjectDraft
  onChange: (patch: Partial<CreateProjectDraft>) => void
}

function rubroKey(groupId: string, rubroId: string) {
  return `${groupId}:${rubroId}`
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

export function CreateProjectTasksStep({
  draft,
  onChange,
}: CreateProjectTasksStepProps) {
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

  const setGroups = (groups: RubroGroupDraft[]) => {
    onChange({ groups })
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

  const addGroup = () => {
    const name = newGroupName.trim()
    if (!name) return
    const group = createRubroGroup(name)
    setGroups([...draft.groups, group])
    setNewGroupName("")
    setExpandedGroupIds((current) => new Set(current).add(group.id))
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

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[14px] leading-5" style={{ color: "#18191b" }}>
        Los rubros están organizados en grupos jerárquicos. Puedes agregar,
        eliminar o editar grupos, rubros y tareas según las necesidades de tu
        obra.
      </p>

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
          className="shrink-0 text-[14px] font-normal leading-5 disabled:opacity-50"
        >
          <Plus className="size-4" aria-hidden />
          Agregar grupo
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {draft.groups.map((group, groupIndex) => {
          const stats = getGroupDisplayStats(group)
          const isGroupExpanded = expandedGroupIds.has(group.id)
          const groupNumber = groupIndex + 1

          return (
            <div
              key={group.id}
              className="overflow-hidden rounded-[10px] border border-[#e2e8f0]"
            >
              <div
                className="flex items-center gap-3 px-3 py-3"
                style={{ backgroundColor: "#fff6f1" }}
              >
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-[10px] text-[14px] font-normal leading-5 text-white"
                  style={{ backgroundColor: "#ff7433" }}
                >
                  {groupNumber}
                </span>

                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  aria-expanded={isGroupExpanded}
                >
                  <span className="min-w-0 flex-1">
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
                  </span>
                  {isGroupExpanded ? (
                    <ChevronDown
                      className="size-5 shrink-0 text-[#111113]"
                      aria-hidden
                    />
                  ) : (
                    <ChevronRight
                      className="size-5 shrink-0 text-[#111113]"
                      aria-hidden
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => removeGroup(group.id)}
                  className="inline-flex size-6 shrink-0 items-center justify-center text-[#dc3e42] transition-opacity hover:opacity-80"
                  aria-label={`Eliminar ${group.name}`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>

              {isGroupExpanded ? (
                <div className="space-y-2 bg-white px-3 py-3">
                  <DashedAddButton
                    label="Agregar Rubro"
                    onClick={() => addRubroToGroup(group.id)}
                  />

                  {group.rubros.map((rubro, rubroIndex) => {
                    const rubroNumber = `${groupNumber}.${rubroIndex + 1}`
                    const isRubroExpanded = expandedRubroIds.has(
                      rubroKey(group.id, rubro.id),
                    )
                    const taskCount = rubro.tasks.length

                    return (
                      <div
                        key={rubro.id}
                        className="overflow-hidden rounded-[10px] border border-[#ffeae0]"
                      >
                        <div
                          className="flex items-center gap-2 px-3 py-3"
                          style={{ backgroundColor: "#fefcfb" }}
                        >
                          <button
                            type="button"
                            onClick={() => toggleRubro(group.id, rubro.id)}
                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                            aria-expanded={isRubroExpanded}
                          >
                            <span
                              className="flex shrink-0 items-center justify-center rounded-[4px] px-2 py-0.5 text-[14px] font-normal leading-5"
                              style={{ backgroundColor: "#ffd7c2", color: "#d04c00" }}
                            >
                              {rubroNumber}
                            </span>
                            <Wrench
                              className="size-4 shrink-0 text-[#363a3f]"
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1">
                              <span
                                className="text-[16px] font-normal leading-6"
                                style={{ color: "#363a3f" }}
                              >
                                {rubro.name.trim() || "Rubro sin nombre"}
                              </span>
                              <span
                                className="ml-2 text-[12px] font-normal leading-4"
                                style={{ color: "#5a6169" }}
                              >
                                ({taskCount}{" "}
                                {taskCount === 1 ? "tarea" : "tareas"})
                              </span>
                            </span>
                            <SquarePen
                              className="size-4 shrink-0 text-[#777b84]"
                              aria-hidden
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeRubroFromGroup(group.id, rubro.id)}
                            className="inline-flex size-6 shrink-0 items-center justify-center text-[#ce2c31] transition-opacity hover:opacity-80"
                            aria-label={`Eliminar ${rubro.name}`}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </button>
                          {isRubroExpanded ? (
                            <button
                              type="button"
                              onClick={() => toggleRubro(group.id, rubro.id)}
                              className="shrink-0 text-[12px] font-medium leading-4 transition-opacity hover:opacity-80"
                              style={{ color: "#321a10" }}
                            >
                              Cerrar
                            </button>
                          ) : null}
                        </div>

                        {isRubroExpanded ? (
                          <div className="space-y-2 bg-white px-3 py-3">
                            <DashedAddButton
                              label="Agregar Tarea"
                              onClick={() => addTaskToRubro(group.id, rubro.id)}
                            />

                            {rubro.tasks.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {rubro.tasks.map((task, taskIndex) => (
                                  <div
                                    key={task.id}
                                    className="flex items-center gap-2 rounded-[4px] border border-[#edeef0] px-2 py-2"
                                    style={{ backgroundColor: "#f8fafc" }}
                                  >
                                    <GripVertical
                                      className="size-3.5 shrink-0 text-[#afb3ba]"
                                      aria-hidden
                                    />
                                    <span
                                      className="shrink-0 text-[12px] font-normal leading-4 tabular-nums"
                                      style={{ color: "#572d1c" }}
                                    >
                                      {rubroNumber}.{taskIndex + 1}
                                    </span>
                                    <Input
                                      value={task.name}
                                      onChange={(e) =>
                                        updateTaskInRubro(
                                          group.id,
                                          rubro.id,
                                          task.id,
                                          { name: e.target.value },
                                        )
                                      }
                                      className="h-7 min-w-0 flex-1 border-0 bg-transparent px-1 text-[14px] text-[#314158] shadow-none focus-visible:ring-0 dark:text-[#314158]"
                                    />
                                    <SquarePen
                                      className="size-4 shrink-0 text-[#696e77]"
                                      aria-hidden
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeTaskFromRubro(
                                          group.id,
                                          rubro.id,
                                          task.id,
                                        )
                                      }
                                      className="inline-flex size-6 shrink-0 items-center justify-center text-[#ce2c31] transition-opacity hover:opacity-80"
                                      aria-label="Eliminar tarea"
                                    >
                                      <Trash2 className="size-3.5" aria-hidden />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
