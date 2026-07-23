"use client"

import { useEffect, useState } from "react"
import { BadgeCheck, CheckCircle2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { CERTIFICACION_CONFIRM } from "@/lib/project/certificacionesDesignTokens"

export type CertificarTareasItem = {
  entryId: string
  label: string
}

type CertificarTareasDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tasks: CertificarTareasItem[]
  isCertifying: boolean
  error?: string | null
  onConfirm: (notes: string) => void
}

export function CertificarTareasDialog({
  open,
  onOpenChange,
  tasks,
  isCertifying,
  error,
  onConfirm,
}: CertificarTareasDialogProps) {
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
              Certificar Tareas
            </AlertDialogTitle>
            <AlertDialogDescription className={CERTIFICACION_CONFIRM.description}>
              Revisá la información antes de confirmar. Esta acción impactará en el avance de obra y
              no se puede deshacer.
            </AlertDialogDescription>
          </div>

          {tasks.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div className={CERTIFICACION_CONFIRM.summaryCard}>
                <p className={CERTIFICACION_CONFIRM.summaryTitle}>Tareas seleccionadas</p>
                <div className={CERTIFICACION_CONFIRM.bulkTaskList}>
                  {tasks.map((task) => (
                    <div key={task.entryId} className={CERTIFICACION_CONFIRM.bulkTaskItem}>
                      <CheckCircle2
                        className="size-3.5 shrink-0 text-[#208368]"
                        aria-hidden
                      />
                      <span className="min-w-0 truncate">{task.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="bulk-certification-notes" className={CERTIFICACION_CONFIRM.bulkNotesLabel}>
                  Notas de Certificación (aplica a todas)
                </label>
                <textarea
                  id="bulk-certification-notes"
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
              disabled={isCertifying || tasks.length === 0}
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
