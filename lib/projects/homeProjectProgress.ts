import type { SupabaseClient } from "@supabase/supabase-js"
import {
  calculateUnitProgressPercent,
  filterProgressEntriesBefore,
  getAssignedTaskIdsForUnit,
  type ProgressEntryRow,
} from "@/lib/projects/dashboardProgress"

export type ProjectHomeProgress = {
  generalProgressPercent: number
  weeklyProgressDelta: number
}

type UnitRow = {
  id: string
  project_id: string
}

type TaskRow = {
  id: string
  project_id: string
  weight_percent: number | null
}

type AssignmentRow = {
  project_id: string
  unit_id: string
  rubro_task_id: string
}

function calculateGeneralProgressForProject(
  units: UnitRow[],
  allTaskIds: string[],
  taskWeights: Map<string, number | null>,
  byUnit: Record<string, string[]>,
  entries: ProgressEntryRow[],
): number {
  if (units.length === 0) return 0

  const unitProgressValues = units.map((unit) => {
    const assignedTaskIds = getAssignedTaskIdsForUnit(byUnit, unit.id, allTaskIds)
    return calculateUnitProgressPercent(unit.id, assignedTaskIds, entries, taskWeights)
  })

  return Math.round(
    unitProgressValues.reduce((sum, value) => sum + value, 0) / unitProgressValues.length,
  )
}

function calculateProjectHomeProgress(
  units: UnitRow[],
  allTaskIds: string[],
  taskWeights: Map<string, number | null>,
  byUnit: Record<string, string[]>,
  entries: ProgressEntryRow[],
): ProjectHomeProgress {
  const generalProgressPercent = calculateGeneralProgressForProject(
    units,
    allTaskIds,
    taskWeights,
    byUnit,
    entries,
  )

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const entriesBeforeWeek = filterProgressEntriesBefore(entries, weekAgo)
  const progressWeekAgo = calculateGeneralProgressForProject(
    units,
    allTaskIds,
    taskWeights,
    byUnit,
    entriesBeforeWeek,
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

  const [unitsRes, tasksRes, assignmentsRes, entriesRes] = await Promise.all([
    supabase
      .from("project_units")
      .select("id, project_id")
      .in("project_id", projectIds),
    supabase.from("rubro_tasks").select("id, project_id, weight_percent").in("project_id", projectIds),
    supabase
      .from("unit_task_assignments")
      .select("project_id, unit_id, rubro_task_id")
      .in("project_id", projectIds),
    supabase
      .from("progress_entries")
      .select("project_id, unit_id, task_id, progress_state, status, submitted_at, created_at")
      .in("project_id", projectIds),
  ])

  if (unitsRes.error || tasksRes.error || assignmentsRes.error || entriesRes.error) {
    for (const projectId of projectIds) {
      result.set(projectId, { generalProgressPercent: 0, weeklyProgressDelta: 0 })
    }
    return result
  }

  const units = (unitsRes.data ?? []) as UnitRow[]
  const tasks = (tasksRes.data ?? []) as TaskRow[]
  const assignments = (assignmentsRes.data ?? []) as AssignmentRow[]
  const entries = (entriesRes.data ?? []) as (ProgressEntryRow & { project_id: string })[]

  const unitsByProject = new Map<string, UnitRow[]>()
  for (const unit of units) {
    const list = unitsByProject.get(unit.project_id) ?? []
    list.push(unit)
    unitsByProject.set(unit.project_id, list)
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
    const projectUnits = unitsByProject.get(projectId) ?? []
    const projectTasks = tasksByProject.get(projectId) ?? []
    const projectAssignments = assignmentsByProject.get(projectId) ?? []
    const projectEntries = entriesByProject.get(projectId) ?? []

    const allTaskIds = projectTasks.map((task) => task.id)
    const taskWeights = new Map(projectTasks.map((task) => [task.id, task.weight_percent]))

    const byUnit: Record<string, string[]> = {}
    for (const assignment of projectAssignments) {
      const list = byUnit[assignment.unit_id] ?? []
      list.push(assignment.rubro_task_id)
      byUnit[assignment.unit_id] = list
    }

    result.set(
      projectId,
      calculateProjectHomeProgress(
        projectUnits,
        allTaskIds,
        taskWeights,
        byUnit,
        projectEntries,
      ),
    )
  }

  return result
}
