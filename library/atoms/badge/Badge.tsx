import { cva, type VariantProps } from "class-variance-authority"
import type { LucideIcon } from "lucide-react"
import type { ComponentProps } from "react"
import { cn } from "../../lib/cn"
import { Icon } from "../icon/Icon"

export const badgeTones = ["neutral", "action", "ok", "caution", "danger", "info"] as const
export type BadgeTone = (typeof badgeTones)[number]

const badgeStyles = cva("inline-flex shrink-0 items-center gap-related whitespace-nowrap rounded-pill border", {
  variants: {
    tone: {
      neutral: "border-line bg-canvas-sunken text-ink-muted",
      action: "border-transparent bg-action-soft text-action-text",
      ok: "border-fn-ok-line bg-fn-ok-canvas text-fn-ok",
      caution: "border-fn-caution-line bg-fn-caution-canvas text-fn-caution",
      danger: "border-fn-danger-line bg-fn-danger-canvas text-fn-danger",
      info: "border-fn-info-line bg-fn-info-canvas text-fn-info",
    },
    size: {
      compact: "h-5 px-compact text-micro",
      default: "h-6 px-compact text-meta font-medium",
    },
  },
  defaultVariants: { tone: "neutral", size: "default" },
})

export type BadgeProps = ComponentProps<"span"> &
  VariantProps<typeof badgeStyles> & {
    /** Ícono opcional antes del texto. El estado nunca depende solo del color. */
    icon?: LucideIcon
  }

/** Estado de algo: Certificada, Pendiente, Rechazada, A tiempo. Siempre con palabra. */
export function Badge({ tone, size, icon, className, children, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeStyles({ tone, size }), className)} {...props}>
      {icon ? <Icon icon={icon} size="xs" /> : null}
      {children}
    </span>
  )
}
