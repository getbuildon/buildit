"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import type {
  CreateProjectDraft,
  RubroItemDraft,
} from "@/lib/projects/createProjectDraft"
import { cn } from "@/lib/utils"

type Props = {
  draft: CreateProjectDraft
  onChange: (patch: Partial<CreateProjectDraft>) => void
}

type CheckboxState = "checked" | "unchecked" | "indeterminate"

type FlatRubro = {
  rubro: RubroItemDraft
  groupNumber: number
  rubroNumber: number
}

function getNamedRubroTasks(rubro: RubroItemDraft) {
  return rubro.tasks.filter((task) => task.name.trim())
}

function getFlatRubros(draft: CreateProjectDraft): FlatRubro[] {
  return draft.groups.flatMap((group, groupIndex) =>
    group.rubros.flatMap((rubro, rubroIndex) => {
      if (getNamedRubroTasks(rubro).length === 0) return []

      return [
        {
          rubro,
          groupNumber: groupIndex + 1,
          rubroNumber: rubroIndex + 1,
        },
      ]
    }),
  )
}

function isTaskIncluded(
  exclusions: Record<string, string[]>,
  unitId: string,
  taskId: string,
): boolean {
  return !exclusions[unitId]?.includes(taskId)
}

function getRubroCheckboxState(
  exclusions: Record<string, string[]>,
  unitId: string,
  rubro: RubroItemDraft,
): CheckboxState {
  const tasks = getNamedRubroTasks(rubro)
  if (tasks.length === 0) return "unchecked"
  const includedCount = tasks.filter((t) =>
    isTaskIncluded(exclusions, unitId, t.id),
  ).length
  if (includedCount === tasks.length) return "checked"
  if (includedCount === 0) return "unchecked"
  return "indeterminate"
}

function applyTaskToggle(
  exclusions: Record<string, string[]>,
  unitId: string,
  taskId: string,
  include: boolean,
): Record<string, string[]> {
  const current = exclusions[unitId] ?? []
  let next: string[]
  if (include) {
    next = current.filter((id) => id !== taskId)
  } else {
    next = current.includes(taskId) ? current : [...current, taskId]
  }
  if (next.length === 0) {
    const copy = { ...exclusions }
    delete copy[unitId]
    return copy
  }
  return { ...exclusions, [unitId]: next }
}

function applyRubroToggle(
  exclusions: Record<string, string[]>,
  unitId: string,
  rubro: RubroItemDraft,
  include: boolean,
): Record<string, string[]> {
  let result = exclusions
  for (const task of getNamedRubroTasks(rubro)) {
    result = applyTaskToggle(result, unitId, task.id, include)
  }
  return result
}

function UnitCheckbox({
  state,
  onToggle,
  disabled = false,
}: {
  state: CheckboxState
  onToggle: () => void
  disabled?: boolean
}) {
  const isActive = !disabled && (state === "checked" || state === "indeterminate")
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={disabled ? false : state === "indeterminate" ? "mixed" : state === "checked"}
      aria-disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onToggle()
      }}
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
        disabled
          ? "cursor-not-allowed border-[#d1d4d9] bg-[#f0f1f3]"
          : isActive
          ? "border-[#ff7433] bg-[#ff7433]"
          : "border-[#afb3ba] bg-white",
      )}
    >
      {!disabled && state === "checked" && (
        <svg width="11" height="8" viewBox="0 0 11 8" fill="none" aria-hidden>
          <path
            d="M1 4L4 7L10 1"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {!disabled && state === "indeterminate" && (
        <span className="h-0.5 w-2.5 rounded-full bg-white" />
      )}
    </button>
  )
}

