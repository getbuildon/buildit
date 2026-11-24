import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "../../lib/cn"
import { fieldStyles } from "../../atoms/input/Input"
import { Icon } from "../../atoms/icon/Icon"

export type SelectProps = Omit<ComponentProps<typeof SelectPrimitive.Root>, "children"> & {
  children: ReactNode
  placeholder?: string
  size?: "compact" | "default"
  invalid?: boolean
  /** id y aria-* van al botón que abre la lista: sirve dentro de un Field. */
  id?: string
  "aria-label"?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean | "true" | "false"
  "aria-required"?: boolean
  className?: string
}

/**
 * Elegir una opción de una lista. Mismo aspecto que Input. Se abre con teclado,
 * se busca escribiendo la primera letra y en el celular no se sale de la pantalla.
 * Para más de ~15 opciones o para buscar, Combobox (próxima tanda).
 */
export function Select({
  children,
  placeholder = "Elegí una opción",
  size,
  invalid,
  id,
  className,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
  ...props
}: SelectProps) {
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true"
  return (
    <SelectPrimitive.Root {...props}>
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={isInvalid || undefined}
        aria-required={ariaRequired}
        className={cn(
          fieldStyles({ size }),
          "flex cursor-pointer items-center justify-between gap-compact text-left data-placeholder:text-ink-subtle",
          className,
        )}
      >
        <span className="truncate">
          <SelectPrimitive.Value placeholder={placeholder} />
        </span>
        <SelectPrimitive.Icon asChild>
          <Icon icon={ChevronDown} className="text-ink-muted" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          collisionPadding={8}
          className={cn(
            "z-(--z-overlay) max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden",
            "rounded-control border border-line bg-canvas-overlay text-ink shadow-overlay animate-enter [--motion-rise-from:-4px]",
          )}
        >
          <SelectPrimitive.Viewport className="p-related">{children}</SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export function SelectItem({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex h-control-compact cursor-pointer select-none items-center gap-compact rounded-compact pr-block pl-compact text-body outline-none",
        "data-highlighted:bg-surface-hover data-[state=checked]:text-action-text",
        "data-disabled:cursor-not-allowed data-disabled:opacity-(--state-disabled-opacity)",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-compact inline-flex">
        <Icon icon={Check} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

/** Grupo de opciones con título (por ejemplo, unidades por piso). */
export function SelectGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <SelectPrimitive.Group>
      <SelectPrimitive.Label className="px-compact pt-compact pb-related text-micro text-ink-muted uppercase">{label}</SelectPrimitive.Label>
      {children}
    </SelectPrimitive.Group>
  )
}

export function SelectSeparator() {
  return <SelectPrimitive.Separator className="mx-compact my-related h-px bg-line" />
}
