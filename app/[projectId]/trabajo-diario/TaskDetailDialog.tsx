"use client"

import { useEffect, useState, type ReactNode } from "react"
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
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
import { ProgressPhotoGalleryDialog } from "@/components/progress/ProgressPhotoGalleryDialog"
import { ProgressPhotoUpload } from "@/components/progress/ProgressPhotoUpload"
import {
  CARGAR_AVANCE_STATUS_LABELS,
  createEmptyTaskDraft,
  revokeTaskDraftPhotos,
  type CargarAvancePhotoDraft,
  type CargarAvanceTaskStatus,
} from "@/lib/projects/cargarAvance"
import { buildAttachmentsForSingleEntry } from "@/lib/progress/linkProgressPhotos.client"
import { getFloorShortLabel } from "@/lib/projects/floorLabels"
import { cn } from "@/lib/utils"
import {
  getTrabajoDiarioTaskDetail,
  registerProgressAttachments,
  updateTrabajoDiarioTask,
  type TrabajoDiarioTaskDetail,
  type TrabajoDiarioTaskAttachment,
  type TrabajoDiarioTaskHistoryItem,
  type TrabajoDiarioTaskStatus,
} from "./actions"

type EditableTaskStatus = Exclude<CargarAvanceTaskStatus, "pending">

const FIELD_LABEL_CLASSNAME =
  "text-[12px] font-normal leading-4 tracking-[-0.36px] text-[#777b84]"
const READONLY_BOX_CLASSNAME =
  "rounded-[10px] bg-[#f5f6f7] px-4 py-3 text-[14px] leading-normal text-[#272a2d]"

const DETAIL_STATUS_PILL_CLASSNAME =
  "inline-flex w-fit items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[12px] font-medium leading-4"

const DETAIL_STATUS_PILL_STYLES: Record<EditableTaskStatus, string> = {
  completed: "bg-[#d6f1e3] text-[#208368]",
  in_progress: "bg-[#fff7c2] text-[#4f3422]",
  blocked: "bg-[#ffdbdc] text-[#641723]",
}

const HISTORY_STATUS_TEXT_STYLES: Record<TrabajoDiarioTaskStatus, string> = {
  Completado: "text-[#208368]",
  "En Proceso": "text-[#ff7433]",
  Bloqueado: "text-[#641723]",
}

const EDIT_STATE_BADGE_CLASSNAME =
  "inline-flex shrink-0 items-center rounded-[10px] bg-[#FEFCFB] px-2 py-1.5 text-[14px] font-medium text-[#ff7433]"

function formatPhotoCount(count: number): string {
  if (count === 0) return "Sin fotografías"
  if (count === 1) return "1 foto adjunta"
  return `${count} fotos adjuntas`
}

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

function TaskStatusIcon({
  status,
  tone = "default",
}: {
  status: TrabajoDiarioTaskStatus | EditableTaskStatus
  tone?: "default" | "history"
}) {
  const draftStatus =
    status === "Completado" || status === "En Proceso" || status === "Bloqueado"
      ? mapTrabajoDiarioStatusToDraft(status)
      : status

  switch (draftStatus) {
    case "completed":
      return <CheckCircle2 className="size-4 shrink-0 text-[#208368]" aria-hidden />
    case "in_progress":
      return (
        <InProcessStatusIcon
          className={cn("size-4", tone === "history" ? "text-[#ff7433]" : "text-[#c9a227]")}
        />
      )
    case "blocked":
      return <AlertCircle className="size-4 shrink-0 text-[#641723]" aria-hidden />
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

function DetailStatusPill({ status }: { status: TrabajoDiarioTaskStatus }) {
  const draftStatus = mapTrabajoDiarioStatusToDraft(status)

  return (
    <span className={cn(DETAIL_STATUS_PILL_CLASSNAME, DETAIL_STATUS_PILL_STYLES[draftStatus])}>
      <TaskStatusIcon status={status} />
      {CARGAR_AVANCE_STATUS_LABELS[draftStatus]}
    </span>
  )
}

function HistoryStatusLabel({ status }: { status: TrabajoDiarioTaskStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[12px] font-medium leading-4",
        HISTORY_STATUS_TEXT_STYLES[status],
      )}
    >
      <TaskStatusIcon status={status} tone="history" />
      {status}
    </span>
  )
}

