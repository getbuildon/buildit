"use client"

import { useEffect, useState } from "react"
import { SlidersHorizontal, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  BACKOFFICE_PLAN_FILTER_GROUPS,
  BACKOFFICE_PROJECT_STATUS_FILTER_OPTIONS,
  getBackofficePlanFilterLabel,
  getBackofficeStatusFilterLabel,
} from "@/lib/backoffice/proyectosFilters"
import type { BackofficeProjectStatusKind } from "@/lib/backoffice/proyectosQuery"
import { cn } from "@/lib/utils"

export type ProyectosFiltersValue = {
  planSlugs: string[]
  statuses: BackofficeProjectStatusKind[]
}

type ProyectosFiltersDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: ProyectosFiltersValue
  onApply: (value: ProyectosFiltersValue) => void
}

const SECTION_LABEL_CLASSNAME = "text-xs font-medium leading-4 text-[#5a6169]"
const GROUP_LABEL_CLASSNAME = "text-sm font-medium leading-5 text-[#18191b]"

function FilterChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm leading-5 transition-colors",
        selected
          ? "border-[#ff7433] bg-[#fff7f2] text-[#18191b]"
          : "border-[#edeef0] bg-white text-[#363a3f] hover:border-[#d7d9de]",
      )}
    >
      {children}
    </button>
  )
}

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
}

function AppliedFilterChip({
  label,
  disabled,
  onRemove,
}: {
  label: string
  disabled?: boolean
  onRemove: () => void
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-lg border border-[#edeef0] bg-[#fafafa] py-1 pl-2.5 pr-1 text-xs leading-4 text-[#363a3f]">
      <span className="truncate">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        aria-label={`Quitar filtro ${label}`}
        className="grid size-5 shrink-0 place-items-center rounded-md text-[#777b84] transition-colors hover:bg-white hover:text-[#363a3f] disabled:opacity-50"
      >
        <X className="size-3" strokeWidth={2} />
      </button>
    </span>
  )
}

export function ProyectosAppliedFilters({
  planSlugs,
  statuses,
  disabled,
  onRemovePlanSlug,
  onRemoveStatus,
}: {
  planSlugs: string[]
  statuses: BackofficeProjectStatusKind[]
  disabled?: boolean
  onRemovePlanSlug: (slug: string) => void
  onRemoveStatus: (status: BackofficeProjectStatusKind) => void
}) {
  if (planSlugs.length === 0 && statuses.length === 0) {
    return null
  }

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      {planSlugs.map((slug) => (
        <AppliedFilterChip
          key={`plan-${slug}`}
          label={getBackofficePlanFilterLabel(slug)}
          disabled={disabled}
          onRemove={() => onRemovePlanSlug(slug)}
        />
      ))}
      {statuses.map((status) => (
        <AppliedFilterChip
          key={`status-${status}`}
          label={getBackofficeStatusFilterLabel(status)}
          disabled={disabled}
          onRemove={() => onRemoveStatus(status)}
        />
      ))}
    </div>
  )
}

export function ProyectosFiltersDialog({
  open,
  onOpenChange,
  value,
  onApply,
}: ProyectosFiltersDialogProps) {
  const [draft, setDraft] = useState<ProyectosFiltersValue>(value)

  useEffect(() => {
    if (open) {
      setDraft(value)
    }
  }, [open, value])

  const apply = () => {
    onApply(draft)
    onOpenChange(false)
  }

  const clear = () => {
    const cleared: ProyectosFiltersValue = { planSlugs: [], statuses: [] }
    setDraft(cleared)
    onApply(cleared)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] gap-0 overflow-visible p-0">
        <div className="border-b border-[#f4f5f6] px-6 py-5">
          <DialogHeader className="gap-1.5">
            <DialogTitle className="font-recoleta text-[22px] font-normal leading-[1.2] text-[#272a2d]">
              Filtros
            </DialogTitle>
            <DialogDescription className="text-sm leading-[1.4] text-[#777b84]">
              Podés combinar varios planes y estados a la vez.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex max-h-[min(70vh,520px)] flex-col gap-6 overflow-y-auto px-6 py-5">
          <section className="flex flex-col gap-4">
            <p className={SECTION_LABEL_CLASSNAME}>Subscripción</p>

            {BACKOFFICE_PLAN_FILTER_GROUPS.map((group) => (
              <div key={group.id} className="flex flex-col gap-2.5">
                <p className={GROUP_LABEL_CLASSNAME}>{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.tiers.map((tier) => {
                    const selected = draft.planSlugs.includes(tier.slug)
                    return (
                      <FilterChip
                        key={tier.slug}
                        selected={selected}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            planSlugs: toggleValue(current.planSlugs, tier.slug),
                          }))
                        }
                      >
                        {tier.label}
                      </FilterChip>
                    )
                  })}
                </div>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-3">
            <p className={SECTION_LABEL_CLASSNAME}>Estado</p>
            <div className="flex flex-wrap gap-2">
              {BACKOFFICE_PROJECT_STATUS_FILTER_OPTIONS.map((option) => {
                const selected = draft.statuses.includes(option.id)
                return (
                  <FilterChip
                    key={option.id}
                    selected={selected}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        statuses: toggleValue(current.statuses, option.id),
                      }))
                    }
                  >
                    {option.label}
                  </FilterChip>
                )
              })}
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[#f4f5f6] px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={clear}
            className="h-10 rounded-[10px] border-[#edeef0] bg-white px-4 text-sm font-medium text-[#43484e] shadow-none hover:bg-[#f4f5f6]"
          >
            Limpiar
          </Button>
          <Button
            type="button"
            variant="brand"
            size="brand"
            onClick={apply}
            className="px-4 text-sm font-medium"
          >
            Aplicar filtros
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ProyectosFiltersButton({
  hasActiveFilters,
  disabled,
  onClick,
}: {
  hasActiveFilters: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label="Abrir filtros"
      className={cn(
        "relative grid size-10 shrink-0 place-items-center rounded-xl border border-[#edeef0] bg-white text-[#696e77] transition-colors hover:border-[#d7d9de] hover:text-[#363a3f] disabled:opacity-50",
        hasActiveFilters && "border-[#ff7433] text-[#ff7433]",
      )}
    >
      <SlidersHorizontal className="size-4" strokeWidth={1.75} />
      {hasActiveFilters ? (
        <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#ff7433]" />
      ) : null}
    </button>
  )
}
