"use client"

import { useEffect, useState } from "react"
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  History,
  Pencil,
} from "lucide-react"
import { InProcessStatusIcon } from "@/components/icons/InProcessStatusIcon"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import {
  CARGAR_AVANCE_BADGE_CLASSNAME,
  CARGAR_AVANCE_BADGE_STYLES,
  CARGAR_AVANCE_STATUS_LABELS,
  type CargarAvanceTaskStatus,
} from "@/lib/projects/cargarAvance"
import { getFloorShortLabel } from "@/lib/projects/floorLabels"
import { cn } from "@/lib/utils"
import {
  getTrabajoDiarioTaskDetail,
  updateTrabajoDiarioTask,
  type TrabajoDiarioTaskDetail,
  type TrabajoDiarioTaskHistoryItem,
  type TrabajoDiarioTaskStatus,
} from "./actions"

type EditableTaskStatus = Exclude<CargarAvanceTaskStatus, "pending">

const STATUS_BUTTON_STYLES: Array<{
  status: EditableTaskStatus
  label: string
  activeClassName: string
  activeIconClassName: string
}> = [
  {
    status: "completed",
    label: "Completado",
    activeClassName: "border-[#56BA9F] bg-[#F4FBF7] text-[#56BA9F]",
    activeIconClassName: "text-[#56BA9F]",
  },
  {
    status: "in_progress",
    label: "En Proceso",
    activeClassName: "border-[#c9a227] bg-[#FFFCF0] text-[#4f3422]",
    activeIconClassName: "text-[#c9a227]",
  },
  {
    status: "blocked",
    label: "Bloqueado",
    activeClassName: "border-[#c62828] bg-[#FFF5F5] text-[#641723]",
    activeIconClassName: "text-[#c62828]",
  },
]

function mapTrabajoDiarioStatusToDraft(status: TrabajoDiarioTaskStatus): EditableTaskStatus {
  switch (status) {
    case "Completado":
      return "completed"
    case "En Proceso":
      return "in_progress"
    case "Bloqueado":
      return "blocked"
  }
}

function TaskStatusIcon({ status }: { status: TrabajoDiarioTaskStatus | EditableTaskStatus }) {
  const draftStatus =
    status === "Completado" || status === "En Proceso" || status === "Bloqueado"
      ? mapTrabajoDiarioStatusToDraft(status)
      : status

  switch (draftStatus) {
    case "completed":
      return <CheckCircle2 className="size-4 shrink-0 text-[#208368]" aria-hidden />
    case "in_progress":
      return <InProcessStatusIcon className="size-4 text-[#c9a227]" />
    case "blocked":
      return <AlertCircle className="size-4 shrink-0 text-[#c62828]" aria-hidden />
    default:
      return null
  }
}

function StatusOptionIcon({
  status,
  active,
  activeIconClassName,
}: {
  status: EditableTaskStatus
  active: boolean
  activeIconClassName?: string
}) {
  const inactiveClassName = "text-[#afb3ba]"

  switch (status) {
    case "completed":
      return (
        <CheckCircle2
          className={cn(
            "size-5 shrink-0",
            active ? activeIconClassName ?? "text-[#56BA9F]" : inactiveClassName,
          )}
          aria-hidden
        />
      )
    case "in_progress":
      return (
        <InProcessStatusIcon
          className={cn(active ? activeIconClassName ?? "text-[#c9a227]" : inactiveClassName)}
        />
      )
    case "blocked":
      return (
        <AlertCircle
          className={cn(
            "size-5 shrink-0",
            active ? activeIconClassName ?? "text-[#c62828]" : inactiveClassName,
          )}
          aria-hidden
        />
      )
  }
}

function StatusBadge({ status }: { status: TrabajoDiarioTaskStatus }) {
  const draftStatus = mapTrabajoDiarioStatusToDraft(status)

  return (
    <span
      className={cn(
        CARGAR_AVANCE_BADGE_CLASSNAME,
        CARGAR_AVANCE_BADGE_STYLES[draftStatus],
        "inline-flex items-center gap-1.5",
      )}
    >
      <TaskStatusIcon status={status} />
      {CARGAR_AVANCE_STATUS_LABELS[draftStatus]}
    </span>
  )
}

