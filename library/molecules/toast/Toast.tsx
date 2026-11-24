import * as ToastPrimitive from "@radix-ui/react-toast"
import { CircleAlert, CircleCheck, Info, X } from "lucide-react"
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { cn } from "../../lib/cn"
import { Icon } from "../../atoms/icon/Icon"

type ToastTone = "info" | "ok" | "danger"

export type ToastOptions = {
  title: string
  description?: string
  tone?: ToastTone
  /** Una acción para deshacer o ver: { label: "Deshacer", onClick }. */
  action?: { label: string; onClick: () => void }
}

type ToastItem = ToastOptions & { id: number }

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null)

const icons = { info: Info, ok: CircleCheck, danger: CircleAlert } as const
const accent = { info: "text-fn-info", ok: "text-fn-ok", danger: "text-fn-danger" } as const

/**
 * Avisos que aparecen y se van solos: «Avance guardado». Arriba a la derecha, como hoy.
 * - Se pausan con el mouse encima o con foco, y se pueden cerrar deslizando.
 * - El de error dura más (8 s) y el lector de pantalla lo anuncia en el momento.
 * - F8 lleva el foco a los avisos (atajo de Radix).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const show = useCallback((options: ToastOptions) => {
    setItems((current) => [...current.slice(-2), { ...options, id: Date.now() + Math.random() }])
  }, [])

  const remove = (id: number) => setItems((current) => current.filter((item) => item.id !== id))

  return (
    <ToastContext.Provider value={show}>
      <ToastPrimitive.Provider label="Avisos" swipeDirection="right">
        {children}
        {items.map((item) => {
          const tone = item.tone ?? "ok"
          return (
            <ToastPrimitive.Root
              key={item.id}
              duration={tone === "danger" ? 8000 : 5000}
              type={tone === "danger" ? "foreground" : "background"}
              onOpenChange={(open) => {
                if (!open) remove(item.id)
              }}
              className={cn(
                "pointer-events-auto flex w-full items-start gap-snug rounded-control border border-line bg-canvas-overlay p-group text-ink shadow-overlay",
                "data-[state=open]:animate-enter [--motion-rise-from:-8px]",
                "data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=end]:translate-x-(--radix-toast-swipe-end-x) data-[state=closed]:opacity-0 motion-color",
              )}
            >
              <Icon icon={icons[tone]} size="md" className={accent[tone]} />
              <div className="flex min-w-0 flex-1 flex-col gap-related">
                <ToastPrimitive.Title className="text-label">{item.title}</ToastPrimitive.Title>
                {item.description ? (
                  <ToastPrimitive.Description className="text-body text-ink-muted">{item.description}</ToastPrimitive.Description>
                ) : null}
              </div>
              {item.action ? (
                <ToastPrimitive.Action
                  altText={item.action.label}
                  onClick={item.action.onClick}
                  className="focus-ring state-veil h-control-compact shrink-0 rounded-control px-snug text-label text-action-text"
                >
                  {item.action.label}
                </ToastPrimitive.Action>
              ) : null}
              <ToastPrimitive.Close
                aria-label="Cerrar aviso"
                className="focus-ring state-veil -mt-related -mr-compact inline-flex size-8 shrink-0 items-center justify-center rounded-control text-ink-muted"
              >
                <Icon icon={X} />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          )
        })}
        <ToastPrimitive.Viewport className="fixed top-group right-group left-group z-(--z-toast) m-0 flex list-none flex-col gap-compact p-0 outline-none sm:left-auto sm:w-96" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

/** const toast = useToast(); toast({ title: "Avance guardado" }) */
export function useToast() {
  const show = useContext(ToastContext)
  if (!show) throw new Error("useToast necesita un ToastProvider más arriba.")
  return useMemo(() => show, [show])
}
