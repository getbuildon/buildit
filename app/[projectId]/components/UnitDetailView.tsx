"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  LayoutList,
  Search,
  ShieldCheck,
} from "lucide-react"
import { BackButton } from "@/components/ui/BackButton"
import { Input } from "@/components/ui/input"
import { InProcessStatusIcon } from "@/components/icons/InProcessStatusIcon"
import {
  getDashboardProgressBarColor,
  DASHBOARD_PROGRESS_TRACK_COLOR,
} from "@/lib/projects/dashboardProgressBarColors"
import {
  matchesUnitTaskFilter,
  type UnitDetailTaskFilter,
  type UnitDetailTaskGroup,
  type UnitDetailTaskItem,
  type UnitDetailTaskStatus,
} from "@/lib/projects/unitDetailTasks"
import {
  UNIT_DETAIL_SHADOW,
  UNIT_DETAIL_STATUS_BADGE,
  UNIT_DETAIL_TYPE,
} from "@/lib/project/unitDetailDesignTokens"
import { cn } from "@/lib/utils"
import { TaskDetailDialog } from "../trabajo-diario/TaskDetailDialog"
import type { UnitDetailData } from "../unidades/actions"

const TASKS_PAGE_SIZE = 3

const FILTER_TABS: Array<{
  id: UnitDetailTaskFilter
  label: string
  icon: React.ElementType
}> = [
  { id: "all", label: "Todas", icon: LayoutList },
  { id: "completed", label: "Completadas", icon: CheckCircle2 },
  { id: "certified", label: "Certificadas", icon: BadgeCheck },
  { id: "in_progress", label: "En Proceso", icon: InProcessStatusIcon },
  { id: "blocked", label: "Bloqueadas", icon: AlertTriangle },
]

type UnitDetailViewProps = {
  projectId: string
  data: UnitDetailData
}

function filterTasks(
  tasks: UnitDetailTaskItem[],
  filter: UnitDetailTaskFilter,
  search: string,
): UnitDetailTaskItem[] {
  const query = search.trim().toLowerCase()
  return tasks.filter((task) => {
    if (!matchesUnitTaskFilter(task.status, filter)) return false
    if (!query) return true
    return (
      task.name.toLowerCase().includes(query) ||
      task.code.toLowerCase().includes(query) ||
      task.rubroName.toLowerCase().includes(query)
    )
  })
}

function TaskStatusBadge({ status }: { status: UnitDetailTaskStatus }) {
  const config = UNIT_DETAIL_STATUS_BADGE[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[10px] px-[9px] py-1 text-[12px] font-medium leading-[1.4]",
        config.className,
      )}
    >
      {status === "completed" ? (
        <CheckCircle2 className="size-2.5 shrink-0" aria-hidden />
      ) : status === "certified" ? (
        <ShieldCheck className="size-2.5 shrink-0" aria-hidden />
      ) : status === "in_progress" ? (
        <InProcessStatusIcon className="size-2.5 shrink-0" />
      ) : status === "blocked" ? (
        <AlertTriangle className="size-2.5 shrink-0" aria-hidden />
      ) : null}
      {config.label}
    </span>
  )
}

function TaskRow({
  task,
  onOpen,
}: {
  task: UnitDetailTaskItem
  onOpen: (entryId: string) => void
}) {
  const clickable = Boolean(task.entryId)

  return (
    <div className="border-b border-[#ffeae0] last:border-b-0">
      <button
        type="button"
        disabled={!clickable}
        onClick={() => task.entryId && onOpen(task.entryId)}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3 text-left",
          clickable ? "cursor-pointer hover:bg-[#fefcfb]" : "cursor-default",
        )}
      >
        <span className={cn("w-10 shrink-0", UNIT_DETAIL_TYPE.taskCode)}>{task.code}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={UNIT_DETAIL_TYPE.taskName}>{task.name}</span>
            <span className={UNIT_DETAIL_TYPE.taskRubro}>{task.rubroName}</span>
          </div>
          {task.authorName && task.formattedMeta ? (
            <p className={cn("mt-0.5", UNIT_DETAIL_TYPE.taskMeta)}>
              {task.authorName} • {task.formattedMeta}
            </p>
          ) : null}
        </div>
        <TaskStatusBadge status={task.status} />
      </button>
    </div>
  )
}

