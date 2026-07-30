"use client"

import { CircleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { CONFIRM_ACTION_DIALOG } from "@/lib/project/designTokens"

type ConfirmActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  loading?: boolean
  loadingLabel?: string
  onConfirm: () => void
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  loading = false,
  loadingLabel = "Guardando...",
  onConfirm,
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        overlayClassName={CONFIRM_ACTION_DIALOG.overlay}
        className={CONFIRM_ACTION_DIALOG.content}
      >
        <div className={CONFIRM_ACTION_DIALOG.body}>
          <div className="flex justify-center">
            <div className={CONFIRM_ACTION_DIALOG.iconWrap}>
              <CircleAlert
                className={CONFIRM_ACTION_DIALOG.icon}
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <AlertDialogTitle className={CONFIRM_ACTION_DIALOG.title}>
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className={CONFIRM_ACTION_DIALOG.description}>
              {description}
            </AlertDialogDescription>
          </div>

          <div className={CONFIRM_ACTION_DIALOG.actions}>
            <button
              type="button"
              disabled={loading}
              onClick={() => onOpenChange(false)}
              className={CONFIRM_ACTION_DIALOG.cancelBtn}
            >
              {cancelLabel}
            </button>
            <Button
              type="button"
              variant="brand"
              disabled={loading}
              onClick={onConfirm}
              className={CONFIRM_ACTION_DIALOG.confirmBtn}
            >
              {loading ? <Spinner className="size-4" /> : null}
              {loading ? loadingLabel : confirmLabel}
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
