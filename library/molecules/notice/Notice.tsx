import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "../../lib/cn"
import { IconButton } from "../../atoms/button/IconButton"
import { Icon } from "../../atoms/icon/Icon"

const tones = {
  info: { icon: Info, box: "border-fn-info-line bg-fn-info-canvas", accent: "text-fn-info" },
  ok: { icon: CircleCheck, box: "border-fn-ok-line bg-fn-ok-canvas", accent: "text-fn-ok" },
  caution: { icon: TriangleAlert, box: "border-fn-caution-line bg-fn-caution-canvas", accent: "text-fn-caution" },
  danger: { icon: CircleAlert, box: "border-fn-danger-line bg-fn-danger-canvas", accent: "text-fn-danger" },
} as const

export type NoticeProps = {
  tone?: keyof typeof tones
  title?: string
  children: ReactNode
  /** Un botón o link para resolverlo: «Revisar avances». */
  action?: ReactNode
  /** Si viene, muestra la cruz para cerrarlo. */
  onDismiss?: () => void
  className?: string
}

/**
 * Aviso dentro de la pantalla, en su lugar: «Hay 3 avances pendientes de revisión».
 * El de peligro se anuncia apenas aparece (role="alert"); los demás, sin interrumpir.
 * Para algo que pasó recién y se va solo, Toast.
 */
export function Notice({ tone = "info", title, children, action, onDismiss, className }: NoticeProps) {
  const style = tones[tone]
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex items-start gap-snug rounded-control border p-group text-ink", style.box, className)}
    >
      <Icon icon={style.icon} size="md" className={cn("mt-px", style.accent)} />
      <div className="flex min-w-0 flex-1 flex-col gap-related">
        {title ? <p className={cn("text-label", style.accent)}>{title}</p> : null}
        <div className="text-body">{children}</div>
        {action ? <div className="mt-related flex flex-wrap gap-snug">{action}</div> : null}
      </div>
      {onDismiss ? <IconButton icon={X} label="Cerrar aviso" size="compact" tooltip={false} onClick={onDismiss} className="-my-related -mr-compact" /> : null}
    </div>
  )
}
