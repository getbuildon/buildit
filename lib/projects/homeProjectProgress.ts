import type { SupabaseClient } from "@supabase/supabase-js"
import { buildRubroProgressContext } from "@/lib/projects/buildRubroProgressContext"
import {
  calculateProjectProgressPercent,
  filterProgressEntriesBefore,
  type ProgressEntryRow,
} from "@/lib/projects/dashboardProgress"

export type ProjectHomeProgress = {
  generalProgressPercent: number
  weeklyProgressDelta: number
}

type FloorRow = {
  id: string
  project_id: string
}

type UnitRow = {
  id: string
  project_id: string
  floor_id: string
}

type RubroRow = {
  id: string
  project_id: string
  weight_percent: number | null
}

type TaskRow = {
  id: string
  project_id: string
  rubro_id: string
}

type AssignmentRow = {
  project_id: string
  unit_id: string
  rubro_task_id: string
}

function calculateProjectHomeProgress(
  floorUnitIds: string[][],
  allTaskIds: string[],
  rubroProgress: ReturnType<typeof buildRubroProgressContext>,
  byUnit: Record<string, string[]>,
  entries: ProgressEntryRow[],
): ProjectHomeProgress {
  const generalProgressPercent = calculateProjectProgressPercent(
    floorUnitIds,
    allTaskIds,
    byUnit,
    entries,
    rubroProgress,
  )

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const entriesBeforeWeek = filterProgressEntriesBefore(entries, weekAgo)
  const progressWeekAgo = calculateProjectProgressPercent(
    floorUnitIds,
    allTaskIds,
    byUnit,
    entriesBeforeWeek,
    rubroProgress,
  )

  return {
    generalProgressPercent,
    weeklyProgressDelta: generalProgressPercent - progressWeekAgo,
  }
}

export async function loadProjectsHomeProgress(
  supabase: SupabaseClient,
  projectIds: string[],
): Promise<Map<string, ProjectHomeProgress>> {
  const result = new Map<string, ProjectHomeProgress>()
  if (projectIds.length === 0) return result

  const [floorsRes, unitsRes, rubrosRes, tasksRes, assignmentsRes, entriesRes] =
    await Promise.all([
      supabase
        .from("project_floors")
        .select("id, project_id")
        .in("project_id", projectIds),
      supabase
        .from("project_units")
        .select("id, project_id, floor_id")
        .in("project_id", projectIds),
      supabase
        .from("rubros")
        .select("id, project_id, weight_percent")
        .in("project_id", projectIds),
      supabase.from("rubro_tasks").select("id, project_id, rubro_id").in("project_id", projectIds),
      supabase
        .from("unit_task_assignments")
        .select("project_id, unit_id, rubro_task_id")
        .in("project_id", projectIds),
      supabase
        .from("progress_entries")
        .select("project_id, unit_id, task_id, progress_state, status, submitted_at, created_at")
        .in("project_id", projectIds),
    ])

  if (
    floorsRes.error ||
    unitsRes.error ||
    rubrosRes.error ||
    tasksRes.error ||
    assignmentsRes.error ||
    entriesRes.error
  ) {
    for (const projectId of projectIds) {
      result.set(projectId, { generalProgressPercent: 0, weeklyProgressDelta: 0 })
    }
    return result
  }

  const floors = (floorsRes.data ?? []) as FloorRow[]
  const units = (unitsRes.data ?? []) as UnitRow[]
  const rubros = (rubrosRes.data ?? []) as RubroRow[]
  const tasks = (tasksRes.data ?? []) as TaskRow[]
  const assignments = (assignmentsRes.data ?? []) as AssignmentRow[]
  const entries = (entriesRes.data ?? []) as (ProgressEntryRow & { project_id: string })[]

  const floorsByProject = new Map<string, FloorRow[]>()
  for (const floor of floors) {
    const list = floorsByProject.get(floor.project_id) ?? []
    list.push(floor)
    floorsByProject.set(floor.project_id, list)
  }

  const unitsByProject = new Map<string, UnitRow[]>()
  for (const unit of units) {
    const list = unitsByProject.get(unit.project_id) ?? []
    list.push(unit)
    unitsByProject.set(unit.project_id, list)
  }

  const rubrosByProject = new Map<string, RubroRow[]>()
  for (const rubro of rubros) {
    const list = rubrosByProject.get(rubro.project_id) ?? []
    list.push(rubro)
    rubrosByProject.set(rubro.project_id, list)
  }

  const tasksByProject = new Map<string, TaskRow[]>()
  for (const task of tasks) {
    const list = tasksByProject.get(task.project_id) ?? []
    list.push(task)
    tasksByProject.set(task.project_id, list)
  }

  const assignmentsByProject = new Map<string, AssignmentRow[]>()
  for (const assignment of assignments) {
    const list = assignmentsByProject.get(assignment.project_id) ?? []
    list.push(assignment)
    assignmentsByProject.set(assignment.project_id, list)
  }

  const entriesByProject = new Map<string, (ProgressEntryRow & { project_id: string })[]>()
  for (const entry of entries) {
    const list = entriesByProject.get(entry.project_id) ?? []
    list.push(entry)
    entriesByProject.set(entry.project_id, list)
  }

  for (const projectId of projectIds) {
    const projectFloors = floorsByProject.get(projectId) ?? []
    const projectUnits = unitsByProject.get(projectId) ?? []
    const projectRubros = rubrosByProject.get(projectId) ?? []
    const projectTasks = tasksByProject.get(projectId) ?? []
    const projectAssignments = assignmentsByProject.get(projectId) ?? []
    const projectEntries = entriesByProject.get(projectId) ?? []

    const allTaskIds = projectTasks.map((task) => task.id)
    const rubroProgress = buildRubroProgressContext(projectRubros, projectTasks)

    const byUnit: Record<string, string[]> = {}
    for (const assignment of projectAssignments) {
      const list = byUnit[assignment.unit_id] ?? []
      list.push(assignment.rubro_task_id)
      byUnit[assignment.unit_id] = list
    }

    const floorUnitIds =
      projectFloors.length > 0
        ? projectFloors.map((floor) =>
            projectUnits.filter((unit) => unit.floor_id === floor.id).map((unit) => unit.id),
          )
        : [projectUnits.map((unit) => unit.id)]

    result.set(
      projectId,
      calculateProjectHomeProgress(
        floorUnitIds,
        allTaskIds,
        rubroProgress,
        byUnit,
        projectEntries,
      ),
    )
  }

  return result
}
