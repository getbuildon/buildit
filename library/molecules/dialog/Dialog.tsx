import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "../../lib/cn"
import { IconButton } from "../../atoms/button/IconButton"

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

const sizeClass = {
  narrow: "sm:max-w-dialog-narrow",
  default: "sm:max-w-dialog",
  wide: "sm:max-w-dialog-wide",
} as const

export type DialogContentProps = Omit<ComponentProps<typeof DialogPrimitive.Content>, "title"> & {
  /** Obligatorio: es lo que anuncia el lector de pantalla al abrir. */
  title: string
  description?: ReactNode
  size?: keyof typeof sizeClass
  /** Botones del pie. Quedan fijos abajo aunque el cuerpo scrollee. */
  footer?: ReactNode
  /** Oculta la cruz de cerrar (por ejemplo, si hay un paso obligatorio). */
  hideClose?: boolean
}

/**
 * Diálogo. Encierra el foco adentro, se cierra con Escape y devuelve el foco al botón
 * que lo abrió (lo que no hacen los 11 diálogos armados a mano de la app).
 *
 * En el celular sube desde abajo y ocupa el ancho; en pantallas grandes, al centro.
 * El cuerpo scrollea; título y pie quedan fijos.
 */
export function DialogContent({
  title,
  description,
  size = "default",
  footer,
  hideClose = false,
  className,
  children,
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-(--z-modal) bg-scrim [--motion-rise-from:0px] data-[state=open]:animate-enter" />
      <DialogPrimitive.Content
        // Sin descripción, se le avisa a Radix que no falta: el título alcanza.
        {...(description ? {} : { "aria-describedby": undefined })}
        className={cn(
          "fixed z-(--z-modal) flex max-h-[min(90dvh,48rem)] w-full flex-col bg-canvas-overlay text-ink shadow-modal outline-none",
          // Celular: hoja desde abajo.
          "inset-x-0 bottom-0 rounded-t-surface",
          // Pantalla grande: al centro.
          "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-1/2 sm:rounded-surface sm:border sm:border-line",
          sizeClass[size],
          "data-[state=open]:animate-enter",
          className,
        )}
        {...props}
      >
        <header className="flex items-start gap-snug p-block pb-group">
          <div className="flex min-w-0 flex-1 flex-col gap-related">
            <DialogPrimitive.Title className="text-heading">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="text-body text-ink-muted">{description}</DialogPrimitive.Description>
            ) : null}
          </div>
          {hideClose ? null : (
            <DialogPrimitive.Close asChild>
              <IconButton icon={X} label="Cerrar" size="compact" tooltip={false} className="-mt-related -mr-compact" />
            </DialogPrimitive.Close>
          )}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-block pb-block">{children}</div>
        {footer ? (
          <footer className="flex flex-col-reverse gap-snug border-t border-line px-block py-group sm:flex-row sm:justify-end">{footer}</footer>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
