"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import type {
  CreateProjectDraft,
  RubroItemDraft,
} from "@/lib/projects/createProjectDraft"
import { cn } from "@/lib/utils"
import { AnimatedCollapsible } from "@/components/ui/animated-collapsible"

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

function getAllFlatRubros(draft: CreateProjectDraft): FlatRubro[] {
  return draft.groups.flatMap((group, groupIndex) =>
    group.rubros.map((rubro, rubroIndex) => ({
      rubro,
      groupNumber: groupIndex + 1,
      rubroNumber: rubroIndex + 1,
    })),
  )
}

function getFlatRubros(draft: CreateProjectDraft): FlatRubro[] {
  return getAllFlatRubros(draft).filter(
    ({ rubro }) => getNamedRubroTasks(rubro).length > 0,
  )
}

function hasProjectRubros(draft: CreateProjectDraft): boolean {
  return draft.groups.some((group) => group.rubros.length > 0)
}

function getFloorDisabledReason(floor: CreateProjectDraft["floors"][number]): string | null {
  if (floor.units.length === 0) return "sin unidades funcionales"
  return null
}

function getUnitDisabledReason(draft: CreateProjectDraft): string | null {
  if (!hasProjectRubros(draft)) return "sin rubros"
  return null
}

function getRubroDisabledReason(rubro: RubroItemDraft): string | null {
  if (getNamedRubroTasks(rubro).length === 0) return "sin tareas"
  return null
}

function DisabledReasonSuffix({ reason }: { reason: string }) {
  return (
    <span className="font-normal text-[#777b84]">{` (${reason})`}</span>
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

export function CreateProjectUnitTasksStep({
  draft,
  onChange,
}: Props) {
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(
    () => new Set(draft.floors.map((f) => f.id)),
  )
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(
    () => new Set(draft.floors.flatMap((f) => f.units.map((u) => u.id))),
  )
  const [expandedRubros, setExpandedRubros] = useState<Set<string>>(new Set())

  const flatRubros = getFlatRubros(draft)
  const allFlatRubros = getAllFlatRubros(draft)
  const unitDisabledReason = getUnitDisabledReason(draft)
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

  const hasAssignableRubros = flatRubros.length > 0

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[14px] leading-[1.4] text-[#18191b]">
        {hasAssignableRubros
          ? "Todos los rubros y tareas fueron asignadas automáticamente a todos los pisos y unidades funcionales. Revisá todas las unidades y quitá aquellos rubros o tareas que no le correspondan."
          : "Completá la estructura del edificio y definí rubros con tareas para poder asignarlos por unidad."}
      </p>

      <div className="flex flex-col gap-0.5 rounded-[8px]">
        {draft.floors.map((floor) => {
          const floorDisabledReason = getFloorDisabledReason(floor)
          const floorDisabled = floorDisabledReason !== null
          const floorExpanded = !floorDisabled && expandedFloors.has(floor.id)

          return (
            <div
              key={floor.id}
              className={cn(
                "flex flex-col rounded-[4px] bg-[rgba(237,238,240,0.3)]",
                floorDisabled && "opacity-50",
              )}
            >
              {/* Floor header */}
              <button
                type="button"
                disabled={floorDisabled}
                onClick={() => toggleFloor(floor.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-left",
                  floorDisabled && "cursor-not-allowed",
                )}
              >
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-[#272a2d] transition-transform duration-300 ease-in-out",
                    !floorExpanded && "-rotate-90",
                    floorDisabled && "opacity-60",
                  )}
                />
                <span className="text-[14px] font-medium leading-[1.4] text-[#272a2d]">
                  {floor.name}
                  {floorDisabledReason ? (
                    <DisabledReasonSuffix reason={floorDisabledReason} />
                  ) : null}
                </span>
              </button>

              {/* Units */}
              <AnimatedCollapsible open={floorExpanded}>
                {floor.units.map((unit, unitIndex) => {
                  const unitDisabled = unitDisabledReason !== null
                  const unitExpanded =
                    !unitDisabled && expandedUnits.has(unit.id)
                  const unitLabel = `${unit.type} ${unitIndex + 1}`

                  return (
                    <div
                      key={unit.id}
                      className={cn("flex flex-col", unitDisabled && "opacity-50")}
                    >
                      {/* Unit header */}
                      <button
                        type="button"
                        disabled={unitDisabled}
                        onClick={() => toggleUnit(unit.id)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-1 text-left",
                          unitDisabled && "cursor-not-allowed",
                        )}
                      >
                        <ChevronDown
                          className={cn(
                            "size-4 shrink-0 text-[#272a2d] transition-transform duration-300 ease-in-out",
                            !unitExpanded && "-rotate-90",
                            unitDisabled && "opacity-60",
                          )}
                        />
                        <span className="min-w-0 flex-1 text-[14px] font-medium leading-[1.4] text-[#272a2d]">
                          {unitLabel}
                          {unitDisabledReason ? (
                            <DisabledReasonSuffix reason={unitDisabledReason} />
                          ) : null}
                        </span>
                      </button>

                      {/* Rubros */}
                      <AnimatedCollapsible open={unitExpanded}>
                        {allFlatRubros.map(({ rubro, groupNumber, rubroNumber }) => {
                          const rubroKey = `${unit.id}::${rubro.id}`
                          const rubroDisabledReason = getRubroDisabledReason(rubro)
                          const rubroDisabled = rubroDisabledReason !== null
                          const rubroExpanded =
                            !rubroDisabled && expandedRubros.has(rubroKey)
                          const rubroState = getRubroCheckboxState(
                            exclusions,
                            unit.id,
                            rubro,
                          )
                          const rubroPrefix = `${groupNumber}.${rubroNumber}`

                          return (
                            <div
                              key={rubro.id}
                              className={cn(rubroDisabled && "opacity-50")}
                            >
                              {/* Rubro row */}
                              <div className="flex items-center justify-between border-b-2 border-white pl-8 pr-3 py-1">
                                <button
                                  type="button"
                                  disabled={rubroDisabled}
                                  onClick={() =>
                                    toggleRubroExpanded(unit.id, rubro.id)
                                  }
                                  className={cn(
                                    "flex min-w-0 flex-1 items-center gap-2 text-left",
                                    rubroDisabled && "cursor-not-allowed",
                                  )}
                                >
                                  <ChevronDown
                                    className={cn(
                                      "size-4 shrink-0 text-[#272a2d] transition-transform duration-300 ease-in-out",
                                      !rubroExpanded && "-rotate-90",
                                      rubroDisabled && "opacity-60",
                                    )}
                                  />
                                  <span className="min-w-0 truncate text-[14px] font-medium leading-[1.4] text-[#272a2d]">
                                    {rubroPrefix}. {rubro.name}
                                    {rubroDisabledReason ? (
                                      <DisabledReasonSuffix reason={rubroDisabledReason} />
                                    ) : null}
                                  </span>
                                </button>
                                <UnitCheckbox
                                  state={rubroState}
                                  disabled={rubroDisabled}
                                  onToggle={() =>
                                    handleRubroToggle(unit.id, rubro, rubroState)
                                  }
                                />
                              </div>

                              <AnimatedCollapsible open={rubroExpanded}>
                                {rubro.tasks
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
                              </AnimatedCollapsible>
                            </div>
                          )
                        })}
                      </AnimatedCollapsible>
                    </div>
                  )
                })}
              </AnimatedCollapsible>
            </div>
          )
        })}
      </div>
    </div>
  )
}