function HistoryItem({
  item,
  onViewPhotos,
}: {
  item: TrabajoDiarioTaskHistoryItem
  onViewPhotos: (item: TrabajoDiarioTaskHistoryItem) => void
}) {
  const hasPhotos = item.attachments.length > 0
  const hasComment = Boolean(item.comment?.trim())

  return (
    <div className="rounded-[10px] bg-[#f5f6f7] px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <HistoryStatusLabel status={item.status} />
            <span className="shrink-0 text-[12px] leading-4 text-[#777b84]">{item.formattedDate}</span>
          </div>
          <p
            className={cn(
              "mt-2 text-[14px] leading-normal",
              hasComment ? "text-[#272a2d]" : "text-[#777b84]",
            )}
          >
            {hasComment ? item.comment : "Sin comentarios"}
          </p>
          <p className="mt-1.5 text-[12px] leading-4 text-[#777b84]">Por: {item.authorName}</p>
        </div>
        <button
          type="button"
          disabled={!hasPhotos}
          onClick={() => onViewPhotos(item)}
          aria-label={
            hasPhotos
              ? `Ver ${item.attachments.length} foto${item.attachments.length === 1 ? "" : "s"}`
              : "Sin fotografías"
          }
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-[#edeef0] bg-white text-[#777b84]",
            hasPhotos
              ? "cursor-pointer transition-colors hover:border-[#ff7433] hover:text-[#ff7433]"
              : "cursor-default opacity-50",
          )}
        >
          <Camera className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}

