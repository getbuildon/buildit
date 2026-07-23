"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BadgeCheck,
  Clock,
  Eye,
  Info,
  ListTodo,
  MessageCircle,
  ShieldCheck,
} from "lucide-react"
import { endOfDay, startOfDay } from "date-fns"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import {
  CERTIFICADA_BADGE,
  CERTIFICACIONES_SHADOW,
  CERTIFICACIONES_TYPE,
} from "@/lib/project/certificacionesDesignTokens"
import { cn } from "@/lib/utils"
import { CertificacionTaskDetailDialog } from "./CertificacionTaskDetailDialog"
import { CertificacionCheckbox } from "./CertificacionCheckbox"
import {
  CertificarTareaDialog,
  type CertificarTareaSummary,
} from "./CertificarTareaDialog"
import { CertificarTareasDialog } from "./CertificarTareasDialog"
import {
  certifyProgressEntries,
  type CertificacionesData,
  type CertificacionTask,
} from "./actions"

const ALL_MEMBERS_VALUE = "__all_members__"
const PAGE_SIZE = 8

const filterFieldClassName = "flex min-w-0 flex-1 flex-col gap-1.5"
const filterControlClassName = "h-[40px]"

type StatusFilter = "pending" | "certified"

type Props = {
  projectId: string
  initialData: CertificacionesData
}

function formatDaysLabel(days: number, isUrgent: boolean): string {
  if (isUrgent) return `${days} d. (urgente)`
  if (days === 1) return "1 día"
  return `${days} días`
}

function getUrgencyBadge(task: CertificacionTask) {
  if (task.status === "certified") {
    return {
      className: CERTIFICADA_BADGE.className,
      icon: ShieldCheck,
      label: "Certificada",
    }
  }

  if (task.isUrgent) {
    return {
      className: "bg-[#feebec] text-[#ce2c31]",
      icon: Clock,
      label: formatDaysLabel(task.daysPending, true),
    }
  }

  if (task.daysPending >= 4) {
    return {
      className: "bg-[#fefbe9] text-[#ab6400]",
      icon: Clock,
      label: formatDaysLabel(task.daysPending, false),
    }
  }

  return {
    className: "bg-[#edeef0] text-[#43484e]",
    icon: Clock,
    label: formatDaysLabel(task.daysPending, false),
  }
}

function formatCertificacionTaskLabel(task: CertificacionTask): string {
  return `${task.taskName} (${task.floorName} - ${task.unitLabel})`
}

function buildCertifySummary(task: CertificacionTask): CertificarTareaSummary {
  return {
    taskName: task.taskName,
    floorLabel: task.floorName,
    unitLabel: task.unitLabel,
    rubroName: task.rubroName,
    authorName: task.authorName,
  }
}

function StatCard({
  icon: Icon,
  iconClassName,
  iconColorClassName,
  count,
  label,
}: {
  icon: typeof ListTodo
  iconClassName: string
  iconColorClassName: string
  count: number
  label: string
}) {
  return (
    <div
      className="flex flex-1 items-center gap-4 rounded-[12px] border border-[#edeef0] bg-white px-4 py-[17px]"
      style={{ boxShadow: CERTIFICACIONES_SHADOW.card }}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-[31px] shrink-0 items-center justify-center rounded-[10px]",
            iconClassName,
          )}
        >
          <Icon className={cn("size-4", iconColorClassName)} aria-hidden />
        </div>
        <span className={CERTIFICACIONES_TYPE.statNumber}>{count}</span>
      </div>
      <span className={CERTIFICACIONES_TYPE.statLabel}>{label}</span>
    </div>
  )
}

