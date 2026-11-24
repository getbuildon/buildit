import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "../../lib/cn"
import { IconButton } from "../../atoms/button/IconButton"

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

export type SheetContentProps = Omit<ComponentProps<typeof DialogPrimitive.Content>, "title"> & {
  /** Obligatorio: lo anuncia el lector de pantalla. Con hideHeader se lee pero no se ve. */
  title: string
  description?: ReactNode
  /** top: baja desde arriba y ocupa el ancho (el menú de la obra en el celular, como hoy). */
  side?: "left" | "right" | "top"
  footer?: ReactNode
  /** Sin encabezado visible (por ejemplo, el menú lateral en el celular, que trae el suyo). */
  hideHeader?: boolean
}

/**
 * Panel que entra por un costado: el menú en el celular, el detalle de una unidad,
 * los filtros. Mismo comportamiento que Dialog (foco encerrado, Escape, vuelta del foco),
 * sin tapar el contexto del todo.
 */
export function SheetContent({ title, description, side = "right", footer, hideHeader = false, className, children, ...props }: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-(--z-modal) bg-scrim [--motion-rise-from:0px] data-[state=open]:animate-enter" />
      <DialogPrimitive.Content
        {...(description ? {} : { "aria-describedby": undefined })}
        className={cn(
          "fixed z-(--z-modal) flex flex-col bg-canvas-overlay text-ink shadow-modal outline-none",
          side === "top"
            ? "inset-x-0 top-0 max-h-dvh border-b border-line data-[state=open]:animate-enter [--motion-rise-from:-8px]"
            : "inset-y-0 w-[min(90vw,var(--layout-sheet))] data-[state=open]:animate-sheet-in",
          side === "right" ? "right-0 border-l border-line [--sheet-from:100%]" : null,
          side === "left" ? "left-0 border-r border-line [--sheet-from:-100%]" : null,
          className,
        )}
        {...props}
      >
        {hideHeader ? (
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
        ) : (
          <header className="flex items-start gap-snug border-b border-line p-group">
            <div className="flex min-w-0 flex-1 flex-col gap-related">
              <DialogPrimitive.Title className="text-heading">{title}</DialogPrimitive.Title>
              {description ? <DialogPrimitive.Description className="text-body text-ink-muted">{description}</DialogPrimitive.Description> : null}
            </div>
            <DialogPrimitive.Close asChild>
              <IconButton icon={X} label="Cerrar" size="compact" tooltip={false} className="-mt-related -mr-compact" />
            </DialogPrimitive.Close>
          </header>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer ? <footer className="flex flex-col-reverse gap-snug border-t border-line p-group sm:flex-row sm:justify-end">{footer}</footer> : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
