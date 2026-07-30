"use client"

import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog"

type ConfigConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  loading?: boolean
  onConfirm: () => void
}

export function ConfigConfirmDialog(props: ConfigConfirmDialogProps) {
  return <ConfirmActionDialog {...props} />
}
