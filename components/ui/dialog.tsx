"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "dialog-overlay fixed inset-0 z-50 bg-[#0f172a]/50 backdrop-blur-[2px]",
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  overlayClassName,
  children,
  showCloseButton = true,
  presentation = "default",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  overlayClassName?: string
  presentation?: "default" | "sheet"
}) {
  const contentClassName = cn(
    "z-50 flex max-h-[90vh] w-full flex-col overflow-hidden outline-none",
    presentation === "sheet"
      ? "dialog-content-sheet fixed inset-0 top-0 left-0 h-[100dvh] max-h-[100dvh] max-w-none rounded-none border-0 bg-white shadow-none"
      : "dialog-content-center relative max-w-[680px] rounded-[14px] border border-[#edeef0] bg-white shadow-[0_8px_32px_rgba(24,25,27,0.12)]",
    className,
  )

  return (
    <DialogPortal>
      <DialogOverlay className={overlayClassName} />
      {presentation === "sheet" ? (
        <DialogPrimitive.Content
          data-slot="dialog-content"
          className={contentClassName}
          {...props}
        >
          {children}
          {showCloseButton ? (
            <DialogPrimitive.Close
              className="absolute top-5 right-5 flex size-5 items-center justify-center rounded text-[#43484e] transition-colors hover:bg-[#edeef0] focus:outline-none disabled:pointer-events-none"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          ) : null}
        </DialogPrimitive.Content>
      ) : (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-6">
          <DialogPrimitive.Content
            data-slot="dialog-content"
            className={cn(contentClassName, "pointer-events-auto")}
            {...props}
          >
            {children}
            {showCloseButton ? (
              <DialogPrimitive.Close
                className="absolute top-5 right-5 flex size-5 items-center justify-center rounded text-[#43484e] transition-colors hover:bg-[#edeef0] focus:outline-none disabled:pointer-events-none"
                aria-label="Cerrar"
              >
                <X className="size-4" />
              </DialogPrimitive.Close>
            ) : null}
          </DialogPrimitive.Content>
        </div>
      )}
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-[18px] font-medium leading-[1.4] text-[#272a2d]", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-[14px] leading-[1.5] text-[#777b84]", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
