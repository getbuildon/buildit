"use server"

import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { getAuthenticatedUserOrNull } from "@/lib/authHelpers"
import { checkUnitDetailAccess } from "@/lib/project/projectAccess"
import type { UnitDetailTaskGroup } from "@/lib/projects/unitDetailTasks"
import { loadUnitTaskAssignmentsByUnit } from "@/lib/projects/loadUnitTaskAssignments"
import { loadLatestProgressEntries } from "@/lib/projects/loadLatestProgressEntries"
import { loadProjectMemberDisplayNames } from "@/lib/projects/projectMemberFicha"
import { armarDetalleDeUnidad, type CrudosDelDetalleDeUnidad } from "@/lib/projects/armarDetalleDeUnidad"

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

export async function getUnitDetailData(
  projectId: string,
  unitId: string,
): Promise<UnitDetailData | null> {
  const id = projectId.trim()
  const selectedUnitId = unitId.trim()
  if (!id || !selectedUnitId) return null

  const user = await getAuthenticatedUserOrNull()
  if (!user) return null

  const access = await checkUnitDetailAccess(id, selectedUnitId)
  if (!access.ok) return null

  const supabase = await createClient()
  const admin = createAdminClient()

  const [unitResult, assignmentsByUnit, groupsResult, entries] = await Promise.all([
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
    loadUnitTaskAssignmentsByUnit(supabase, id),
    supabase
      .from("rubro_groups")
      .select(
        `
        id, name, sort_order,
        rubros (
          id, name, sort_order, weight_percent,
          rubro_tasks (id, name, sort_order, weight_percent)
        )
      `,
      )
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),
    loadLatestProgressEntries(supabase, id, { unitId: selectedUnitId }),
  ])

  if (unitResult.error || !unitResult.data) return null
  if (groupsResult.error) return null

  const unit = unitResult.data
  const floorRaw = unit.project_floors as
    | { id: string; name: string; identifier?: string | null }
    | Array<{ id: string; name: string; identifier?: string | null }>
    | null
  const floorRow = Array.isArray(floorRaw) ? floorRaw[0] : floorRaw
  if (!floorRow) return null

  // Certificaciones vigentes de lo certificado y nombres de autores y certificadores.
  const aprobados = entries.filter((e) => e.status === "approved").map((e) => e.id)
  const { data: validations } = aprobados.length
    ? await supabase
        .from("progress_validations")
        .select("progress_entry_id, validated_at, validated_by")
        .in("progress_entry_id", aprobados)
        .eq("decision", "approved")
        .order("validated_at", { ascending: false })
    : { data: [] }
  const nameById = await loadProjectMemberDisplayNames(admin, id, [
    ...entries.map((e) => e.created_by),
    ...(validations ?? []).map((v) => v.validated_by),
  ])

  return armarDetalleDeUnidad({
    unidad: {
      id: unit.id,
      code: unit.code,
      name: unit.name,
      unit_type: unit.unit_type,
      room_count: unit.room_count,
      plan_url: unit.plan_url ?? null,
      render_url: unit.render_url ?? null,
    },
    piso: { id: floorRow.id, name: floorRow.name, identifier: floorRow.identifier ?? null },
    grupos: (groupsResult.data ?? []) as CrudosDelDetalleDeUnidad["grupos"],
    asignaciones: assignmentsByUnit,
    avances: entries,
    validaciones: validations ?? [],
    nombres: Object.fromEntries(nameById),
  })
}
