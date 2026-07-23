"use server"

import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { getAuthenticatedUserOrNull } from "@/lib/authHelpers"
import {
  calculateUnitProgressPercent,
  type ProgressEntryRow,
} from "@/lib/projects/dashboardProgress"
import { getUnitDisplayCode } from "@/lib/projects/floorLabels"
import { getUnitDashboardLabel } from "@/lib/projects/unitTypes"
import {
  buildLatestEntriesByTask,
  buildTaskCode,
  countCompletedTasks,
  formatUnitTaskMetaDate,
  getAssignedTaskIds,
  resolveUnitTaskStatus,
  type UnitDetailTaskGroup,
  type UnitDetailTaskItem,
} from "@/lib/projects/unitDetailTasks"
import { getUnitTaskAssignments } from "../configuracion/actions"

export type UnitDetailData = {
  unit: {
    id: string
    code: string
    displayCode: string
    typeLabel: string
    planUrl: string | null
    renderUrl: string | null
  }
  floor: {
    id: string
    name: string
    identifier: string | null
  }
  progressPercent: number
  completedTasks: number
  totalTasks: number
  groups: UnitDetailTaskGroup[]
}

function formatAuthorName(profile: {
  first_name: string | null
  last_name: string | null
  email: string
}): string {
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim()
  return fullName || profile.email
}

export async function getUnitDetailData(
  projectId: string,
  unitId: string,
): Promise<UnitDetailData | null> {
  const id = projectId.trim()
  const selectedUnitId = unitId.trim()
  if (!id || !selectedUnitId) return null

  const user = await getAuthenticatedUserOrNull()
  if (!user) return null

  const supabase = await createClient()
  const admin = createAdminClient()

  const [unitResult, assignments, groupsResult, entriesResult] = await Promise.all([
    supabase
      .from("project_units")
      .select(
        `
        id,
        code,
        name,
        unit_type,
        room_count,
        plan_url,
        render_url,
        floor_id,
        project_floors:floor_id (id, name, identifier)
      `,
      )
      .eq("project_id", id)
      .eq("id", selectedUnitId)
      .maybeSingle(),
    getUnitTaskAssignments(id),
    supabase
      .from("rubro_groups")
      .select(
        `
        id, name, sort_order,
        rubros (
          id, name, sort_order,
          rubro_tasks (id, name, sort_order, weight_percent)
        )
      `,
      )
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("progress_entries")
      .select("id, unit_id, task_id, progress_state, status, created_at, submitted_at, created_by")
      .eq("project_id", id)
      .eq("unit_id", selectedUnitId),
  ])

  if (unitResult.error || !unitResult.data) return null
  if (groupsResult.error || entriesResult.error) return null

  const unit = unitResult.data
  const floorRaw = unit.project_floors as
    | { id: string; name: string; identifier?: string | null }
    | Array<{ id: string; name: string; identifier?: string | null }>
    | null
  const floorRow = Array.isArray(floorRaw) ? floorRaw[0] : floorRaw
  if (!floorRow) return null

  const groupsRaw = groupsResult.data ?? []
  const entries = (entriesResult.data ?? []) as Array<
    ProgressEntryRow & { id: string; created_by: string }
  >

  const allTaskIds: string[] = []
  for (const group of groupsRaw) {
    for (const rubro of (group.rubros as Array<{ rubro_tasks: Array<{ id: string }> | null }>) ??
      []) {
      for (const task of rubro.rubro_tasks ?? []) {
        allTaskIds.push(task.id)
      }
    }
  }

  const assignedTaskIds = getAssignedTaskIds(
    assignments.byUnit,
    selectedUnitId,
    allTaskIds,
  )
  const assignedSet = new Set(assignedTaskIds)
  const latestByTask = buildLatestEntriesByTask(entries, assignedTaskIds)

  const authorIds = [
    ...new Set(
      [...latestByTask.values()]
        .map((entry) => (entry as { created_by?: string }).created_by)
        .filter(Boolean),
    ),
  ] as string[]

  const { data: profiles } =
    authorIds.length > 0
      ? await admin
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", authorIds)
      : { data: [] as Array<{
          id: string
          first_name: string | null
          last_name: string | null
          email: string
        }> }

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

  const taskWeights = new Map<string, number | null>()
  const groups: UnitDetailTaskGroup[] = []

  groupsRaw.forEach((group, groupIndex) => {
    const rubros = ((group.rubros as Array<{
      id: string
      name: string
      sort_order: number
      rubro_tasks: Array<{
        id: string
        name: string
        sort_order: number
        weight_percent: number | null
      }> | null
    }>) ?? []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

    const tasks: UnitDetailTaskItem[] = []

    rubros.forEach((rubro, rubroIndex) => {
      const rubroTasks = (rubro.rubro_tasks ?? []).sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
      )

      rubroTasks.forEach((task, taskIndex) => {
        taskWeights.set(task.id, task.weight_percent ?? null)
        if (!assignedSet.has(task.id)) return

        const latest = latestByTask.get(task.id) as
          | (ProgressEntryRow & { id: string; created_by?: string })
          | undefined
        const status = resolveUnitTaskStatus(latest ?? null)
        const authorId = latest?.created_by
        const author = authorId ? profileById.get(authorId) : null
        const occurredAt = latest?.submitted_at ?? latest?.created_at ?? null

        tasks.push({
          id: task.id,
          code: buildTaskCode(groupIndex + 1, rubroIndex + 1, taskIndex + 1),
          name: task.name,
          rubroName: rubro.name,
          groupIndex: groupIndex + 1,
          status,
          entryId: latest?.id ?? null,
          authorName: author ? formatAuthorName(author) : null,
          occurredAt,
          formattedMeta: occurredAt ? formatUnitTaskMetaDate(occurredAt) : null,
        })
      })
    })

    if (tasks.length > 0) {
      groups.push({
        id: group.id,
        index: groupIndex + 1,
        name: group.name,
        tasks,
      })
    }
  })

  const progressPercent = calculateUnitProgressPercent(
    selectedUnitId,
    assignedTaskIds,
    entries,
    taskWeights,
  )

  const unitCode = getUnitDisplayCode({
    id: unit.id,
    code: unit.code,
    name: unit.name,
  })

  return {
    unit: {
      id: unit.id,
      code: unitCode,
      displayCode: unitCode === "—" ? "Unidad" : `Unidad ${unitCode}`,
      typeLabel: getUnitDashboardLabel({
        unit_type: unit.unit_type,
        name: unit.name,
        room_count: unit.room_count,
      }),
      planUrl: unit.plan_url ?? null,
      renderUrl: unit.render_url ?? null,
    },
    floor: {
      id: floorRow.id,
      name: floorRow.name,
      identifier: floorRow.identifier ?? null,
    },
    progressPercent,
    completedTasks: countCompletedTasks(assignedTaskIds, latestByTask),
    totalTasks: assignedTaskIds.length,
    groups,
  }
}
