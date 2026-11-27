"use client"

import { ConfirmDialog } from "@/library/molecules"

type ConfigConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  /** "danger" para lo que no se puede deshacer (descartar cambios). */
  tone?: "action" | "danger"
  /**
   * Puede ser async: mientras corre, el botón muestra el spinner y el diálogo no se
   * cierra. Si tira un error, el diálogo queda abierto para reintentar.
   */
  onConfirm: () => void | Promise<void>
}

/** Confirmación de la pantalla de configuración (guardar o descartar cambios). */
export function ConfigConfirmDialog(props: ConfigConfirmDialogProps) {
  return <ConfirmDialog {...props} />
}
