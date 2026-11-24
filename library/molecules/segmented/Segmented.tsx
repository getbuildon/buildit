import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import type { ReactNode } from "react"
import { cn } from "../../lib/cn"

export type SegmentedOption = { value: string; label: ReactNode; disabled?: boolean }

export type SegmentedProps = {
  value: string
  onValueChange: (value: string) => void
  options: readonly SegmentedOption[]
  /** Qué se elige. Lo lee el lector de pantalla. */
  label: string
  size?: "compact" | "default"
  className?: string
}

/**
 * Control segmentado: 2 a 5 opciones excluyentes a la vista (Pendiente · En curso ·
 * Listo). Mismo aspecto que el de la app (pista gris, ítem blanco con sombra mínima).
 * Con radio concéntrico: el ítem redondea 6 dentro de una pista de 10 con 4 de aire,
 * en vez de los 8 de hoy, para que las curvas queden paralelas.
 * Nunca queda sin opción elegida: tocar la activa no la apaga.
 * Todas las opciones en tinta (el gris de hoy da 4.4:1 sobre la pista); la elegida se
 * distingue por el fondo blanco y la sombra, como el segmentado de Apple.
 */
export function Segmented({ value, onValueChange, options, label, size = "default", className }: SegmentedProps) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(next)
      }}
      aria-label={label}
      className={cn(
        "inline-flex items-stretch rounded-control border border-line bg-canvas-track p-related",
        size === "compact" ? "h-control-compact" : "h-10",
        className,
      )}
    >
      {options.map((option) => (
        <ToggleGroupPrimitive.Item
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          className={cn(
            "focus-ring motion-color inline-flex cursor-pointer items-center justify-center rounded-compact px-group text-meta font-medium whitespace-nowrap text-ink",
            "state-veil data-[state=on]:bg-canvas-raised data-[state=on]:text-ink data-[state=on]:shadow-thumb",
            "disabled:cursor-not-allowed disabled:opacity-(--state-disabled-opacity)",
          )}
        >
          {option.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  )
}
