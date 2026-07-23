"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { format } from "date-fns"
import {
  AlertCircle,
  BadgeCheck,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Pencil,
  ShieldCheck,
  User,
} from "lucide-react"
import { InProcessStatusIcon } from "@/components/icons/InProcessStatusIcon"
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
import { getFloorDisplayLabel } from "@/lib/projects/floorLabels"
import { CERTIFICACION_MODAL } from "@/lib/project/certificacionesDesignTokens"
import { cn } from "@/lib/utils"
import { CertificarTareaDialog, type CertificarTareaSummary } from "./CertificarTareaDialog"
import {
  getTrabajoDiarioTaskDetail,
  registerProgressAttachments,
  updateTrabajoDiarioTask,
  type TrabajoDiarioTaskAttachment,
  type TrabajoDiarioTaskDetail,
  type TrabajoDiarioTaskHistoryItem,
  type TrabajoDiarioTaskStatus,
} from "../trabajo-diario/actions"

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

function formatModalDate(value: string): string {
  return format(new Date(value), "dd/MM/yyyy")
}

function formatModalTime(value: string): string {
  return format(new Date(value), "HH:mm")
}

function formatPhotoCount(count: number): string {
  if (count === 0) return "Sin fotografías"
  if (count === 1) return "1 foto adjunta"
  return `${count} fotos adjuntas`
}

