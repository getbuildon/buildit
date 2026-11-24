import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { useState, type ReactNode } from "react"
import { Button } from "../../atoms/button/Button"

export type ConfirmDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** El botón que lo abre, si no se controla con open. */
  trigger?: ReactNode
  /** Pregunta concreta: «¿Borrar la unidad 4B?», no «¿Estás seguro?». */
  title: string
  /** Qué pasa si confirma. Si no se puede deshacer, decirlo. */
  description: ReactNode
  /** Verbo de la acción: «Borrar unidad», no «Aceptar». */
  confirmLabel: string
  cancelLabel?: string
  tone?: "action" | "danger"
  /** Puede ser async: mientras corre, el botón muestra el spinner y el diálogo no se cierra. */
  onConfirm: () => void | Promise<void>
}

/**
 * Confirmar una acción. A diferencia de Dialog, no se cierra tocando afuera y el
 * foco arranca en Cancelar: así un Enter apurado no borra nada.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  tone = "action",
  onConfirm,
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const isOpen = open ?? internalOpen
  const setOpen = (value: boolean) => {
    if (pending) return
    setInternalOpen(value)
    onOpenChange?.(value)
  }

  return (
    <AlertDialogPrimitive.Root open={isOpen} onOpenChange={setOpen}>
      {trigger ? <AlertDialogPrimitive.Trigger asChild>{trigger}</AlertDialogPrimitive.Trigger> : null}
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-(--z-modal) bg-scrim" />
        <AlertDialogPrimitive.Content className="fixed top-1/2 left-1/2 z-(--z-modal) flex w-[calc(100%-2*var(--space-group))] max-w-dialog-narrow -translate-1/2 flex-col gap-block rounded-surface border border-line bg-canvas-overlay p-block text-ink shadow-modal data-[state=open]:animate-enter">
          <div className="flex flex-col gap-compact">
            <AlertDialogPrimitive.Title className="text-heading">{title}</AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="text-body text-ink-muted">{description}</AlertDialogPrimitive.Description>
          </div>
          <div className="flex flex-col-reverse gap-snug sm:flex-row sm:justify-end">
            <AlertDialogPrimitive.Cancel asChild>
              <Button variant="outline" disabled={pending}>
                {cancelLabel}
              </Button>
            </AlertDialogPrimitive.Cancel>
            <Button
              variant={tone === "danger" ? "danger" : "action"}
              loading={pending}
              loadingLabel={confirmLabel}
              onClick={async () => {
                setPending(true)
                try {
                  await onConfirm()
                  setPending(false)
                  setOpen(false)
                } catch {
                  // Si falla, el diálogo queda abierto para reintentar. El error lo avisa quien llama.
                  setPending(false)
                }
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}
