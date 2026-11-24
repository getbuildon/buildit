import { Slot, Slottable } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "../../lib/cn"
import { Spinner } from "../spinner/Spinner"

export const buttonVariants = ["action", "ink", "earth", "outline", "ghost", "danger", "danger-quiet"] as const
export const buttonSizes = ["compact", "default", "large"] as const
export type ButtonVariant = (typeof buttonVariants)[number]
export type ButtonSize = (typeof buttonSizes)[number]

/*
 * Mismos nombres que la librería de Rootsy: action, outline, ghost, danger.
 * El tamaño default (44) coincide con el mínimo tocable.
 */
export const buttonStyles = cva(
  [
    "focus-ring motion-press motion-color relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-compact whitespace-nowrap rounded-control text-label",
    "disabled:cursor-not-allowed disabled:opacity-(--state-disabled-opacity) aria-disabled:cursor-not-allowed aria-disabled:opacity-(--state-disabled-opacity)",
    "[&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        action: "bg-action text-action-ink shadow-action hover:bg-action-hover active:bg-action-pressed",
        // Oscuro: la acción principal sobre una superficie de color o donde el naranja ya es
        // el fondo (el acceso). En modo oscuro se invierte solo.
        ink: "state-veil bg-canvas-inverse text-ink-inverse",
        // Sobre la tierra del inicio: la barra de arriba (Portal Clientes, la empresa).
        earth: "bg-earth-strong text-on-earth hover:bg-earth-strong-hover",
        outline: "state-veil border border-line bg-canvas-raised text-ink hover:border-line-strong",
        ghost: "state-veil bg-transparent text-ink",
        danger: "bg-fn-danger-solid text-fn-danger-solid-ink hover:bg-fn-danger-solid-hover",
        "danger-quiet": "state-veil bg-transparent text-fn-danger",
      },
      size: {
        compact: "h-control-compact px-snug",
        default: "h-control px-group",
        large: "h-control-large px-block",
      },
      fullWidth: { true: "w-full" },
    },
    defaultVariants: { variant: "action", size: "default" },
  },
)

export type ButtonProps = Omit<ComponentProps<"button">, "children"> &
  VariantProps<typeof buttonStyles> & {
    children: ReactNode
    /** Mientras guarda: muestra el spinner, bloquea el clic y avisa al lector de pantalla. */
    loading?: boolean
    /** Texto que lee el lector de pantalla mientras carga. */
    loadingLabel?: string
    /** Para que un link (next/link) se vea como botón. */
    asChild?: boolean
  }

/**
 * Botón del sistema. Reemplaza los ~215 botones armados a mano de la app.
 * type="button" por defecto: un botón dentro de un form no envía sin querer.
 */
export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  loadingLabel = "Guardando",
  asChild = false,
  disabled,
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : type}
      disabled={asChild ? undefined : disabled || loading}
      aria-disabled={asChild && disabled ? true : undefined}
      aria-busy={loading || undefined}
      className={cn(buttonStyles({ variant, size, fullWidth }), className)}
      {...props}
    >
      {loading ? <Spinner label={loadingLabel} /> : null}
      <Slottable>{children}</Slottable>
    </Comp>
  )
}
