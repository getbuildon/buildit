"use client"

import { ChevronDown } from "lucide-react"
import { useState } from "react"

import { Checkbox } from "@/library/atoms/checkbox/Checkbox"
import { Icon } from "@/library/atoms/icon/Icon"
import { cn } from "@/library/lib/cn"
import { Popover, PopoverContent, PopoverTrigger } from "@/library/molecules/popover/Popover"

import type { ProjectUnitOption } from "@/app/project/[projectId]/clientes/actions"

/** «Unidad 4B»: el nombre de la unidad tal como se lee en la lista. */
export function nombreDeUnidad(opcion: ProjectUnitOption): string {
  const nombre = opcion.label.trim()
  if (nombre.toLowerCase().startsWith("unidad ")) return nombre
  const codigo = opcion.pillLabel.trim()
  return codigo ? `Unidad ${codigo}` : nombre
}

/**
 * Elegir unidades: lista con casillas. Las que ya tienen otro cliente (o una invitación
 * pendiente) se ven apagadas con «con cliente», para que se entienda por qué no se pueden
 * elegir. Field le pasa id y aria-* al botón que abre la lista.
 */
export function ElegirUnidades({
  opciones,
  ocupadas,
  value,
  onChange,
  disabled,
  id,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
}: {
  opciones: ProjectUnitOption[]
  /** Unidades que ya tienen cliente. Las que están en `value` se pueden destildar igual. */
  ocupadas: Set<string>
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
  /** Lo manda Field; un botón no admite aria-required ni aria-invalid: el error se lee por aria-describedby. */
  "aria-required"?: boolean
}) {
  const [abierta, setAbierta] = useState(false)
  const elegidas = opciones.filter((opcion) => value.includes(opcion.id))
  const texto =
    elegidas.length === 0 ? "Elegí unidades" : elegidas.length === 1 ? nombreDeUnidad(elegidas[0]) : `${elegidas.length} unidades`

  return (
    <Popover open={abierta} onOpenChange={setAbierta}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-describedby={describedBy}
          data-invalid={invalid || undefined}
          className={cn(
            "focus-ring motion-color flex h-control w-full min-w-40 cursor-pointer items-center gap-compact rounded-control border border-line-strong bg-canvas-raised px-snug text-left text-field hover:border-ink-subtle",
            "disabled:cursor-not-allowed disabled:bg-canvas-sunken disabled:opacity-(--state-disabled-opacity)",
            "data-invalid:border-fn-danger",
            elegidas.length === 0 && "text-ink-subtle",
          )}
        >
          <span className="min-w-0 flex-1 truncate">{texto}</span>
          <Icon icon={ChevronDown} className="text-ink-muted" />
        </button>
      </PopoverTrigger>
      <PopoverContent aria-label="Elegir unidades" align="start" className="max-h-72 w-(--radix-popover-trigger-width) min-w-56 overflow-y-auto p-compact">
        {opciones.length === 0 ? (
          <p className="px-compact py-compact text-body text-ink-muted">No hay unidades configuradas.</p>
        ) : (
          <div role="group" aria-label="Unidades" className="flex flex-col">
            {opciones.map((opcion) => {
              const marcada = value.includes(opcion.id)
              const tomada = ocupadas.has(opcion.id) && !marcada
              return (
                <label
                  key={opcion.id}
                  className={cn(
                    "flex h-9 items-center gap-compact rounded-compact px-compact text-body",
                    tomada ? "text-ink-muted" : "cursor-pointer hover:bg-surface-hover",
                  )}
                >
                  <Checkbox
                    checked={marcada}
                    disabled={tomada}
                    onCheckedChange={() => onChange(marcada ? value.filter((item) => item !== opcion.id) : [...value, opcion.id])}
                  />
                  <span className="truncate">{nombreDeUnidad(opcion)}</span>
                  {tomada ? <span className="ml-auto shrink-0 text-meta">con cliente</span> : null}
                </label>
              )
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