function DetailField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className={FIELD_LABEL_CLASSNAME}>{label}</p>
      {children}
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
  const [draftPhotos, setDraftPhotos] = useState<CargarAvancePhotoDraft[]>([])
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryTitle, setGalleryTitle] = useState("")
  const [galleryDescription, setGalleryDescription] = useState<string | undefined>()
  const [galleryPhotos, setGalleryPhotos] = useState<TrabajoDiarioTaskAttachment[]>([])

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
      revokeTaskDraftPhotos({ ...createEmptyTaskDraft(), photos: draftPhotos })
      setDraftPhotos([])
      setMode("view")
      setDraftComment("")
      setSaveError(null)
      setSaveStatus(null)
    }
    onOpenChange(nextOpen)
  }

  const handleStartEdit = () => {
    if (!detail) return
    setDraftStatus(mapTrabajoDiarioStatusToDraft(detail.status))
    setDraftComment("")
    revokeTaskDraftPhotos({ ...createEmptyTaskDraft(), photos: draftPhotos })
    setDraftPhotos([])
    setSaveError(null)
    setSaveStatus(null)
    setMode("edit")
  }

  const handleCancelEdit = () => {
    revokeTaskDraftPhotos({ ...createEmptyTaskDraft(), photos: draftPhotos })
    setDraftPhotos([])
    setMode("view")
    setDraftComment("")
    setSaveError(null)
    setSaveStatus(null)
  }

  const handleSave = async () => {
    if (!entryId) return

    setSaving(true)
    setSaveError(null)
    setSaveStatus("Guardando cambio...")

    const result = await updateTrabajoDiarioTask({
      projectId,
      entryId,
      taskStatus: draftStatus,
      comment: draftComment,
    })

    if (!result.ok) {
      setSaving(false)
      setSaveStatus(null)
      setSaveError(result.error)
      return
    }

    if (draftPhotos.length > 0) {
      setSaveStatus("Subiendo fotos...")

      const batchId = crypto.randomUUID()
      const photoResult = await buildAttachmentsForSingleEntry({
        projectId,
        batchId,
        entryId: result.entryId,
        photos: draftPhotos.map((photo) => photo.file),
        onUploadProgress: (completed, total) => {
          setSaveStatus(`Subiendo fotos (${completed}/${total})...`)
        },
      })

      if (!photoResult.ok) {
        setSaving(false)
        setSaveStatus(null)
        setSaveError(
          `${photoResult.error} El cambio se guardó, pero las fotos no. Podés volver a editarlo.`,
        )
        return
      }

      if (photoResult.attachments.length > 0) {
        const registerResult = await registerProgressAttachments(
          projectId,
          photoResult.attachments,
        )

        if (!registerResult.ok) {
          setSaving(false)
          setSaveStatus(null)
          setSaveError(
            `${registerResult.error} El cambio se guardó, pero las fotos no quedaron vinculadas.`,
          )
          return
        }
      }
    }

    onEntryIdChange(result.entryId)
    const refreshed = await getTrabajoDiarioTaskDetail(projectId, result.entryId)
    setDetail(refreshed)
    revokeTaskDraftPhotos({ ...createEmptyTaskDraft(), photos: draftPhotos })
    setDraftPhotos([])
    setMode("view")
    setDraftComment("")
    setSaving(false)
    setSaveStatus(null)
    onSaved()
  }

  const subtitle = detail
    ? `${getFloorShortLabel(detail.floorName)} • Unidad ${detail.unitLabel} • ${detail.formattedLongDate}`
    : ""

  const openPhotoGallery = (
    photos: TrabajoDiarioTaskAttachment[],
    title: string,
    description?: string,
  ) => {
    if (photos.length === 0) return
    setGalleryPhotos(photos)
    setGalleryTitle(title)
    setGalleryDescription(description)
    setGalleryOpen(true)
  }

  const openHistoryPhotoGallery = (item: TrabajoDiarioTaskHistoryItem) => {
    openPhotoGallery(
      item.attachments,
      "Fotografías del cambio",
      `${item.formattedDate} • ${item.status}`,
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[680px] max-w-[calc(100vw-32px)] gap-0 p-0"
      >
        <div className="border-b border-[#edeef0] px-6 pt-6 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-[20px] font-semibold leading-7 text-[#272a2d]">
                {detail?.taskName ?? "Detalle de tarea"}
              </DialogTitle>
              {detail ? (
                <DialogDescription className="mt-1 text-[13px] leading-5 text-[#62748e]">
                  {subtitle}
                </DialogDescription>
              ) : null}
            </div>

            {mode === "view" && detail ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className={cn(EDIT_STATE_BADGE_CLASSNAME, "gap-1.5 transition-colors hover:bg-[#fff8f5]")}
              >
                <Pencil className="size-4" aria-hidden />
                Editar Estado
              </button>
            ) : null}

            {mode === "edit" ? (
              <span className={EDIT_STATE_BADGE_CLASSNAME}>Editando</span>
            ) : null}
          </div>
        </div>

        <div className="flex max-h-[calc(90vh-180px)] flex-col overflow-y-auto px-6 pt-6 pb-5">
          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Spinner className="size-6" />
            </div>
          ) : !detail ? (
            <p className="text-[14px] text-[#777b84]">No se pudo cargar el detalle de la tarea.</p>
          ) : mode === "view" ? (
            <div className="flex flex-col gap-6">
              <DetailField label="Estado">
                <DetailStatusPill status={detail.status} />
              </DetailField>

              <DetailField label="Rubro">
                <p className="text-[14px] font-medium leading-normal text-[#272a2d]">
                  {detail.rubroName}
                </p>
              </DetailField>

              <DetailField label="Comentarios">
                <div className={READONLY_BOX_CLASSNAME}>
                  {detail.comment?.trim() ? detail.comment : "Sin comentarios"}
                </div>
              </DetailField>

              <DetailField label="Fotografías">
                {detail.attachments.length > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      openPhotoGallery(
                        detail.attachments,
                        "Fotografías del avance",
                        detail.formattedLongDate,
                      )
                    }
                    className={cn(
                      READONLY_BOX_CLASSNAME,
                      "flex w-full items-center gap-2 text-left text-[#272a2d] transition-colors hover:bg-[#edeef0]",
                    )}
                  >
                    <Camera className="size-4 shrink-0 text-[#777b84]" aria-hidden />
                    <span>{formatPhotoCount(detail.attachments.length)}</span>
                  </button>
                ) : (
                  <div
                    className={cn(
                      READONLY_BOX_CLASSNAME,
                      "flex items-center gap-2 text-[#777b84]",
                    )}
                  >
                    <Camera className="size-4 shrink-0" aria-hidden />
                    <span>{formatPhotoCount(0)}</span>
                  </div>
                )}
              </DetailField>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setHistoryOpen((value) => !value)}
                  className="flex items-center justify-between py-1 text-left"
                >
                  <span className="inline-flex items-center gap-2 text-[14px] font-medium leading-normal text-[#272a2d]">
                    <Clock className="size-4 text-[#777b84]" aria-hidden />
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
                      <HistoryItem
                        key={item.id}
                        item={item}
                        onViewPhotos={openHistoryPhotoGallery}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <p className="text-[14px] font-medium leading-normal text-[#272a2d]">
                  Actualizar Estado de la tarea
                </p>
                <div className="flex flex-col gap-2">
                  <p className={FIELD_LABEL_CLASSNAME}>Nuevo Estado</p>
                  <div className="grid grid-cols-3 gap-2">
                    {STATUS_BUTTON_STYLES.map((option) => {
                      const isActive = draftStatus === option.status
                      return (
                        <button
                          key={option.status}
                          type="button"
                          onClick={() => setDraftStatus(option.status)}
                          className={cn(
                            "flex h-[44px] items-center justify-center gap-2 rounded-[10px] border-2 bg-white px-2 text-[14px] font-medium transition-colors",
                            isActive
                              ? option.activeClassName
                              : "border-[#edeef0] text-[#777b84] hover:bg-[#fafafa]",
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
                <label htmlFor="task-update-comment" className={FIELD_LABEL_CLASSNAME}>
                  Comentarios sobre el cambio
                </label>
                <textarea
                  id="task-update-comment"
                  value={draftComment}
                  onChange={(event) => setDraftComment(event.target.value)}
                  rows={4}
                  placeholder="Describí el motivo del cambio de Estado..."
                  className="w-full resize-none rounded-[10px] border border-[#afb3ba] bg-white px-3 py-2.5 text-[14px] leading-normal text-[#272a2d] outline-none focus:border-[#ff7433]"
                />
              </div>

              <ProgressPhotoUpload photos={draftPhotos} onChange={setDraftPhotos} />

              {saveError ? <p className="text-[14px] leading-normal text-[#641723]">{saveError}</p> : null}
            </div>
          )}
        </div>

        <div className="border-t border-[#edeef0] px-6 pt-5 pb-6">
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
              <button
                type="button"
                disabled={saving}
                onClick={handleCancelEdit}
                className="inline-flex h-[44px] items-center justify-center rounded-[12px] border border-[#afb3ba] bg-white px-4 text-[14px] font-medium text-[#272a2d] shadow-none transition-colors hover:bg-[#fafafa] disabled:pointer-events-none disabled:opacity-50"
              >
                Cancelar
              </button>
              <Button
                variant="brand"
                size="brand"
                className="h-[44px] w-full rounded-[12px] text-[14px] font-medium shadow-[0_4px_14px_rgba(241,132,77,0.35)]"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? <Spinner className="size-4" /> : null}
                {saving && saveStatus ? saveStatus : "Guardar cambio"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>

      <ProgressPhotoGalleryDialog
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        title={galleryTitle}
        description={galleryDescription}
        photos={galleryPhotos}
      />
    </Dialog>
  )
}
