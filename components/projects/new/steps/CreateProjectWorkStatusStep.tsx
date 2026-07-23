"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ChevronRight, Wrench } from "lucide-react"
import {
  InitialWorkStatusLegend,
  InitialWorkStatusPicker,
} from "@/components/projects/new/InitialWorkStatusPicker"
import {
  applyRubroInitialStatus,
  deriveRubroInitialStatus,
  getTaskInitialStatus,
  type InitialWorkTaskStatus,
} from "@/lib/projects/initialWorkStatus"
import {
  getGroupDisplayStats,
  type CreateProjectDraft,
  type RubroGroupDraft,
  type RubroItemDraft,
} from "@/lib/projects/createProjectDraft"

type CreateProjectWorkStatusStepProps = {
  draft: CreateProjectDraft
  onChange: (patch: Partial<CreateProjectDraft>) => void
}

function ExpandToggleIcon({ expanded }: { expanded: boolean }) {
  return expanded ? (
    <ChevronDown className="size-5 shrink-0 text-[#43484e]" aria-hidden />
  ) : (
    <ChevronRight className="size-5 shrink-0 text-[#43484e]" aria-hidden />
  )
}

function WorkStatusTaskRow({
  taskNumber,
  taskName,
  status,
  onChangeStatus,
}: {
  taskNumber: string
  taskName: string
  status: InitialWorkTaskStatus
  onChangeStatus: (status: InitialWorkTaskStatus) => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-[4px] border border-transparent bg-[#f8fafc] px-[9px] py-[9px]">
      <Wrench className="size-3.5 shrink-0 text-[#572d1c]" aria-hidden />
      <span
        className="shrink-0 font-mono text-[12px] leading-4 tabular-nums"
        style={{ color: "#572d1c" }}
      >
        {taskNumber}
      </span>
      <span className="min-w-0 flex-1 truncate text-[14px] leading-[1.4] text-[#314158]">
        {taskName}
      </span>
      <InitialWorkStatusPicker
        size="sm"
        value={status}
        onChange={onChangeStatus}
        ariaLabel={`Estado de ${taskName}`}
      />
    </div>
  )
}

function WorkStatusRubroSection({
  rubro,
  rubroNumber,
  statuses,
  onChangeStatuses,
}: {
  rubro: RubroItemDraft
  rubroNumber: string
  statuses: Record<string, InitialWorkTaskStatus>
  onChangeStatuses: (statuses: Record<string, InitialWorkTaskStatus>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const namedTasks = rubro.tasks.filter((task) => task.name.trim())
  const rubroStatus = deriveRubroInitialStatus(rubro, statuses)

  if (namedTasks.length === 0) return null

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#ffeae0]">
      <div
        className="flex items-center justify-between gap-2 px-3 py-3"
        style={{ backgroundColor: "#fefcfb" }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="inline-flex shrink-0 items-center justify-center"
            aria-expanded={expanded}
            aria-label={expanded ? "Colapsar rubro" : "Expandir rubro"}
          >
            <ExpandToggleIcon expanded={expanded} />
          </button>

          <span
            className="flex shrink-0 items-center justify-center rounded px-2 py-0.5 text-[14px] leading-[1.4]"
            style={{ backgroundColor: "#ffd7c2", color: "#d04c00" }}
          >
            {rubroNumber}
          </span>

          <Wrench className="size-4 shrink-0 text-[#363a3f]" aria-hidden />

          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="min-w-0 flex-1 text-left"
          >
            <span className="text-[16px] leading-[1.4] text-[#363a3f]">
              {rubro.name.trim()}
            </span>
            <span className="ml-2 text-[12px] leading-[1.4] tracking-[-0.36px] text-[#5a6169]">
              ({namedTasks.length} {namedTasks.length === 1 ? "tarea" : "tareas"})
            </span>
          </button>
        </div>

        <InitialWorkStatusPicker
          value={rubroStatus}
          onChange={(status) =>
            onChangeStatuses(applyRubroInitialStatus(rubro, status, statuses))
          }
          ariaLabel={`Estado de ${rubro.name.trim()}`}
        />
      </div>

      {expanded ? (
        <div className="flex flex-col gap-1 bg-white px-3 py-3">
          {namedTasks.map((task, taskIndex) => (
            <WorkStatusTaskRow
              key={task.id}
              taskNumber={`${rubroNumber}.${taskIndex + 1}`}
              taskName={task.name.trim()}
              status={getTaskInitialStatus(task.id, statuses)}
              onChangeStatus={(status) =>
                onChangeStatuses({ ...statuses, [task.id]: status })
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function WorkStatusGroupSection({
  group,
  groupNumber,
  statuses,
  onChangeStatuses,
}: {
  group: RubroGroupDraft
  groupNumber: number
  statuses: Record<string, InitialWorkTaskStatus>
  onChangeStatuses: (statuses: Record<string, InitialWorkTaskStatus>) => void
}) {
  const [expanded, setExpanded] = useState(groupNumber === 1)
  const stats = getGroupDisplayStats(group)
  const visibleRubros = group.rubros.filter((rubro) =>
    rubro.tasks.some((task) => task.name.trim()),
  )

  if (visibleRubros.length === 0) return null

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#e2e8f0]">
      <div
        className="flex items-center justify-between gap-3 px-3 py-3"
        style={{ backgroundColor: "#fff6f1" }}
      >
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={expanded}
        >
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-[10px] text-[14px] leading-[1.4] text-white"
            style={{ backgroundColor: "#ff7433" }}
          >
            {groupNumber}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-medium leading-[1.4] text-[#18191b]">
              {group.name.trim() || "Grupo sin nombre"}
            </span>
            <span className="mt-0.5 block text-[12px] leading-[1.4] tracking-[-0.36px] text-[#43484e]">
              {stats.rubros} {stats.rubros === 1 ? "rubro" : "rubros"} • {stats.tareas}{" "}
              {stats.tareas === 1 ? "tarea" : "tareas"}
            </span>
          </span>
        </button>
        <ExpandToggleIcon expanded={expanded} />
      </div>

      {expanded ? (
        <div className="flex flex-col gap-2 bg-white px-3 py-3">
          {visibleRubros.map((rubro, rubroIndex) => (
            <WorkStatusRubroSection
              key={rubro.id}
              rubro={rubro}
              rubroNumber={`${groupNumber}.${rubroIndex + 1}`}
              statuses={statuses}
              onChangeStatuses={onChangeStatuses}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function CreateProjectWorkStatusStep({
  draft,
  onChange,
}: CreateProjectWorkStatusStepProps) {
  const statuses = draft.taskInitialStatuses

  const visibleGroups = useMemo(
    () =>
      draft.groups.filter((group) =>
        group.rubros.some((rubro) => rubro.tasks.some((task) => task.name.trim())),
      ),
    [draft.groups],
  )

  const setStatuses = (taskInitialStatuses: Record<string, InitialWorkTaskStatus>) => {
    onChange({ taskInitialStatuses })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] leading-[1.4] text-[#18191b]">
        Indicá el estado actual de los rubros para comenzar el seguimiento desde la situación
        real de la obra. Todos los rubros se crean como Pendientes por defecto; solo actualizá
        aquellos que ya estén Completados o En progreso.
      </p>

      <InitialWorkStatusLegend />

      {visibleGroups.length === 0 ? (
        <div className="rounded-[10px] border border-[#edeef0] px-4 py-6 text-center text-[14px] leading-[1.4] text-[#777b84]">
          Todavía no hay rubros con tareas configuradas. Volvé al paso anterior para agregarlos.
        </div>
      ) : (
        <div className="flex max-h-[384px] flex-col gap-2 overflow-y-auto pr-1">
          {visibleGroups.map((group, groupIndex) => (
            <WorkStatusGroupSection
              key={group.id}
              group={group}
              groupNumber={groupIndex + 1}
              statuses={statuses}
              onChangeStatuses={setStatuses}
            />
          ))}
        </div>
      )}
    </div>
  )
}
