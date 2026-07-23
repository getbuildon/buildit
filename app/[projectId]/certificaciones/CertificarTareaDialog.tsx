"use client"

import { useEffect, useState } from "react"
import { BadgeCheck } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { CERTIFICACION_CONFIRM } from "@/lib/project/certificacionesDesignTokens"

export type CertificarTareaSummary = {
  taskName: string
  floorLabel: string
  unitLabel: string
  rubroName: string
  authorName: string
}

type CertificarTareaDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  summary: CertificarTareaSummary | null
  isCertifying: boolean
  error?: string | null
  onConfirm: (notes: string) => void
}

function SummaryMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <p className={CERTIFICACION_CONFIRM.summaryMeta}>
      {label}: <span className={CERTIFICACION_CONFIRM.summaryMetaValue}>{value}</span>
    </p>
  )
}

export function CertificarTareaDialog({
  open,
  onOpenChange,
  summary,
  isCertifying,
  error,
  onConfirm,
}: CertificarTareaDialogProps) {
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (!open) {
      setNotes("")
    }
  }, [open])

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        overlayClassName={CERTIFICACION_CONFIRM.overlay}
        className={CERTIFICACION_CONFIRM.content}
      >
        <div className="flex flex-col gap-6">
          <div>
            <AlertDialogTitle className={CERTIFICACION_CONFIRM.title}>
              Certificar Tarea
            </AlertDialogTitle>
            <AlertDialogDescription className={CERTIFICACION_CONFIRM.description}>
              Revisá la información antes de confirmar. Esta acción impactará en el avance de obra y
              no se puede deshacer.
            </AlertDialogDescription>
          </div>

          {summary ? (
            <div className="flex flex-col gap-3">
              <div className={CERTIFICACION_CONFIRM.summaryCard}>
                <p className={CERTIFICACION_CONFIRM.summaryTitle}>{summary.taskName}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <SummaryMetaItem label="Piso" value={summary.floorLabel} />
                  <SummaryMetaItem label="Unidades" value={summary.unitLabel} />
                  <SummaryMetaItem label="Rubro" value={summary.rubroName} />
                </div>
                <div className="mt-1">
                  <SummaryMetaItem label="Completado por" value={summary.authorName} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="certification-notes" className={CERTIFICACION_CONFIRM.notesLabel}>
                  Notas de Certificación
                </label>
                <textarea
                  id="certification-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Ingresá observaciones o confirmaciones sobre el trabajo verificado..."
                  className={CERTIFICACION_CONFIRM.notesInput}
                />
              </div>
            </div>
          ) : null}

          {error ? <p className="text-[14px] leading-[1.4] text-[#641723]">{error}</p> : null}

          <div className="flex gap-2">
            <AlertDialogCancel disabled={isCertifying} className={CERTIFICACION_CONFIRM.cancelBtn}>
              Cancelar
            </AlertDialogCancel>
            <button
              type="button"
              disabled={isCertifying || !summary}
              onClick={() => onConfirm(notes)}
              className={CERTIFICACION_CONFIRM.confirmBtn}
            >
              {isCertifying ? (
                <Spinner className="size-4" />
              ) : (
                <BadgeCheck className="size-4 shrink-0" aria-hidden />
              )}
              {isCertifying ? "Certificando..." : "Confirmar Certificación"}
            </button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
