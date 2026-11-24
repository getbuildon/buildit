import * as MenuPrimitive from "@radix-ui/react-dropdown-menu"
import type { LucideIcon } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "../../lib/cn"
import { Icon } from "../../atoms/icon/Icon"

export const Menu = MenuPrimitive.Root
export const MenuTrigger = MenuPrimitive.Trigger

/**
 * Menú de acciones (los «tres puntitos» de una fila). Flechas para moverse,
 * Enter para elegir, Escape para cerrar; la primera letra salta a la opción.
 */
export function MenuContent({ className, align = "end", ...props }: ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        align={align}
        sideOffset={4}
        collisionPadding={8}
        className={cn(
          "z-(--z-overlay) min-w-48 rounded-control border border-line bg-canvas-overlay p-related text-ink shadow-overlay outline-none",
          "data-[state=open]:animate-enter [--motion-rise-from:-4px]",
          className,
        )}
        {...props}
      />
    </MenuPrimitive.Portal>
  )
}

export type MenuItemProps = ComponentProps<typeof MenuPrimitive.Item> & {
  icon?: LucideIcon
  /** danger: la acción borra o no se deshace. */
  tone?: "default" | "danger"
  children: ReactNode
}

export function MenuItem({ icon, tone = "default", className, children, ...props }: MenuItemProps) {
  return (
    <MenuPrimitive.Item
      className={cn(
        "flex h-control-compact cursor-pointer select-none items-center gap-compact rounded-compact px-compact text-body outline-none",
        "data-highlighted:bg-surface-hover data-disabled:cursor-not-allowed data-disabled:opacity-(--state-disabled-opacity)",
        tone === "danger" ? "text-fn-danger" : "text-ink",
        className,
      )}
      {...props}
    >
      {icon ? <Icon icon={icon} className={tone === "danger" ? undefined : "text-ink-muted"} /> : null}
      {children}
    </MenuPrimitive.Item>
  )
}

export function MenuLabel({ className, ...props }: ComponentProps<typeof MenuPrimitive.Label>) {
  return <MenuPrimitive.Label className={cn("px-compact pt-compact pb-related text-micro text-ink-muted uppercase", className)} {...props} />
}

export function MenuSeparator({ className, ...props }: ComponentProps<typeof MenuPrimitive.Separator>) {
  return <MenuPrimitive.Separator className={cn("mx-compact my-related h-px bg-line", className)} {...props} />
}
