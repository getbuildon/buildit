import type { LucideIcon, LucideProps } from "lucide-react"
import { cn } from "../../lib/cn"

export const iconSizes = ["xs", "sm", "md", "lg"] as const
export type IconSize = (typeof iconSizes)[number]

const sizeClass: Record<IconSize, string> = {
  xs: "size-icon-xs",
  sm: "size-icon-sm",
  md: "size-icon-md",
  lg: "size-icon-lg",
}

export type IconProps = Omit<LucideProps, "size" | "strokeWidth"> & {
  icon: LucideIcon
  size?: IconSize
  /** Si el ícono dice algo que no está escrito al lado. Sin label es decorativo. */
  label?: string
}

/**
 * Ícono de Lucide con el tamaño y el trazo del sistema (1.75).
 * Decorativo por defecto (aria-hidden); con `label` se anuncia.
 */
export function Icon({ icon: Glyph, size = "sm", label, className, style, ...props }: IconProps) {
  return (
    <Glyph
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      focusable="false"
      className={cn("shrink-0", sizeClass[size], className)}
      style={{ strokeWidth: "var(--icon-stroke)", ...style }}
      {...props}
    />
  )
}
