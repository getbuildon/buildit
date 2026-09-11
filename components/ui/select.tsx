"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CheckIcon, ChevronDownIcon, ChevronRightIcon, ChevronUpIcon } from "lucide-react"

import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const SELECT_TRIGGER_CLASSNAME = cn(
  "flex w-full min-w-0 items-center justify-between gap-2 overflow-hidden rounded-[10px] border border-[#afb3ba] bg-white px-3 text-[14px] font-normal leading-[1.4] text-[#272a2d] shadow-xs transition-[color,box-shadow,border-color] outline-none disabled:cursor-not-allowed disabled:opacity-50",
  "focus-visible:border-[#ff7433] focus-visible:ring-0 data-[placeholder]:text-[#777b84]",
  "data-[size=default]:h-[42px] data-[size=sm]:h-8",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  "[&>:first-child]:min-w-0 [&>:first-child]:flex-1 [&>:first-child]:truncate [&>:first-child]:text-left",
)

const SELECT_CONTENT_CLASSNAME = cn(
  "relative z-50 min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-[10px] border border-[#edeef0] bg-white text-[#272a2d] shadow-[0_4px_16px_rgba(24,25,27,0.08)]",
)

const SELECT_ITEM_CLASSNAME = cn(
  "relative flex w-full cursor-default select-none items-center gap-2 rounded-[8px] py-2 pr-8 pl-2 text-[14px] text-[#272a2d] outline-none",
  "hover:bg-[#edeef0] data-[highlighted]:bg-[#edeef0] data-[highlighted]:text-[#272a2d] focus-visible:bg-[#edeef0] focus-visible:text-[#272a2d] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
)