export function CreateProjectUnitTasksStep({ draft, onChange }: Props) {
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(
    () => new Set(draft.floors.map((f) => f.id)),
  )
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(
    () => new Set(draft.floors.flatMap((f) => f.units.map((u) => u.id))),
  )
  const [expandedRubros, setExpandedRubros] = useState<Set<string>>(new Set())

  const flatRubros = getFlatRubros(draft)
  const exclusions = draft.unitTaskExclusions

  function toggleFloor(id: string) {
    setExpandedFloors((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleUnit(id: string) {
    setExpandedUnits((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleRubroExpanded(unitId: string, rubroId: string) {
    const key = `${unitId}::${rubroId}`
    setExpandedRubros((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function handleTaskToggle(unitId: string, taskId: string, currentlyIncluded: boolean) {
    onChange({
      unitTaskExclusions: applyTaskToggle(exclusions, unitId, taskId, !currentlyIncluded),
    })
  }

  function handleRubroToggle(unitId: string, rubro: RubroItemDraft, state: CheckboxState) {
    const include = state !== "checked"
    onChange({
      unitTaskExclusions: applyRubroToggle(exclusions, unitId, rubro, include),
    })
  }

  if (draft.floors.length === 0) {
    return (
      <p className="text-[14px] text-[#777b84]">
        No hay pisos definidos. Agregá pisos en el paso de estructura.
      </p>
    )
  }

  if (flatRubros.length === 0) {
    return (
      <p className="text-[14px] text-[#777b84]">
        No hay rubros definidos. Revisá el paso de Rubros y Tareas.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[14px] leading-[1.4] text-[#18191b]">
        Todos los rubros y tareas fueron asignadas automáticamente a todos los
        pisos y unidades funcionales. Revisá todas las unidades y quitá aquellos
        rubros o tareas que no le correspondan.
      </p>

      <div className="flex flex-col gap-0.5 overflow-hidden rounded-[8px]">
        {draft.floors.map((floor) => {
          const floorExpanded = expandedFloors.has(floor.id)

          return (
            <div
              key={floor.id}
              className="flex flex-col rounded-[4px] bg-[rgba(237,238,240,0.3)]"
            >
              {/* Floor header */}
              <button
                type="button"
                onClick={() => toggleFloor(floor.id)}
                className="flex items-center gap-2 px-3 py-2"
              >
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-[#272a2d] transition-transform duration-150",
                    !floorExpanded && "-rotate-90",
                  )}
                />
                <span className="text-[14px] font-medium leading-[1.4] text-[#272a2d]">
                  {floor.name}
                </span>
              </button>

              {/* Units */}
              {floorExpanded &&
                floor.units.map((unit, unitIndex) => {
                  const unitExpanded = expandedUnits.has(unit.id)
                  const unitLabel = `${unit.type} ${unitIndex + 1}`

                  return (
                    <div key={unit.id} className="flex flex-col">
                      {/* Unit header */}
                      <button
                        type="button"
                        onClick={() => toggleUnit(unit.id)}
                        className="flex items-center gap-2 px-4 py-1"
                      >
                        <ChevronDown
                          className={cn(
                            "size-4 shrink-0 text-[#272a2d] transition-transform duration-150",
                            !unitExpanded && "-rotate-90",
                          )}
                        />
                        <span className="min-w-0 flex-1 text-left text-[14px] font-medium leading-[1.4] text-[#272a2d]">
                          {unitLabel}
                        </span>
                      </button>

                      {/* Rubros */}
                      {unitExpanded &&
                        flatRubros.map(({ rubro, groupNumber, rubroNumber }) => {
                          const rubroKey = `${unit.id}::${rubro.id}`
                          const rubroExpanded = expandedRubros.has(rubroKey)
                          const rubroState = getRubroCheckboxState(
                            exclusions,
                            unit.id,
                            rubro,
                          )
                          const rubroPrefix = `${groupNumber}.${rubroNumber}`

                          return (
                            <div key={rubro.id}>
                              {/* Rubro row */}
                              <div className="flex items-center justify-between border-b-2 border-white pl-8 pr-3 py-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleRubroExpanded(unit.id, rubro.id)
                                  }
                                  className="flex min-w-0 flex-1 items-center gap-2"
                                >
                                  <ChevronDown
                                    className={cn(
                                      "size-4 shrink-0 text-[#272a2d] transition-transform duration-150",
                                      !rubroExpanded && "-rotate-90",
                                    )}
                                  />
                                  <span className="whitespace-nowrap text-[14px] font-medium leading-[1.4] text-[#272a2d]">
                                    {rubroPrefix}. {rubro.name}
                                  </span>
                                </button>
                                <UnitCheckbox
                                  state={rubroState}
                                  onToggle={() =>
                                    handleRubroToggle(unit.id, rubro, rubroState)
                                  }
                                />
                              </div>

                              {rubroExpanded &&
                                rubro.tasks
                                  .map((task, taskIndex) => ({ task, taskIndex }))
                                  .filter(({ task }) => task.name.trim())
                                  .map(({ task, taskIndex }) => {
                                  const included = isTaskIncluded(
                                    exclusions,
                                    unit.id,
                                    task.id,
                                  )
                                  return (
                                    <div
                                      key={task.id}
                                      className="flex items-center justify-between border-b-2 border-white pl-16 pr-3 py-1"
                                    >
                                      <span className="min-w-0 flex-1 text-[14px] leading-[1.4] text-[#272a2d]">
                                        {rubroPrefix}.{taskIndex + 1}.{" "}
                                        {task.name}
                                      </span>
                                      <UnitCheckbox
                                        state={included ? "checked" : "unchecked"}
                                        onToggle={() =>
                                          handleTaskToggle(
                                            unit.id,
                                            task.id,
                                            included,
                                          )
                                        }
                                      />
                                    </div>
                                  )
                                })}
                            </div>
                          )
                        })}
                    </div>
                  )
                })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
