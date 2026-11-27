import type { UnitDetailData } from "@/app/project/[projectId]/unidades/actions"
import { buildRubroProgressContext } from "@/lib/projects/buildRubroProgressContext"
import { calculateUnitProgressPercent, type ProgressEntryRow } from "@/lib/projects/dashboardProgress"
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

/**
 * Arma el detalle de una unidad (avance, tareas por grupo con su estado) a partir de las
 * filas de la base. Lo usan los dos caminos: la server action (getUnitDetailData) y el
 * servidor de datos (GET /obras/:id/unidades/:unidad).
 */

type Tarea = { id: string; name: string; sort_order: number; weight_percent: number | null }
type Rubro = { id: string; name: string; sort_order: number; weight_percent: number | null; rubro_tasks: Tarea[] | null }

export type CrudosDelDetalleDeUnidad = {
  unidad: {
    id: string
    code: string | null
    name: string | null
    unit_type: string | null
    room_count: number | null
    plan_url: string | null
    render_url: string | null
  }
  piso: { id: string; name: string; identifier: string | null }
  grupos: { id: string; name: string; sort_order: number; rubros: Rubro[] | null }[]
  asignaciones: Record<string, string[]>
  /** Último avance de cada tarea en esta unidad. */
  avances: (ProgressEntryRow & { id: string; created_by: string })[]
  /** Certificaciones (aprobadas) de los avances certificados, la más nueva primero. */
  validaciones: { progress_entry_id: string; validated_at: string; validated_by: string }[]
  nombres: Record<string, string>
}

export function armarDetalleDeUnidad(crudos: CrudosDelDetalleDeUnidad): UnitDetailData {
  const { unidad, piso } = crudos
  const nombre = (id: string) => crudos.nombres[id] ?? "Usuario"
  const grupos = [...crudos.grupos].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  const todas = grupos.flatMap((g) => (g.rubros ?? []).flatMap((r) => (r.rubro_tasks ?? []).map((t) => t.id)))
  const asignadas = getAssignedTaskIds(crudos.asignaciones, unidad.id, todas)
  const asignadasSet = new Set(asignadas)
  const avances = crudos.avances.filter((a) => a.unit_id === unidad.id)
  const ultimoPorTarea = buildLatestEntriesByTask(avances, asignadas)

  const certificacion = new Map<string, { validated_at: string; validated_by: string }>()
  for (const v of crudos.validaciones) if (!certificacion.has(v.progress_entry_id)) certificacion.set(v.progress_entry_id, v)

  const filasDeRubros: { id: string; weight_percent: number | null }[] = []
  const filasDeTareas: { id: string; rubro_id: string }[] = []
  const salida: UnitDetailTaskGroup[] = []

  grupos.forEach((grupo, gi) => {
    const rubros = [...(grupo.rubros ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    const tareas: UnitDetailTaskItem[] = []
    rubros.forEach((rubro, ri) => {
      filasDeRubros.push({ id: rubro.id, weight_percent: rubro.weight_percent ?? null })
      const delRubro = [...(rubro.rubro_tasks ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      delRubro.forEach((tarea, ti) => {
        filasDeTareas.push({ id: tarea.id, rubro_id: rubro.id })
        if (!asignadasSet.has(tarea.id)) return
        const ultimo = ultimoPorTarea.get(tarea.id) as (ProgressEntryRow & { id: string; created_by?: string }) | undefined
        const estado = resolveUnitTaskStatus(ultimo ?? null)
        const cuando = ultimo?.submitted_at ?? ultimo?.created_at ?? null
        const v = estado === "certified" && ultimo ? certificacion.get(ultimo.id) : undefined
        // Certificada: se muestra quién certificó y cuándo; si no, quién cargó el último avance.
        const quien = v?.validated_by ?? ultimo?.created_by
        const fecha = v?.validated_at ?? cuando
        tareas.push({
          id: tarea.id,
          code: buildTaskCode(gi + 1, ri + 1, ti + 1),
          name: tarea.name,
          rubroName: rubro.name,
          groupIndex: gi + 1,
          status: estado,
          entryId: ultimo?.id ?? null,
          authorName: quien ? nombre(quien) : null,
          occurredAt: cuando,
          formattedMeta: fecha ? formatUnitTaskMetaDate(fecha) : null,
        })
      })
    })
    if (tareas.length > 0) salida.push({ id: grupo.id, index: gi + 1, name: grupo.name, tasks: tareas })
  })

  const codigo = getUnitDisplayCode({ id: unidad.id, code: unidad.code, name: unidad.name })
  return {
    unit: {
      id: unidad.id,
      code: codigo,
      displayCode: codigo === "—" ? "Unidad" : `Unidad ${codigo}`,
      typeLabel: getUnitDashboardLabel({ unit_type: unidad.unit_type, name: unidad.name, room_count: unidad.room_count }),
      planUrl: unidad.plan_url ?? null,
      renderUrl: unidad.render_url ?? null,
    },
    floor: { id: piso.id, name: piso.name, identifier: piso.identifier ?? null },
    progressPercent: calculateUnitProgressPercent(unidad.id, asignadas, avances, buildRubroProgressContext(filasDeRubros, filasDeTareas)),
    completedTasks: countCompletedTasks(asignadas, ultimoPorTarea),
    totalTasks: asignadas.length,
    groups: salida,
  }
}
