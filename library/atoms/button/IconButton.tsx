import { cva, type VariantProps } from "class-variance-authority"
import type { LucideIcon } from "lucide-react"
import type { ComponentProps } from "react"
import { cn } from "../../lib/cn"
import { Icon } from "../icon/Icon"
import { Spinner } from "../spinner/Spinner"
import { Tooltip } from "../tooltip/Tooltip"

const iconButtonStyles = cva(
  [
    "focus-ring motion-press motion-color relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-control",
    "disabled:cursor-not-allowed disabled:opacity-(--state-disabled-opacity)",
    // El blanco tocable nunca baja de 44 aunque el botón se dibuje más chico.
    "before:absolute before:top-1/2 before:left-1/2 before:size-hit before:-translate-1/2 before:content-['']",
  ],
  {
    variants: {
      variant: {
        ghost: "state-veil bg-transparent text-ink-muted hover:text-ink",
        outline: "state-veil border border-line bg-canvas-raised text-ink hover:border-line-strong",
        action: "bg-action text-action-ink hover:bg-action-hover active:bg-action-pressed",
        "danger-quiet": "state-veil bg-transparent text-fn-danger",
      },
      size: {
        compact: "size-control-compact",
        default: "size-control",
        large: "size-control-large",
      },
    },
    defaultVariants: { variant: "ghost", size: "default" },
  },
)

export type IconButtonProps = Omit<ComponentProps<"button">, "children" | "aria-label"> &
  VariantProps<typeof iconButtonStyles> & {
    icon: LucideIcon
    /** Obligatorio: es lo que lee el lector de pantalla y lo que muestra el tooltip. */
    label: string
    /** Muestra el label como tooltip al pasar el mouse o con foco. Por defecto sí. */
    tooltip?: boolean
    loading?: boolean
  }

/**
 * Botón que es solo un ícono. El `label` es obligatorio por tipo: no se puede
 * crear uno sin nombre accesible.
 */
export function IconButton({
  icon,
  label,
  tooltip = true,
  variant,
  size,
  loading = false,
  disabled,
  type = "button",
  className,
  ...props
}: IconButtonProps) {
  const iconSize = size === "large" ? "md" : "sm"
  const button = (
    <button
      type={type}
      aria-label={label}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(iconButtonStyles({ variant, size }), className)}
      {...props}
    >
      {loading ? <Spinner size={iconSize} label={label} /> : <Icon icon={icon} size={iconSize} />}
    </button>
  )
  return tooltip ? <Tooltip content={label}>{button}</Tooltip> : button
}