function TaskGroupSection({
  group,
  filter,
  search,
  defaultOpen,
  onOpenTask,
}: {
  group: UnitDetailTaskGroup
  filter: UnitDetailTaskFilter
  search: string
  defaultOpen: boolean
  onOpenTask: (entryId: string) => void
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [visibleCount, setVisibleCount] = useState(TASKS_PAGE_SIZE)

  const filteredTasks = useMemo(
    () => filterTasks(group.tasks, filter, search),
    [group.tasks, filter, search],
  )

  if (filteredTasks.length === 0) return null

  const visibleTasks = filteredTasks.slice(0, visibleCount)
  const hasMore = filteredTasks.length > visibleCount

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#ffeae0]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between bg-[#fff6f1] px-3.5 py-3.5 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-[10px] bg-[#ff7433] text-[14px] leading-[14px] text-[#fefcfb]">
            {group.index}
          </span>
          <div className="flex flex-col gap-px">
            <span className="text-[14px] font-medium leading-[1.4] text-[#18191b]">
              {group.name}
            </span>
            <span className="text-[12px] font-normal leading-[1.4] tracking-[-0.36px] text-[#43484e]">
              {group.tasks.length} {group.tasks.length === 1 ? "tarea" : "tareas"}
            </span>
          </div>
        </div>
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-[#43484e]" aria-hidden />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-[#43484e]" aria-hidden />
        )}
      </button>

      {open ? (
        <div className="bg-white">
          {visibleTasks.map((task) => (
            <TaskRow key={task.id} task={task} onOpen={onOpenTask} />
          ))}
          {hasMore ? (
            <div className="flex justify-center border-t border-[#ffeae0] py-3">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + TASKS_PAGE_SIZE)}
                className="inline-flex items-center gap-1 text-[12px] font-medium leading-[1.4] text-[#43484e] hover:text-[#272a2d]"
              >
                Cargar más tareas
                <ChevronDown className="size-3.5" aria-hidden />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function UnitDetailView({ projectId, data }: UnitDetailViewProps) {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<UnitDetailTaskFilter>("all")
  const [search, setSearch] = useState("")
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [taskDetailOpen, setTaskDetailOpen] = useState(false)

  const planPreviewUrl = data.unit.renderUrl ?? data.unit.planUrl

  const visibleGroups = useMemo(() => {
    return data.groups.filter((group) =>
      filterTasks(group.tasks, activeFilter, search).length > 0,
    )
  }, [activeFilter, data.groups, search])

  const handleOpenTask = (entryId: string) => {
    setSelectedEntryId(entryId)
    setTaskDetailOpen(true)
  }

  return (
    <div className="flex flex-col gap-[19px] py-6">
      <BackButton href={`/${projectId}`} label="Volver al panel" variant="panel" />

      <div className="flex flex-col gap-4 lg:flex-row">
        <div
          className="flex min-w-0 flex-1 flex-col gap-3.5 rounded-[16px] border border-[#edeef0] bg-white p-6"
          style={{ boxShadow: UNIT_DETAIL_SHADOW }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className={UNIT_DETAIL_TYPE.floorName}>{data.floor.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1 className={UNIT_DETAIL_TYPE.unitTitle}>{data.unit.displayCode}</h1>
                <span className="rounded-full border border-[#f9a988] bg-[#fff6f1] px-3 py-1 text-[12px] leading-[1.4] tracking-[-0.36px] text-[#d04c00]">
                  {data.unit.typeLabel}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 gap-10">
              <div className="flex flex-col items-center gap-1">
                <span className={UNIT_DETAIL_TYPE.statValue}>{data.progressPercent}%</span>
                <span className={UNIT_DETAIL_TYPE.statLabel}>progreso general</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className={UNIT_DETAIL_TYPE.statValue}>
                  {data.completedTasks}/{data.totalTasks}
                </span>
                <span className={UNIT_DETAIL_TYPE.statLabel}>tareas certificadas</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[14px] font-normal leading-[1.4] text-[#272a2d]">Avance de obra:</p>
            <div className="flex flex-col gap-1.5">
              <div
                className="h-2.5 overflow-hidden rounded-full"
                style={{ backgroundColor: DASHBOARD_PROGRESS_TRACK_COLOR }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${data.progressPercent}%`,
                    backgroundColor: getDashboardProgressBarColor(data.progressPercent),
                  }}
                />
              </div>
              <div className="flex justify-between text-[12px] leading-[1.4] tracking-[-0.36px] text-[#696e77]">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex size-[180px] shrink-0 items-center justify-center rounded-[16px] border border-[#edeef0] bg-white px-5 py-8"
          style={{ boxShadow: UNIT_DETAIL_SHADOW }}
        >
          {planPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={planPreviewUrl}
              alt={`Plano de ${data.unit.displayCode}`}
              className="size-[128px] object-contain"
            />
          ) : (
            <div className="flex size-[128px] items-center justify-center rounded-[8px] border border-dashed border-[#edeef0] bg-[#fefcfb] text-center text-[12px] leading-[1.4] text-[#777b84]">
              Sin render
            </div>
          )}
        </div>
      </div>

      <div
        className="rounded-[16px] border border-[#edeef0] bg-white p-6"
        style={{ boxShadow: UNIT_DETAIL_SHADOW }}
      >
        <h2 className={UNIT_DETAIL_TYPE.sectionTitle}>Tareas de Construcción</h2>

        <div className="mt-5 flex flex-col gap-5 border-b border-[#edeef0] pb-px lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-end">
            {FILTER_TABS.map((tab) => {
              const Icon = tab.icon
              const active = activeFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 border-b-2 px-3 pb-3.5 pt-2 text-[14px] leading-[1.4]",
                    active
                      ? "border-[#111113] font-medium text-[#111113]"
                      : "border-transparent font-normal text-[#777b84]",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="relative mb-2 w-full max-w-[320px]">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#696e77]"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar tarea por nombre ó código..."
              className="h-[42px] rounded-[12px] border-[#edeef0] bg-white pl-10 text-[14px] shadow-none placeholder:text-[#696e77] focus-visible:border-[#ff7433] focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          {visibleGroups.length === 0 ? (
            <p className="py-8 text-center text-[14px] leading-[1.4] text-[#777b84]">
              No hay tareas para mostrar con este filtro.
            </p>
          ) : (
            visibleGroups.map((group, index) => (
              <TaskGroupSection
                key={group.id}
                group={group}
                filter={activeFilter}
                search={search}
                defaultOpen={index === 0}
                onOpenTask={handleOpenTask}
              />
            ))
          )}
        </div>
      </div>

      <TaskDetailDialog
        projectId={projectId}
        entryId={selectedEntryId}
        open={taskDetailOpen}
        onOpenChange={setTaskDetailOpen}
        onEntryIdChange={setSelectedEntryId}
        onSaved={() => router.refresh()}
      />
    </div>
  )
}