function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({ ...props }: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "default" | "sm"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        SELECT_TRIGGER_CLASSNAME,
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 text-[#43484e] opacity-70" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          SELECT_CONTENT_CLASSNAME,
          "max-h-(--radix-select-content-available-height) origin-(--radix-select-content-transform-origin)",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" && "w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-2 py-1.5 text-xs text-[#777b84]", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        SELECT_ITEM_CLASSNAME,
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4 text-[#5a6169]" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-[#edeef0]", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export type NestedSelectOption = {
  value: string
  label: React.ReactNode
  allowCustomInput?: boolean
}

export type NestedSelectGroup = {
  id: string
  label: string
  options: readonly NestedSelectOption[]
}

type NestedSelectProps = {
  id?: string
  value?: string
  groupId?: string
  groups: readonly NestedSelectGroup[]
  onValueChange: (value: string, groupId: string) => void
  placeholder?: string
  disabled?: boolean
  size?: "default" | "sm"
  triggerClassName?: string
  itemClassName?: string
  "aria-label"?: string
}

function getPresetOptionValues(groups: readonly NestedSelectGroup[]) {
  return new Set(
    groups.flatMap((group) =>
      group.options
        .filter((option) => !option.allowCustomInput)
        .map((option) => option.value),
    ),
  )
}

function NestedSelectCustomInput({
  value,
  className,
  onChange,
  onCommit,
  onCancel,
}: {
  value: string
  className?: string
  onChange: (value: string) => void
  onCommit: () => void
  onCancel: () => void
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const ignoreBlurRef = React.useRef(false)

  React.useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <input
      ref={inputRef}
      value={value}
      aria-label="Nombre personalizado"
      placeholder="Escribí el tipo"
      onChange={(event) => onChange(event.target.value)}
      onBlur={() => {
        if (ignoreBlurRef.current) {
          ignoreBlurRef.current = false
          return
        }
        onCommit()
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault()
          onCommit()
        }
        if (event.key === "Escape") {
          event.preventDefault()
          ignoreBlurRef.current = true
          onCancel()
        }
      }}
      className={cn(
        "h-auto w-full rounded-[8px] border border-[#ff7433] bg-white px-2 py-2 text-[14px] text-[#272a2d] outline-none",
        className,
      )}
    />
  )
}

function useNestedSelectSubmenuSide() {
  const [side, setSide] = React.useState<"right" | "bottom">("right")

  React.useEffect(() => {
    const media = window.matchMedia("(min-width: 380px)")
    const sync = () => setSide(media.matches ? "right" : "bottom")
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  return side
}

function NestedSelect({
  id,
  value,
  groupId,
  groups,
  onValueChange,
  placeholder = "Seleccionar",
  disabled,
  size = "default",
  triggerClassName,
  itemClassName,
  "aria-label": ariaLabel,
}: NestedSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [editingKey, setEditingKey] = React.useState<string | null>(null)
  const [customDraft, setCustomDraft] = React.useState("")
  const submenuSide = useNestedSelectSubmenuSide()
  const presetValues = React.useMemo(() => getPresetOptionValues(groups), [groups])
  const isCustomValue = Boolean(value) && !presetValues.has(value ?? "")
  const selectedGroupId =
    (groupId && groups.some((group) => group.id === groupId) ? groupId : undefined) ??
    groups.find((group) =>
      group.options.some((option) =>
        option.allowCustomInput
          ? isCustomValue || option.value === value
          : option.value === value,
      ),
    )?.id
  const [activeGroupId, setActiveGroupId] = React.useState(
    selectedGroupId ?? groups[0]?.id ?? "",
  )

  React.useEffect(() => {
    if (!open) return
    setActiveGroupId(selectedGroupId ?? groups[0]?.id ?? "")
  }, [groups, open, selectedGroupId])

  const activeGroup =
    groups.find((group) => group.id === activeGroupId) ?? groups[0]
  const selectedPresetLabel = groups
    .flatMap((group) => group.options)
    .find((option) => !option.allowCustomInput && option.value === value)?.label
  const selectedLabel = selectedPresetLabel ?? (isCustomValue ? value : undefined)

  function optionKey(currentGroupId: string, optionValue: string) {
    return `${currentGroupId}::${optionValue}`
  }

  function startCustomEdit(currentGroupId: string, option: NestedSelectOption) {
    setEditingKey(optionKey(currentGroupId, option.value))
    setCustomDraft(isCustomValue && value ? value : "")
  }

  function cancelCustomEdit() {
    setEditingKey(null)
    setCustomDraft("")
  }

  function commitCustomEdit(closeMenu: boolean) {
    const trimmed = customDraft.trim()
    const groupFromEdit = editingKey?.split("::")[0]
    setEditingKey(null)
    setCustomDraft("")
    if (!trimmed) return
    onValueChange(trimmed, groupFromEdit || activeGroup?.id || groups[0]?.id || "")
    if (closeMenu) setOpen(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && editingKey) {
      const trimmed = customDraft.trim()
      const groupFromEdit = editingKey.split("::")[0]
      if (trimmed) onValueChange(trimmed, groupFromEdit || activeGroup?.id || groups[0]?.id || "")
      setEditingKey(null)
      setCustomDraft("")
    }
    if (!nextOpen) {
      setEditingKey(null)
      setCustomDraft("")
    }
    setOpen(nextOpen)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        data-size={size}
        data-placeholder={selectedLabel ? undefined : ""}
        className={cn(SELECT_TRIGGER_CLASSNAME, triggerClassName)}
      >
        <span className={cn(!selectedLabel && "text-[#777b84]")}>
          {selectedLabel ?? placeholder}
        </span>
        <ChevronDownIcon
          className={cn("size-4 text-[#43484e] opacity-70", open && "rotate-180")}
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        collisionPadding={8}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          const target = event.target
          if (
            target instanceof Element &&
            target.closest("[data-nested-select-submenu]")
          ) {
            event.preventDefault()
          }
        }}
        className="w-auto border-0 bg-transparent p-0 shadow-none"
      >
        <div className={cn(SELECT_CONTENT_CLASSNAME, "w-[198px] p-1")}>
          {groups.map((group) => {
            const isActive = group.id === activeGroup?.id
            const groupButton = (
              <button
                type="button"
                data-highlighted={isActive ? "" : undefined}
                onMouseEnter={() => setActiveGroupId(group.id)}
                onFocus={() => setActiveGroupId(group.id)}
                onClick={() => setActiveGroupId(group.id)}
                className={cn(SELECT_ITEM_CLASSNAME, "pr-2", itemClassName)}
              >
                <span className="min-w-0 flex-1 truncate text-left">{group.label}</span>
                <ChevronRightIcon className="size-4 text-[#43484e] opacity-70" />
              </button>
            )

            if (!isActive || !activeGroup) {
              return <React.Fragment key={group.id}>{groupButton}</React.Fragment>
            }

            return (
              <Popover key={group.id} open>
                <PopoverAnchor asChild>{groupButton}</PopoverAnchor>
                <PopoverContent
                  data-nested-select-submenu=""
                  side={submenuSide}
                  align="start"
                  sideOffset={4}
                  collisionPadding={8}
                  onOpenAutoFocus={(event) => event.preventDefault()}
                  onCloseAutoFocus={(event) => event.preventDefault()}
                  onInteractOutside={(event) => event.preventDefault()}
                  className={cn(
                    SELECT_CONTENT_CLASSNAME,
                    "w-[198px] max-h-(--radix-popover-content-available-height) overflow-y-auto p-1",
                  )}
                >
                  {activeGroup.options.map((option) => {
                    const key = optionKey(activeGroup.id, option.value)
                    const isEditing = editingKey === key
                    const isSelected =
                      option.allowCustomInput
                        ? (isCustomValue && activeGroup.id === groupId) ||
                          (!isCustomValue && option.value === value)
                        : option.value === value

                    if (option.allowCustomInput && isEditing) {
                      return (
                        <NestedSelectCustomInput
                          key={key}
                          value={customDraft}
                          className={itemClassName}
                          onChange={setCustomDraft}
                          onCommit={() => commitCustomEdit(true)}
                          onCancel={cancelCustomEdit}
                        />
                      )
                    }

                    return (
                      <button
                        key={key}
                        type="button"
                        data-highlighted={isSelected ? "" : undefined}
                        onClick={() => {
                          if (option.allowCustomInput) {
                            startCustomEdit(activeGroup.id, option)
                            return
                          }
                          onValueChange(option.value, activeGroup.id)
                          setOpen(false)
                        }}
                        className={cn(SELECT_ITEM_CLASSNAME, itemClassName)}
                      >
                        <span className="min-w-0 flex-1 truncate text-left">
                          {option.allowCustomInput && isCustomValue && activeGroup.id === groupId
                            ? value
                            : option.label}
                        </span>
                        {isSelected ? (
                          <CheckIcon className="absolute right-2 size-4 text-[#5a6169]" />
                        ) : null}
                      </button>
                    )
                  })}
                </PopoverContent>
              </Popover>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export {
  NestedSelect,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
