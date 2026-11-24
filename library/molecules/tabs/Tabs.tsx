import * as TabsPrimitive from "@radix-ui/react-tabs"
import type { ComponentProps } from "react"
import { cn } from "../../lib/cn"

export const Tabs = TabsPrimitive.Root

/**
 * Pestañas: cambian de vista dentro de la misma pantalla. Flechas para moverse.
 * Si cambia la URL (otra sección), es navegación, no pestañas.
 */
export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("flex gap-group overflow-x-auto border-b border-line [scrollbar-width:none]", className)}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "focus-ring motion-color relative -mb-px inline-flex h-control shrink-0 cursor-pointer items-center gap-compact border-b-2 border-transparent text-label text-ink-muted",
        "hover:text-ink data-[state=active]:border-action data-[state=active]:text-ink",
        "disabled:cursor-not-allowed disabled:opacity-(--state-disabled-opacity)",
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("focus-ring rounded-control pt-group outline-none", className)} {...props} />
}