function HistoryItem({ item }: { item: TrabajoDiarioTaskHistoryItem }) {
  return (
    <div className="flex items-start gap-3 rounded-[10px] border border-[#edeef0] bg-white px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusBadge status={item.status} />
          <span className="text-[12px] text-[#777b84]">{item.formattedDate}</span>
        </div>
        {item.comment ? (
          <p className="mt-2 text-[14px] leading-[1.5] text-[#272a2d]">{item.comment}</p>
        ) : null}
        <p className="mt-1 text-[12px] text-[#777b84]">Por: {item.authorName}</p>
      </div>
      <button
        type="button"
        disabled={item.attachmentCount === 0}
        aria-label={
          item.attachmentCount > 0
            ? `${item.attachmentCount} fotos adjuntas`
            : "Sin fotografías"
        }
        className="flex size-9 shrink-0 items-center justify-center rounded-[8px] border border-[#edeef0] bg-white text-[#777b84] disabled:opacity-40"
      >
        <Camera className="size-4" aria-hidden />
      </button>
    </div>
  )
}

type TaskDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  entryId: string | null
  onEntryIdChange: (entryId: string) => void
  onSaved: () => void
}

export function TaskDetailDialog({
  open,
  onOpenChange,
  projectId,
  entryId,
  onEntryIdChange,
  onSaved,
}: TaskDetailDialogProps) {
  const [detail, setDetail] = useState<TrabajoDiarioTaskDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"view" | "edit">("view")
  const [historyOpen, setHistoryOpen] = useState(true)
  const [draftStatus, setDraftStatus] = useState<EditableTaskStatus>("in_progress")
  const [draftComment, setDraftComment] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !entryId) {
      setDetail(null)
      setMode("view")
      setSaveError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setSaveError(null)

    void getTrabajoDiarioTaskDetail(projectId, entryId).then((result) => {
      if (cancelled) return
      setDetail(result)
      if (result) {
        setDraftStatus(mapTrabajoDiarioStatusToDraft(result.status))
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [entryId, open, projectId])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setMode("view")
      setDraftComment("")
      setSaveError(null)
    }
    onOpenChange(nextOpen)
  }

  const handleStartEdit = () => {
    if (!detail) return
    setDraftStatus(mapTrabajoDiarioStatusToDraft(detail.status))
    setDraftComment("")
    setSaveError(null)
    setMode("edit")
  }

  const handleCancelEdit = () => {
    setMode("view")
    setDraftComment("")
    setSaveError(null)
  }

  const handleSave = async () => {
    if (!entryId) return

    setSaving(true)
    setSaveError(null)

    const result = await updateTrabajoDiarioTask({
      projectId,
      entryId,
      taskStatus: draftStatus,
      comment: draftComment,
    })

    setSaving(false)

    if (!result.ok) {
      setSaveError(result.error)
      return
    }

    onEntryIdChange(result.entryId)
    const refreshed = await getTrabajoDiarioTaskDetail(projectId, result.entryId)
    setDetail(refreshed)
    setMode("view")
    setDraftComment("")
    onSaved()
  }

  const subtitle = detail
    ? `${getFloorShortLabel(detail.floorName)} • Unidad ${detail.unitCode} • ${detail.formattedLongDate}`
    : ""

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 p-0">
        <div className="border-b border-[#edeef0] px-6 pt-6 pb-5">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-recoleta text-[24px] font-normal leading-[1.2] text-[#272a2d]">
                {detail?.taskName ?? "Detalle de tarea"}
              </DialogTitle>
              {detail ? (
                <DialogDescription className="mt-2 text-[14px] leading-[1.5] text-[#777b84]">
                  {subtitle}
                </DialogDescription>
              ) : null}
            </div>

            {mode === "view" && detail ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-medium text-[#ff7433] transition-colors hover:text-[#e5662d]"
              >
                <Pencil className="size-4" aria-hidden />
                Editar Estado
              </button>
            ) : null}

            {mode === "edit" ? (
              <span className="shrink-0 rounded-[8px] bg-[#fff1ea] px-3 py-1 text-[12px] font-medium text-[#ff7433]">
                Editando
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex max-h-[calc(90vh-180px)] flex-col overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Spinner className="size-6" />
            </div>
          ) : !detail ? (
            <p className="text-[14px] text-[#777b84]">No se pudo cargar el detalle de la tarea.</p>
          ) : mode === "view" ? (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <p className="text-[12px] text-[#777b84]">Estado</p>
                  <StatusBadge status={detail.status} />
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-[12px] text-[#777b84]">Rubro</p>
                  <p className="text-[14px] text-[#272a2d]">{detail.rubroName}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[12px] text-[#777b84]">Comentarios</p>
                <div className="rounded-[10px] bg-[#f5f6f7] px-4 py-3 text-[14px] leading-[1.5] text-[#272a2d]">
                  {detail.comment?.trim() ? detail.comment : "Sin comentarios"}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Camera className="size-4 text-[#777b84]" aria-hidden />
                  <p className="text-[12px] text-[#777b84]">Fotografías</p>
                </div>
                <div className="flex items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#afb3ba] bg-white px-4 py-8 text-[14px] text-[#777b84]">
                  <Camera className="size-4" aria-hidden />
                  {detail.attachmentCount > 0
                    ? `${detail.attachmentCount} foto${detail.attachmentCount === 1 ? "" : "s"} adjunta${detail.attachmentCount === 1 ? "" : "s"}`
                    : "Sin fotografías"}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setHistoryOpen((value) => !value)}
                  className="flex items-center justify-between rounded-[10px] border border-[#edeef0] bg-[#fafafa] px-4 py-3 text-left"
                >
                  <span className="inline-flex items-center gap-2 text-[14px] font-medium text-[#272a2d]">
                    <History className="size-4 text-[#777b84]" aria-hidden />
                    Ver Historial de Cambios
                  </span>
                  {historyOpen ? (
                    <ChevronUp className="size-4 text-[#777b84]" aria-hidden />
                  ) : (
                    <ChevronDown className="size-4 text-[#777b84]" aria-hidden />
                  )}
                </button>

                {historyOpen ? (
                  <div className="flex flex-col gap-2">
                    {detail.history.map((item) => (
                      <HistoryItem key={item.id} item={item} />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                <p className="text-[14px] font-medium text-[#272a2d]">
                  Actualizar Estado de la tarea
                </p>
                <div className="flex flex-col gap-2">
                  <p className="text-[12px] text-[#777b84]">Nuevo Estado</p>
                  <div className="grid grid-cols-3 gap-2">
                    {STATUS_BUTTON_STYLES.map((option) => {
                      const isActive = draftStatus === option.status
                      return (
                        <button
                          key={option.status}
                          type="button"
                          onClick={() => setDraftStatus(option.status)}
                          className={cn(
                            "flex h-[44px] items-center justify-center gap-2 rounded-[10px] border bg-white px-3 text-[14px] font-medium transition-colors",
                            isActive
                              ? option.activeClassName
                              : "border-[#edeef0] text-[#272a2d] hover:bg-[#fafafa]",
                          )}
                        >
                          <StatusOptionIcon
                            status={option.status}
                            active={isActive}
                            activeIconClassName={option.activeIconClassName}
                          />
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="task-update-comment"
                  className="text-[12px] font-normal text-[#777b84]"
                >
                  Comentarios sobre el cambio
                </label>
                <textarea
                  id="task-update-comment"
                  value={draftComment}
                  onChange={(event) => setDraftComment(event.target.value)}
                  rows={4}
                  placeholder="Describí el motivo del cambio de Estado..."
                  className="w-full resize-none rounded-[10px] border border-[#afb3ba] bg-white px-3 py-2.5 text-[14px] text-[#272a2d] outline-none focus:border-[#ff7433]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Camera className="size-4 text-[#777b84]" aria-hidden />
                  <p className="text-[12px] font-normal text-[#777b84]">Fotografías</p>
                </div>
                <button
                  type="button"
                  disabled
                  className="flex items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#afb3ba] bg-white px-4 py-8 text-[14px] text-[#777b84]"
                >
                  <Camera className="size-4" aria-hidden />
                  Subir fotos
                </button>
              </div>

              {saveError ? <p className="text-[14px] text-[#641723]">{saveError}</p> : null}
            </div>
          )}
        </div>

        <div className="border-t border-[#edeef0] px-6 py-5">
          {mode === "view" ? (
            <Button
              variant="brand"
              size="brand"
              className="h-[44px] w-full rounded-[12px] text-[14px] font-medium shadow-[0_4px_14px_rgba(241,132,77,0.35)]"
              onClick={() => handleOpenChange(false)}
            >
              Cerrar
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-[44px] w-full rounded-[12px] border-[#afb3ba] bg-white text-[14px] font-medium text-[#272a2d] shadow-none hover:bg-[#fafafa]"
                disabled={saving}
                onClick={handleCancelEdit}
              >
                Cancelar
              </Button>
              <Button
                variant="brand"
                size="brand"
                className="h-[44px] w-full rounded-[12px] text-[14px] font-medium shadow-[0_4px_14px_rgba(241,132,77,0.35)]"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? <Spinner className="size-4" /> : null}
                Guardar cambio
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
