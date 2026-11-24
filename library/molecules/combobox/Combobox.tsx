import { Command } from "cmdk"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { useMemo, useState, type ReactNode } from "react"
import { cn } from "../../lib/cn"
import { fieldStyles } from "../../atoms/input/Input"
import { Icon } from "../../atoms/icon/Icon"
import { Popover, PopoverContent, PopoverTrigger } from "../popover/Popover"

export type ComboboxOption = {
  value: string
  label: string
  /** Texto secundario: un mail, un piso. También se busca por él. */
  description?: string
  group?: string
  disabled?: boolean
}

export type ComboboxProps = {
  options: readonly ComboboxOption[]
  value: string | undefined
  onValueChange: (value: string | undefined) => void
  placeholder?: string
  searchPlaceholder?: string
  /** Qué decir cuando la búsqueda no encuentra nada. */
  emptyText?: ReactNode
  size?: "compact" | "default"
  disabled?: boolean
  id?: string
  "aria-label"?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean | "true" | "false"
  className?: string
}

/** Sin tildes ni mayúsculas: «gomez» encuentra «Gómez». */
function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
}

/**
 * Elegir de una lista larga buscando: clientes, unidades, miembros. Reemplaza el
 * NestedSelect de ~300 líneas. Se escribe para filtrar, sin importar tildes; flechas
 * para moverse, Enter para elegir. Para menos de ~15 opciones sin búsqueda, Select.
 */
export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Elegí una opción",
  searchPlaceholder = "Buscar…",
  emptyText = "No hay resultados.",
  size,
  disabled,
  className,
  "aria-invalid": ariaInvalid,
  ...props
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)
  const groups = useMemo(() => {
    const map = new Map<string, ComboboxOption[]>()
    for (const option of options) {
      const key = option.group ?? ""
      map.set(key, [...(map.get(key) ?? []), option])
    }
    return [...map.entries()]
  }, [options])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        {...props}
        role="combobox"
        aria-expanded={open}
        aria-invalid={ariaInvalid === true || ariaInvalid === "true" || undefined}
        disabled={disabled}
        className={cn(fieldStyles({ size }), "flex cursor-pointer items-center justify-between gap-compact text-left", className)}
      >
        <span className={cn("min-w-0 flex-1 truncate", !selected && "text-ink-subtle")}>{selected?.label ?? placeholder}</span>
        <Icon icon={ChevronsUpDown} className="text-ink-muted" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-64 p-0">
        <Command
          filter={(itemValue, search, keywords) => {
            const haystack = normalize([itemValue, ...(keywords ?? [])].join(" "))
            return haystack.includes(normalize(search)) ? 1 : 0
          }}
          className="flex flex-col"
        >
          <div className="flex items-center gap-compact border-b border-line px-snug">
            <Icon icon={Search} className="text-ink-muted" />
            <Command.Input
              placeholder={searchPlaceholder}
              className="h-control min-w-0 flex-1 bg-transparent text-field outline-none placeholder:text-ink-subtle"
            />
          </div>
          <Command.List className="max-h-72 overflow-y-auto p-related">
            <Command.Empty className="px-compact py-group text-center text-body text-ink-muted">{emptyText}</Command.Empty>
            {groups.map(([group, items]) => (
              <Command.Group
                key={group || "sin-grupo"}
                heading={group || undefined}
                className="[&_[cmdk-group-heading]]:px-compact [&_[cmdk-group-heading]]:pt-compact [&_[cmdk-group-heading]]:pb-related [&_[cmdk-group-heading]]:text-micro [&_[cmdk-group-heading]]:text-ink-muted [&_[cmdk-group-heading]]:uppercase"
              >
                {items.map((option) => (
                  <Command.Item
                    key={option.value}
                    // value único (el id); se busca por el texto y la descripción.
                    value={option.value}
                    keywords={[option.label, option.description ?? ""]}
                    disabled={option.disabled}
                    onSelect={() => {
                      onValueChange(option.value === value ? undefined : option.value)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex min-h-control-compact cursor-pointer items-center gap-compact rounded-compact px-compact py-related text-body outline-none",
                      "data-[selected=true]:bg-surface-hover data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-(--state-disabled-opacity)",
                      option.value === value && "text-action-text",
                    )}
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{option.label}</span>
                      {option.description ? <span className="truncate text-meta text-ink-muted">{option.description}</span> : null}
                    </span>
                    {option.value === value ? <Icon icon={Check} /> : null}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
