"use client"

import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { ChevronDown } from "lucide-react"
import type {
  CreateProjectDraft,
  RubroItemDraft,
} from "@/lib/projects/createProjectDraft"
import { Checkbox } from "@/library/atoms/checkbox/Checkbox"
import { Icon } from "@/library/atoms/icon/Icon"
import { cn } from "@/library/lib/cn"

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
  return <span className="font-normal text-ink-muted">{` (${reason})`}</span>
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

/** Pasa el estado propio de la casilla al formato de la casilla de la librería. */
function toCheckedValue(state: CheckboxState): boolean | "indeterminate" {
  if (state === "indeterminate") return "indeterminate"
  return state === "checked"
}

/* Botón que abre o cierra un nivel, una unidad o un rubro (con la flechita). */
function Disclosure({
  expanded,
  disabled = false,
  onToggle,
  className,
  children,
}: {
  expanded: boolean
  disabled?: boolean
  onToggle: () => void
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-expanded={disabled ? undefined : expanded}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "focus-ring flex min-h-10 min-w-0 flex-1 cursor-pointer items-center gap-compact rounded-box text-left text-body",
        disabled && "cursor-not-allowed",
        className,
      )}
    >
      <Icon
        icon={ChevronDown}
        size="xs"
        className={cn(
          "text-ink-muted transition-transform",
          !expanded && "-rotate-90",
        )}
      />
      {children}
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

  function toggleInSet(
    setter: Dispatch<SetStateAction<Set<string>>>,
    id: string,
  ) {
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
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
      <p className="text-body text-ink-muted">
        No hay niveles definidos. Agregá niveles en el paso de estructura.
      </p>
    )
  }

  const hasAssignableRubros = flatRubros.length > 0

  return (
    <div className="flex flex-col gap-snug">
      <p className="text-body text-ink-muted">
        {hasAssignableRubros
          ? "Todos los rubros y tareas fueron asignadas automáticamente a todos los niveles y unidades funcionales. Revisá todas las unidades y quitá aquellos rubros o tareas que no le correspondan."
          : "Completá la estructura del edificio y definí rubros con tareas para poder asignarlos por unidad."}
      </p>

      <ul className="flex flex-col gap-related">
        {draft.floors.map((floor) => {
          const floorDisabledReason = getFloorDisabledReason(floor)
          const floorDisabled = floorDisabledReason !== null
          const floorExpanded = !floorDisabled && expandedFloors.has(floor.id)

          return (
            <li
              key={floor.id}
              className={cn(
                "flex flex-col rounded-box bg-canvas-sunken/50",
                floorDisabled && "opacity-50",
              )}
            >
              <Disclosure
                expanded={floorExpanded}
                disabled={floorDisabled}
                onToggle={() => toggleInSet(setExpandedFloors, floor.id)}
                className="px-compact font-medium"
              >
                <span className="min-w-0">
                  {floor.name}
                  {floorDisabledReason ? (
                    <DisabledReasonSuffix reason={floorDisabledReason} />
                  ) : null}
                </span>
              </Disclosure>

              {floorExpanded ? (
                <ul className="pb-compact">
                  {floor.units.map((unit) => {
                    const unitDisabled = unitDisabledReason !== null
                    const unitExpanded =
                      !unitDisabled && expandedUnits.has(unit.id)
                    const unitCode = unit.code.trim()
                    const unitLabel = unitCode
                      ? `${unit.type} · ${unitCode}`
                      : unit.type

                    return (
                      <li
                        key={unit.id}
                        className={cn(
                          "flex flex-col pl-group",
                          unitDisabled && "opacity-50",
                        )}
                      >
                        <Disclosure
                          expanded={unitExpanded}
                          disabled={unitDisabled}
                          onToggle={() => toggleInSet(setExpandedUnits, unit.id)}
                          className="font-medium"
                        >
                          <span className="min-w-0 flex-1">
                            {unitLabel}
                            {unitDisabledReason ? (
                              <DisabledReasonSuffix reason={unitDisabledReason} />
                            ) : null}
                          </span>
                        </Disclosure>

                        {unitExpanded ? (
                          <ul className="pl-8">
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
                                <li
                                  key={rubro.id}
                                  className={cn(
                                    "border-b-2 border-canvas-raised",
                                    rubroDisabled && "opacity-50",
                                  )}
                                >
                                  <div className="flex items-center gap-compact pr-compact">
                                    <Disclosure
                                      expanded={rubroExpanded}
                                      disabled={rubroDisabled}
                                      onToggle={() =>
                                        toggleInSet(setExpandedRubros, rubroKey)
                                      }
                                      className="font-medium"
                                    >
                                      <span className="min-w-0 truncate">
                                        {rubroPrefix}. {rubro.name}
                                        {rubroDisabledReason ? (
                                          <DisabledReasonSuffix reason={rubroDisabledReason} />
                                        ) : null}
                                      </span>
                                    </Disclosure>
                                    <Checkbox
                                      aria-label={`${rubro.name} en ${unitLabel}`}
                                      checked={
                                        rubroDisabled ? false : toCheckedValue(rubroState)
                                      }
                                      disabled={rubroDisabled}
                                      onCheckedChange={() =>
                                        handleRubroToggle(unit.id, rubro, rubroState)
                                      }
                                    />
                                  </div>

                                  {rubroExpanded ? (
                                    <ul className="pl-8">
                                      {rubro.tasks
                                        .map((task, taskIndex) => ({ task, taskIndex }))
                                        .filter(({ task }) => task.name.trim())
                                        .map(({ task, taskIndex }) => {
                                          const included = isTaskIncluded(
                                            exclusions,
                                            unit.id,
                                            task.id,
                                          )
                                          const checkboxId = `tarea-${rubroKey}-${task.id}`
                                          return (
                                            <li
                                              key={task.id}
                                              className="flex min-h-9 items-center gap-compact pr-compact text-body"
                                            >
                                              <label
                                                htmlFor={checkboxId}
                                                className="min-w-0 flex-1 cursor-pointer"
                                              >
                                                {rubroPrefix}.{taskIndex + 1}.{" "}
                                                {task.name}
                                              </label>
                                              <Checkbox
                                                id={checkboxId}
                                                checked={included}
                                                onCheckedChange={() =>
                                                  handleTaskToggle(
                                                    unit.id,
                                                    task.id,
                                                    included,
                                                  )
                                                }
                                              />
                                            </li>
                                          )
                                        })}
                                    </ul>
                                  ) : null}
                                </li>
                              )
                            })}
                          </ul>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