function StatusToggle({
  value,
  onChange,
}: {
  value: StatusFilter
  onChange: (value: StatusFilter) => void
}) {
  return (
    <div className="flex h-[40px] rounded-[10px] border border-[#edeef0] bg-[#edeef0] p-1">
      {(
        [
          { value: "pending" as const, label: "Pendientes" },
          { value: "certified" as const, label: "Certificadas" },
        ] as const
      ).map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "flex flex-1 items-center justify-center rounded-[8px] px-3 transition-colors",
            CERTIFICACIONES_TYPE.toggle,
            value === option.value
              ? "bg-white text-[#272a2d]"
              : "text-[#696e77] hover:text-[#43484e]",
          )}
          style={value === option.value ? { boxShadow: CERTIFICACIONES_SHADOW.toggleActive } : undefined}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function TaskCard({
  task,
  checked,
  onCheckedChange,
  onCertify,
  onView,
  canCertify,
  isCertifying,
  showCheckbox,
}: {
  task: CertificacionTask
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  onCertify: () => void
  onView: () => void
  canCertify: boolean
  isCertifying: boolean
  showCheckbox: boolean
}) {
  const urgency = getUrgencyBadge(task)

  return (
    <div className="rounded-[12px] border border-[#edeef0] bg-white p-[13px]">
      <div className="flex items-center gap-3">
        {showCheckbox ? (
          <CertificacionCheckbox
            checked={checked}
            onCheckedChange={onCheckedChange}
            ariaLabel={`Seleccionar ${task.taskName}`}
          />
        ) : (
          <div className="size-4 shrink-0" aria-hidden />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={CERTIFICACIONES_TYPE.taskTitle}>{task.taskName}</h3>
                <span className={CERTIFICACIONES_TYPE.taskRubro}>{task.rubroName}</span>
              </div>
              <p className={CERTIFICACIONES_TYPE.taskMeta}>
                {task.floorName} • {task.unitLabel} • {task.authorName} •{" "}
                {task.formattedDate} · {task.formattedTime}
              </p>
            </div>

            {task.comment ? (
              <div className="flex items-center gap-1">
                <MessageCircle
                  className="size-4 shrink-0 text-[#777b84]"
                  aria-hidden
                />
                <span className={cn(CERTIFICACIONES_TYPE.taskComment, "line-clamp-1")}>
                  {task.comment}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {task.status === "certified" ? (
            <span className={CERTIFICADA_BADGE.pill}>
              <ShieldCheck className="size-2.5 shrink-0" aria-hidden />
              Certificada
            </span>
          ) : (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-[12px] px-2 py-1",
                CERTIFICACIONES_TYPE.badge,
                urgency.className,
              )}
            >
              <urgency.icon className="size-3" aria-hidden />
              {urgency.label}
            </span>
          )}

          <div className="flex items-center gap-2">
            {task.status === "pending" && canCertify ? (
              <button
                type="button"
                onClick={onCertify}
                disabled={isCertifying}
                className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#ff7433] px-3 py-1.5 disabled:opacity-50"
              >
                <BadgeCheck className="size-3 text-white" aria-hidden />
                <span className={CERTIFICACIONES_TYPE.certificarBtn}>Certificar</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={onView}
              className="inline-flex size-8 items-center justify-center rounded-[10px] bg-[#edeef0] text-[#43484e] transition-colors hover:bg-[#e2e4e8]"
              aria-label={`Ver detalle de ${task.taskName}`}
            >
              <Eye className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CertificacionesView({ projectId, initialData }: Props) {
  const router = useRouter()
  const toast = useToast()

  const [tasks, setTasks] = useState(initialData.tasks)
  const [canCertify] = useState(initialData.canCertify)
  const [members] = useState(initialData.members)

  const [fromDate, setFromDate] = useState<Date | undefined>(undefined)
  const [toDate, setToDate] = useState<Date | undefined>(undefined)
  const [selectedMemberId, setSelectedMemberId] = useState(ALL_MEMBERS_VALUE)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending")
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [isCertifying, setIsCertifying] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedTaskStatus, setSelectedTaskStatus] = useState<"pending" | "certified">("pending")
  const [taskDetailOpen, setTaskDetailOpen] = useState(false)
  const [listCertifyOpen, setListCertifyOpen] = useState(false)
  const [listCertifyEntryIds, setListCertifyEntryIds] = useState<string[]>([])
  const [listCertifyError, setListCertifyError] = useState<string | null>(null)

  const pendingTasks = useMemo(
    () => tasks.filter((task) => task.status === "pending"),
    [tasks],
  )

  const urgentCount = useMemo(
    () => pendingTasks.filter((task) => task.isUrgent).length,
    [pendingTasks],
  )

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.status !== statusFilter) return false

      if (selectedMemberId !== ALL_MEMBERS_VALUE && task.authorId !== selectedMemberId) {
        return false
      }

      const taskDate = new Date(task.occurredAt)
      if (fromDate && taskDate < startOfDay(fromDate)) return false
      if (toDate && taskDate > endOfDay(toDate)) return false

      return true
    })
  }, [tasks, statusFilter, selectedMemberId, fromDate, toDate])

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE))

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredTasks.slice(start, start + PAGE_SIZE)
  }, [filteredTasks, currentPage])

  const selectableFilteredIds = useMemo(
    () =>
      filteredTasks
        .filter((task) => task.status === "pending")
        .map((task) => task.entryId),
    [filteredTasks],
  )

  const allFilteredSelected =
    selectableFilteredIds.length > 0 &&
    selectableFilteredIds.every((entryId) => selectedEntryIds.has(entryId))

  const someFilteredSelected = selectableFilteredIds.some((entryId) =>
    selectedEntryIds.has(entryId),
  )

  const selectedPendingCount = useMemo(
    () =>
      [...selectedEntryIds].filter((entryId) =>
        pendingTasks.some((task) => task.entryId === entryId),
      ).length,
    [selectedEntryIds, pendingTasks],
  )

  const toggleSelectAll = () => {
    setSelectedEntryIds((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        for (const entryId of selectableFilteredIds) next.delete(entryId)
      } else {
        for (const entryId of selectableFilteredIds) next.add(entryId)
      }
      return next
    })
  }

  const toggleTaskSelection = (entryId: string, checked: boolean) => {
    setSelectedEntryIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(entryId)
      else next.delete(entryId)
      return next
    })
  }

  const handleCertify = async (
    entryIds: string[],
    notesByEntryId?: Record<string, string>,
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    if (entryIds.length === 0 || !canCertify) {
      return { ok: false, error: "No tenés permisos para certificar tareas." }
    }

    setIsCertifying(true)
    const result = await certifyProgressEntries(projectId, entryIds, notesByEntryId)
    setIsCertifying(false)

    if (!result.ok) {
      toast.error(result.error)
      return { ok: false, error: result.error }
    }

    setTasks((prev) =>
      prev.map((task) =>
        entryIds.includes(task.entryId)
          ? { ...task, status: "certified" as const, isUrgent: false }
          : task,
      ),
    )
    setSelectedEntryIds((prev) => {
      const next = new Set(prev)
      for (const entryId of entryIds) next.delete(entryId)
      return next
    })

    toast.success(
      result.certifiedCount === 1
        ? "Tarea certificada exitosamente"
        : `${result.certifiedCount} tareas certificadas exitosamente`,
    )
    router.refresh()
    return { ok: true }
  }

  const selectedPendingEntryIds = useMemo(
    () =>
      [...selectedEntryIds].filter((entryId) =>
        pendingTasks.some((task) => task.entryId === entryId),
      ),
    [selectedEntryIds, pendingTasks],
  )

  const listCertifyTasks = useMemo(
    () =>
      listCertifyEntryIds
        .map((entryId) => tasks.find((task) => task.entryId === entryId))
        .filter((task): task is CertificacionTask => task != null),
    [listCertifyEntryIds, tasks],
  )

  const listCertifySummary = useMemo(
    () => (listCertifyTasks.length === 1 ? buildCertifySummary(listCertifyTasks[0]) : null),
    [listCertifyTasks],
  )

  const openListCertify = (entryIds: string[]) => {
    setListCertifyEntryIds(entryIds)
    setListCertifyError(null)
    setListCertifyOpen(true)
  }

  const handleListCertifyConfirm = async (notes: string) => {
    const trimmed = notes.trim()
    const notesByEntryId = trimmed
      ? Object.fromEntries(listCertifyEntryIds.map((entryId) => [entryId, trimmed]))
      : undefined

    const result = await handleCertify(listCertifyEntryIds, notesByEntryId)
    if (!result.ok) {
      setListCertifyError(result.error)
      return
    }

    setListCertifyOpen(false)
    setListCertifyEntryIds([])
    setListCertifyError(null)
  }

  const handleStatusFilterChange = (value: StatusFilter) => {
    setStatusFilter(value)
    setCurrentPage(1)
    setSelectedEntryIds(new Set())
  }

  const subtitle =
    statusFilter === "pending"
      ? `${pendingTasks.length} tarea${pendingTasks.length === 1 ? "" : "s"} pendiente${pendingTasks.length === 1 ? "" : "s"} de certificación`
      : `${tasks.filter((task) => task.status === "certified").length} tarea${tasks.filter((task) => task.status === "certified").length === 1 ? "" : "s"} certificada${tasks.filter((task) => task.status === "certified").length === 1 ? "" : "s"}`

  const showCheckbox = statusFilter === "pending" && canCertify

  return (
    <div className="flex flex-col gap-8 px-24 py-6">
      <div className="flex flex-col gap-2">
        <h1 className={CERTIFICACIONES_TYPE.pageTitle}>Certificación de Tareas</h1>
        <p className={CERTIFICACIONES_TYPE.pageSubtitle}>{subtitle}</p>
      </div>

      <div className="flex flex-col gap-4">
        {statusFilter === "pending" ? (
          <div className="flex gap-3">
            <StatCard
              icon={ListTodo}
              iconClassName="bg-[#e6f4fe]"
              iconColorClassName="text-[#0d74ce]"
              count={pendingTasks.length}
              label="Pendientes"
            />
            <StatCard
              icon={Info}
              iconClassName="bg-[#feebec]"
              iconColorClassName="text-[#ce2c31]"
              count={urgentCount}
              label="Urgentes (+7 días)"
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <div
            className="flex flex-col gap-6 rounded-[14px] border border-[#edeef0] bg-white px-[25px] pb-[25px] pt-[25px]"
            style={{ boxShadow: CERTIFICACIONES_SHADOW.mainCard }}
          >
            <div className="flex gap-2">
              <div className={filterFieldClassName}>
                <Label className={CERTIFICACIONES_TYPE.filterLabel}>Desde</Label>
                <DatePicker
                  value={fromDate}
                  onChange={(date) => {
                    setFromDate(date)
                    setCurrentPage(1)
                  }}
                  toDate={toDate}
                  placeholder="01/05/2026"
                  className={filterControlClassName}
                />
              </div>

              <div className={filterFieldClassName}>
                <Label className={CERTIFICACIONES_TYPE.filterLabel}>Hasta</Label>
                <DatePicker
                  value={toDate}
                  onChange={(date) => {
                    setToDate(date)
                    setCurrentPage(1)
                  }}
                  fromDate={fromDate}
                  placeholder="07/05/2026"
                  className={filterControlClassName}
                />
              </div>

              <div className={filterFieldClassName}>
                <Label className={CERTIFICACIONES_TYPE.filterLabel}>Miembro</Label>
                <Select
                  value={selectedMemberId}
                  onValueChange={(value) => {
                    setSelectedMemberId(value)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger
                    aria-label="Filtrar por miembro"
                    className={cn(filterControlClassName, "text-[#777b84]")}
                  >
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_MEMBERS_VALUE}>Todos</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className={filterFieldClassName}>
                <Label className={CERTIFICACIONES_TYPE.filterLabel}>Estado</Label>
                <StatusToggle value={statusFilter} onChange={handleStatusFilterChange} />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {statusFilter === "pending" ? (
                <div className="flex items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2">
                    <CertificacionCheckbox
                      checked={allFilteredSelected}
                      indeterminate={!allFilteredSelected && someFilteredSelected}
                      onCheckedChange={() => toggleSelectAll()}
                      disabled={!showCheckbox}
                      ariaLabel="Seleccionar todas las tareas"
                    />
                    <span className={CERTIFICACIONES_TYPE.selectAll}>Seleccionar todas</span>
                  </label>

                  {selectedPendingCount > 0 && canCertify ? (
                    <button
                      type="button"
                      onClick={() => openListCertify(selectedPendingEntryIds)}
                      disabled={isCertifying}
                      className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#ff7433] px-3 py-1.5 disabled:opacity-50"
                    >
                      <BadgeCheck className="size-3 text-white" aria-hidden />
                      <span className={CERTIFICACIONES_TYPE.certificarBtn}>
                        {isCertifying
                          ? "..."
                          : `Certificar (${selectedPendingCount})`}
                      </span>
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-col gap-2">
                {paginatedTasks.length === 0 ? (
                  <div className="rounded-[12px] border border-dashed border-[#edeef0] px-4 py-10 text-center text-[14px] text-[#777b84]">
                    {statusFilter === "pending"
                      ? "No hay tareas pendientes de certificación para los filtros seleccionados."
                      : "No hay tareas certificadas para los filtros seleccionados."}
                  </div>
                ) : (
                  paginatedTasks.map((task) => (
                    <TaskCard
                      key={task.entryId}
                      task={task}
                      checked={selectedEntryIds.has(task.entryId)}
                      onCheckedChange={(checked) =>
                        toggleTaskSelection(task.entryId, checked)
                      }
                      onCertify={() => openListCertify([task.entryId])}
                      onView={() => {
                        setSelectedTaskId(task.entryId)
                        setSelectedTaskStatus(task.status)
                        setTaskDetailOpen(true)
                      }}
                      canCertify={canCertify}
                      isCertifying={isCertifying}
                      showCheckbox={showCheckbox}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {filteredTasks.length > 0 ? (
            <div className="flex h-8 items-center justify-between">
              <p className={CERTIFICACIONES_TYPE.footer}>
                Mostrando {paginatedTasks.length} de {filteredTasks.length} tarea
                {filteredTasks.length === 1 ? "" : "s"}
              </p>

              {totalPages > 1 ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className={cn(
                      "rounded-[10px] border border-[#afb3ba] px-[13px] py-1.5 disabled:opacity-40",
                      CERTIFICACIONES_TYPE.paginationBtn,
                      "text-[#43484e]",
                    )}
                  >
                    Anterior
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "inline-flex size-8 items-center justify-center rounded-[10px]",
                        CERTIFICACIONES_TYPE.paginationBtn,
                        page === currentPage
                          ? "bg-[#ff7433] text-white"
                          : "border border-[#afb3ba] text-[#45556c]",
                      )}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className={cn(
                      "rounded-[10px] border border-[#afb3ba] px-[13px] py-1.5 disabled:opacity-40",
                      CERTIFICACIONES_TYPE.paginationBtn,
                      "text-[#43484e]",
                    )}
                  >
                    Siguiente
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <CertificacionTaskDetailDialog
        open={taskDetailOpen}
        onOpenChange={setTaskDetailOpen}
        projectId={projectId}
        entryId={selectedTaskId}
        certificationStatus={selectedTaskStatus}
        canCertify={canCertify}
        isCertifying={isCertifying}
        onCertify={async (entryId, notes) => {
          const result = await handleCertify(
            [entryId],
            notes ? { [entryId]: notes } : undefined,
          )
          if (!result.ok) {
            throw new Error(result.error)
          }
        }}
        onSaved={() => router.refresh()}
      />

      {listCertifyEntryIds.length > 1 ? (
        <CertificarTareasDialog
          open={listCertifyOpen}
          onOpenChange={(open) => {
            if (!open) {
              setListCertifyError(null)
              setListCertifyEntryIds([])
            }
            setListCertifyOpen(open)
          }}
          tasks={listCertifyTasks.map((task) => ({
            entryId: task.entryId,
            label: formatCertificacionTaskLabel(task),
          }))}
          isCertifying={isCertifying}
          error={listCertifyError}
          onConfirm={(notes) => void handleListCertifyConfirm(notes)}
        />
      ) : (
        <CertificarTareaDialog
          open={listCertifyOpen}
          onOpenChange={(open) => {
            if (!open) {
              setListCertifyError(null)
              setListCertifyEntryIds([])
            }
            setListCertifyOpen(open)
          }}
          summary={listCertifySummary}
          isCertifying={isCertifying}
          error={listCertifyError}
          onConfirm={(notes) => void handleListCertifyConfirm(notes)}
        />
      )}
    </div>
  )
}
