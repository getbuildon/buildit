"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastVariant = "success" | "error"

type ToastItem = {
  id: string
  message: string
  variant: ToastVariant
}

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TOAST_DURATION_MS = 5000

const variantStyles: Record<
  ToastVariant,
  { container: string; iconBg: string; text: string }
> = {
  success: {
    container: "border-[#208368] bg-[#f0fdf4]",
    iconBg: "bg-[#208368]",
    text: "text-[#208368]",
  },
  error: {
    container: "border-[#ce2c31] bg-[#fff1f0]",
    iconBg: "bg-[#ce2c31]",
    text: "text-[#ce2c31]",
  },
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-6 z-[100] flex flex-col items-center gap-2 px-6"
    >
      {toasts.map((toast) => {
        const styles = variantStyles[toast.variant]

        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-[747px] items-center gap-3 rounded-[10px] border px-4 py-3 shadow-[0_4px_16px_rgba(24,25,27,0.08)]",
              styles.container,
            )}
          >
            <div
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full",
                styles.iconBg,
              )}
            >
              {toast.variant === "success" ? (
                <Check className="size-3 text-white" aria-hidden />
              ) : (
                <X className="size-3 text-white" aria-hidden />
              )}
            </div>
            <p className={cn("text-[14px] font-normal leading-5", styles.text)}>
              {toast.message}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { id, message, variant }])

      window.setTimeout(() => {
        dismissToast(id)
      }, TOAST_DURATION_MS)
    },
    [dismissToast],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      success: (message: string) => showToast(message, "success"),
      error: (message: string) => showToast(message, "error"),
    }),
    [showToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider.")
  }
  return context
}