function StatusIcon({
  status,
  className,
}: {
  status: TrabajoDiarioTaskStatus | EditableTaskStatus
  className?: string
}) {
  const draftStatus =
    status === "Completado" || status === "En Proceso" || status === "Bloqueado"
      ? mapTrabajoDiarioStatusToDraft(status)
      : status

  switch (draftStatus) {
    case "completed":
      return <CheckCircle2 className={cn("size-5 shrink-0", className)} aria-hidden />
    case "in_progress":
      return <InProcessStatusIcon className={cn("size-5", className)} />
    case "blocked":
      return <AlertCircle className={cn("size-5 shrink-0", className)} aria-hidden />
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className={CERTIFICACION_MODAL.label}>{label}</p>
      {children}
    </div>
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
    <div className="rounded-[10px] bg-[#f9f9fb] p-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium leading-4 text-[#272a2d]">
              <StatusIcon status={item.status} className="size-4" />
              {item.status}
            </span>
            <span className="shrink-0 text-[12px] leading-4 text-[#777b84]">{item.formattedDate}</span>
          </div>
          <p
            className={cn(
              "mt-2 text-[14px] leading-[1.4]",
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

type CertificacionTaskDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  entryId: string | null
  certificationStatus: "pending" | "certified"
  canCertify: boolean
  isCertifying: boolean
  onCertify: (entryId: string, notes?: string) => Promise<void>
  onSaved: () => void
}

export function CertificacionTaskDetailDialog({
  open,
  onOpenChange,
  projectId,
  entryId,
  certificationStatus,
  canCertify,
  isCertifying,
  onCertify,
  onSaved,
}: CertificacionTaskDetailDialogProps) {
  const [detail, setDetail] = useState<TrabajoDiarioTaskDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"view" | "edit">("view")
  const [historyOpen, setHistoryOpen] = useState(false)
  const [draftStatus, setDraftStatus] = useState<EditableTaskStatus>("completed")
  const [draftComment, setDraftComment] = useState("")
  const [draftPhotos, setDraftPhotos] = useState<CargarAvancePhotoDraft[]>([])
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryTitle, setGalleryTitle] = useState("")
  const [galleryDescription, setGalleryDescription] = useState<string | undefined>()
  const [galleryPhotos, setGalleryPhotos] = useState<TrabajoDiarioTaskAttachment[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [certifyError, setCertifyError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !entryId) {
      setDetail(null)
      setMode("view")
      setHistoryOpen(false)
      setSaveError(null)
      setConfirmOpen(false)
      setCertifyError(null)
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

  const authorName = useMemo(() => {
    if (!detail) return "Usuario"
    const current = detail.history.find((item) => item.id === detail.entryId)
    return current?.authorName ?? detail.history[0]?.authorName ?? "Usuario"
  }, [detail])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      revokeTaskDraftPhotos({ ...createEmptyTaskDraft(), photos: draftPhotos })
      setDraftPhotos([])
      setMode("view")
      setDraftComment("")
      setSaveError(null)
      setSaveStatus(null)
      setHistoryOpen(false)
      setConfirmOpen(false)
      setCertifyError(null)
    }
    onOpenChange(nextOpen)
  }

  const certifySummary: CertificarTareaSummary | null = detail
    ? {
        taskName: detail.taskName,
        floorLabel: getFloorDisplayLabel({
          name: detail.floorName,
          identifier: detail.floorIdentifier,
        }),
        unitLabel: detail.unitLabel,
        rubroName: detail.rubroName,
        authorName,
      }
    : null

  const handleConfirmCertify = async (notes: string) => {
    if (!entryId) return
    setCertifyError(null)
    try {
      await onCertify(entryId, notes)
      setConfirmOpen(false)
      handleOpenChange(false)
    } catch (error) {
      setCertifyError(error instanceof Error ? error.message : "No se pudo certificar la tarea.")
    }
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

  const statusLabel =
    certificationStatus === "certified"
      ? "Certificada"
      : CARGAR_AVANCE_STATUS_LABELS[mapTrabajoDiarioStatusToDraft(detail?.status ?? "Completado")]

  const showCertifyButton =
    certificationStatus === "pending" && canCertify && mode === "view"

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          overlayClassName={CERTIFICACION_MODAL.overlay}
          className={CERTIFICACION_MODAL.content}
        >
          <div className={cn("border-b px-6 py-4", CERTIFICACION_MODAL.headerBorder)}>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <DialogTitle className={CERTIFICACION_MODAL.title}>
                  {detail?.taskName ?? "Detalle de tarea"}
                </DialogTitle>
                {detail ? (
                  <DialogDescription asChild>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={CERTIFICACION_MODAL.metaPrimary}>{detail.rubroName}</span>
                      <span className={CERTIFICACION_MODAL.metaSecondary}>•</span>
                      <span className={CERTIFICACION_MODAL.metaSecondary}>
                        {getFloorDisplayLabel({
                          name: detail.floorName,
                          identifier: detail.floorIdentifier,
                        })}
                      </span>
                      <span className={CERTIFICACION_MODAL.metaSecondary}>•</span>
                      <span className={CERTIFICACION_MODAL.metaSecondary}>{detail.unitLabel}</span>
                    </div>
                  </DialogDescription>
                ) : null}
              </div>

              {mode === "view" && detail ? (
                <button type="button" onClick={handleStartEdit} className={CERTIFICACION_MODAL.editBtn}>
                  <Pencil className="size-4 shrink-0" aria-hidden />
                  Editar Estado
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex max-h-[calc(90vh-180px)] flex-col overflow-y-auto p-6">
            {loading ? (
              <div className="flex min-h-[240px] items-center justify-center">
                <Spinner className="size-6" />
              </div>
            ) : !detail ? (
              <p className="text-[14px] text-[#777b84]">No se pudo cargar el detalle de la tarea.</p>
            ) : mode === "view" ? (
              <div className="flex flex-col gap-4">
                <Field label="Estado">
                  <span
                    className={
                      certificationStatus === "certified"
                        ? CERTIFICACION_MODAL.statusBadgeCertified
                        : CERTIFICACION_MODAL.statusBadge
                    }
                  >
                    {certificationStatus === "certified" ? (
                      <ShieldCheck className="size-2.5 shrink-0" aria-hidden />
                    ) : (
                      <StatusIcon status={detail.status} className="text-[#208368]" />
                    )}
                    {statusLabel}
                  </span>
                </Field>

                <Field label="Comentarios">
                  <div className={CERTIFICACION_MODAL.readonlyBox}>
                    {detail.comment?.trim() ? detail.comment : "Sin comentarios"}
                  </div>
                </Field>

                <Field label="Fotografías">
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
                        CERTIFICACION_MODAL.readonlyBox,
                        "flex w-full items-center gap-2 text-left transition-colors hover:bg-[#f0f1f4]",
                      )}
                    >
                      <Camera className="size-4 shrink-0 text-[#777b84]" aria-hidden />
                      <span>{formatPhotoCount(detail.attachments.length)}</span>
                    </button>
                  ) : (
                    <div
                      className={cn(
                        CERTIFICACION_MODAL.readonlyBox,
                        "flex h-11 items-center gap-2 text-[#272a2d]",
                      )}
                    >
                      <Camera className="size-4 shrink-0 text-[#777b84]" aria-hidden />
                      <span>{formatPhotoCount(0)}</span>
                    </div>
                  )}
                </Field>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className={CERTIFICACION_MODAL.label}>Fecha y hora de registro</p>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3.5 shrink-0 text-[#777b84]" aria-hidden />
                        <span className={CERTIFICACION_MODAL.metaValue}>
                          {formatModalDate(detail.occurredAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="size-3.5 shrink-0 text-[#777b84]" aria-hidden />
                        <span className={CERTIFICACION_MODAL.metaValue}>
                          {formatModalTime(detail.occurredAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className={CERTIFICACION_MODAL.label}>Registrado por</p>
                    <div className="flex items-center gap-2">
                      <User className="size-3.5 shrink-0 text-[#777b84]" aria-hidden />
                      <span className={CERTIFICACION_MODAL.metaValue}>{authorName}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setHistoryOpen((value) => !value)}
                  className={CERTIFICACION_MODAL.historyBtn}
                >
                  <Clock className="size-4 shrink-0" aria-hidden />
                  Ver Historial de Cambios
                  {historyOpen ? (
                    <ChevronUp className="size-4 shrink-0" aria-hidden />
                  ) : (
                    <ChevronDown className="size-4 shrink-0" aria-hidden />
                  )}
                </button>

                {historyOpen ? (
                  <div className="flex flex-col gap-2">
                    {detail.history.map((item) => (
                      <HistoryItem
                        key={item.id}
                        item={item}
                        onViewPhotos={(historyItem) =>
                          openPhotoGallery(
                            historyItem.attachments,
                            "Fotografías del cambio",
                            `${historyItem.formattedDate} • ${historyItem.status}`,
                          )
                        }
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4">
                  <p className="text-[14px] font-medium leading-[1.4] text-[#272a2d]">
                    Actualizar Estado de la tarea
                  </p>
                  <div className="flex flex-col gap-2">
                    <p className={CERTIFICACION_MODAL.label}>Nuevo Estado</p>
                    <div className="grid grid-cols-3 gap-2">
                      {STATUS_BUTTON_STYLES.map((option) => {
                        const isActive = draftStatus === option.status
                        return (
                          <button
                            key={option.status}
                            type="button"
                            onClick={() => setDraftStatus(option.status)}
                            className={cn(
                              "flex h-11 items-center justify-center gap-2 rounded-[10px] border-2 bg-white px-2 text-[14px] font-medium transition-colors",
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
                  <label htmlFor="cert-task-update-comment" className={CERTIFICACION_MODAL.label}>
                    Comentarios sobre el cambio
                  </label>
                  <textarea
                    id="cert-task-update-comment"
                    value={draftComment}
                    onChange={(event) => setDraftComment(event.target.value)}
                    rows={4}
                    placeholder="Describí el motivo del cambio de Estado..."
                    className="w-full resize-none rounded-[10px] border border-[#afb3ba] bg-white px-3 py-2.5 text-[14px] leading-[1.4] text-[#272a2d] outline-none focus:border-[#ff7433]"
                  />
                </div>

                <ProgressPhotoUpload photos={draftPhotos} onChange={setDraftPhotos} />

                {saveError ? (
                  <p className="text-[14px] leading-[1.4] text-[#641723]">{saveError}</p>
                ) : null}
                {saveStatus ? (
                  <p className="text-[14px] leading-[1.4] text-[#777b84]">{saveStatus}</p>
                ) : null}
              </div>
            )}
          </div>

          <div
            className={cn(
              "flex gap-3 border-t px-6 pt-4 pb-6",
              CERTIFICACION_MODAL.footerBorder,
              showCertifyButton ? "flex-row" : "flex-col",
            )}
          >
            {mode === "view" ? (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className={cn(
                    CERTIFICACION_MODAL.closeBtn,
                    !showCertifyButton && "w-full",
                  )}
                >
                  Cerrar
                </button>
                {showCertifyButton && entryId ? (
                  <button
                    type="button"
                    disabled={isCertifying}
                    onClick={() => {
                      setCertifyError(null)
                      setConfirmOpen(true)
                    }}
                    className={CERTIFICACION_MODAL.certifyBtn}
                  >
                    <BadgeCheck className="size-4 shrink-0" aria-hidden />
                    {isCertifying ? "Certificando..." : "Certificar Tarea"}
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleCancelEdit}
                  className={CERTIFICACION_MODAL.closeBtn}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave()}
                  className={CERTIFICACION_MODAL.certifyBtn}
                >
                  {saving ? "Guardando..." : "Guardar cambio"}
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ProgressPhotoGalleryDialog
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        title={galleryTitle}
        description={galleryDescription}
        photos={galleryPhotos}
      />

      <CertificarTareaDialog
        open={confirmOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setCertifyError(null)
          setConfirmOpen(nextOpen)
        }}
        summary={certifySummary}
        isCertifying={isCertifying}
        error={certifyError}
        onConfirm={(notes) => void handleConfirmCertify(notes)}
      />
    </>
  )
}
