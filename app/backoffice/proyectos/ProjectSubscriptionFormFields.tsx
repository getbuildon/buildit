"use client"

import { useMemo } from "react"

import type {
  BackofficeBillingInterval,
  BackofficePlanGroupId,
  BackofficeProjectSubscriptionInput,
  BackofficeSubscriptionPlanOption,
} from "@/lib/backoffice/projectSubscriptionForm"
import { formatPlanPricePreview } from "@/lib/backoffice/projectSubscriptionForm"
import { BACKOFFICE_PLAN_FILTER_GROUPS } from "@/lib/backoffice/proyectosFilters"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { formatDashboardInputDate } from "@/lib/backoffice/dashboardPeriodClient"
import { cn } from "@/lib/utils"

const FIELD_CLASSNAME =
  "h-[42px] rounded-xl border-[#edeef0] bg-white text-sm leading-[1.4] text-[#18191b] placeholder:text-[#696e77] shadow-none focus-visible:border-[#ff7433] focus-visible:ring-0"

const LABEL_CLASSNAME = "text-xs font-medium leading-[1.4] text-[#5a6169]"

const PLAN_GROUP_OPTIONS: { id: BackofficePlanGroupId; label: string }[] = [
  ...BACKOFFICE_PLAN_FILTER_GROUPS.map((group) => ({
    id: group.id as BackofficePlanGroupId,
    label: group.label,
  })),
  { id: "custom", label: "Personalizado" },
]

const BILLING_OPTIONS: { id: BackofficeBillingInterval; label: string }[] = [
  { id: "monthly", label: "Mensual" },
  { id: "annual", label: "Anual" },
]

export type ProjectSubscriptionFormValue = BackofficeProjectSubscriptionInput

export function emptyProjectSubscriptionFormValue(): ProjectSubscriptionFormValue {
  return {
    planGroupId: "compacto",
    planSlug: "compacto-60",
    billingInterval: "monthly",
    billingStartDate: formatDashboardInputDate(new Date()),
    customPlan: {
      name: "",
      surfaceLabel: "",
      surfaceMaxM2: "",
      monthlyPriceUsd: "",
      annualMonthlyPriceUsd: "",
    },
  }
}

type ProjectSubscriptionFormFieldsProps = {
  value: ProjectSubscriptionFormValue
  plans: BackofficeSubscriptionPlanOption[]
  onChange: (value: ProjectSubscriptionFormValue) => void
  mode?: "create" | "edit"
  subscriptionStatus?: "active" | "cancelled" | "past_due" | null
  disabled?: boolean
  onCancelSubscription?: () => void
  isCancelling?: boolean
}

export function ProjectSubscriptionFormFields({
  value,
  plans,
  onChange,
  mode = "create",
  subscriptionStatus = null,
  disabled = false,
  onCancelSubscription,
  isCancelling = false,
}: ProjectSubscriptionFormFieldsProps) {
  const tiersForGroup = useMemo(() => {
    if (value.planGroupId === "custom") return []

    const group = BACKOFFICE_PLAN_FILTER_GROUPS.find(
      (item) => item.id === value.planGroupId,
    )
    if (!group) return []

    return group.tiers
      .map((tier) => plans.find((plan) => plan.slug === tier.slug))
      .filter((plan): plan is BackofficeSubscriptionPlanOption => plan != null)
  }, [plans, value.planGroupId])

  const selectedCatalogPlan = useMemo(() => {
    if (value.planGroupId === "custom" || !value.planSlug) return null
    return plans.find((plan) => plan.slug === value.planSlug) ?? null
  }, [plans, value.planGroupId, value.planSlug])

  const billingStartDate = useMemo(() => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.billingStartDate)
    if (!match) return undefined

    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    return new Date(year, month - 1, day)
  }, [value.billingStartDate])

  const update = (patch: Partial<ProjectSubscriptionFormValue>) => {
    onChange({ ...value, ...patch })
  }

  const updateCustomPlan = (
    patch: Partial<NonNullable<ProjectSubscriptionFormValue["customPlan"]>>,
  ) => {
    onChange({
      ...value,
      customPlan: {
        name: value.customPlan?.name ?? "",
        surfaceLabel: value.customPlan?.surfaceLabel ?? "",
        surfaceMaxM2: value.customPlan?.surfaceMaxM2 ?? "",
        monthlyPriceUsd: value.customPlan?.monthlyPriceUsd ?? "",
        annualMonthlyPriceUsd: value.customPlan?.annualMonthlyPriceUsd ?? "",
        ...patch,
      },
    })
  }

  const handlePlanGroupChange = (planGroupId: BackofficePlanGroupId) => {
    if (planGroupId === "custom") {
      update({
        planGroupId,
        planSlug: undefined,
        existingPlanId: undefined,
      })
      return
    }

    const group = BACKOFFICE_PLAN_FILTER_GROUPS.find((item) => item.id === planGroupId)
    const firstTierSlug = group?.tiers[0]?.slug

    update({
      planGroupId,
      planSlug: firstTierSlug,
      existingPlanId: undefined,
    })
  }

  const isCancelled = subscriptionStatus === "cancelled"
  const isEditable = !disabled && !isCancelled

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#f4f5f6] bg-[#fafafa] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium leading-5 text-[#18191b]">Subscripción</p>
          <p className="pt-1 text-xs leading-4 text-[#777b84]">
            {mode === "create"
              ? "Plan, facturación e inicio de cobro para el nuevo proyecto."
              : "Plan, facturación e inicio de cobro del proyecto."}
          </p>
        </div>
        {subscriptionStatus ? (
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
              subscriptionStatus === "active"
                ? "bg-[#e6f4ef] text-[#208368]"
                : subscriptionStatus === "cancelled"
                  ? "bg-[#fdebec] text-[#dc3e42]"
                  : "bg-[#fff1ea] text-[#c2410c]",
            )}
          >
            {subscriptionStatus === "active"
              ? "Activa"
              : subscriptionStatus === "cancelled"
                ? "Cancelada"
                : "Vencida"}
          </span>
        ) : null}
      </div>

      {isCancelled ? (
        <p className="text-sm leading-5 text-[#777b84]">
          Esta subscripción fue cancelada. Los datos del plan no se pueden modificar.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="project-plan-group" className={LABEL_CLASSNAME}>
            Tipo de plan
          </Label>
          <select
            id="project-plan-group"
            value={value.planGroupId}
            disabled={!isEditable}
            onChange={(event) =>
              handlePlanGroupChange(event.target.value as BackofficePlanGroupId)
            }
            className={cn(FIELD_CLASSNAME, "px-3", !isEditable && "opacity-60")}
          >
            {PLAN_GROUP_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {value.planGroupId !== "custom" ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-plan-tier" className={LABEL_CLASSNAME}>
              Tier de superficie
            </Label>
            <select
              id="project-plan-tier"
              value={value.planSlug ?? ""}
              disabled={!isEditable}
              onChange={(event) => update({ planSlug: event.target.value })}
              className={cn(FIELD_CLASSNAME, "px-3", !isEditable && "opacity-60")}
            >
              {tiersForGroup.map((plan) => (
                <option key={plan.slug} value={plan.slug}>
                  {plan.surfaceLabel}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {value.planGroupId === "custom" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="custom-plan-name" className={LABEL_CLASSNAME}>
              Nombre del plan
            </Label>
            <Input
              id="custom-plan-name"
              value={value.customPlan?.name ?? ""}
              disabled={!isEditable}
              onChange={(event) => updateCustomPlan({ name: event.target.value })}
              placeholder="Plan especial cliente X"
              className={FIELD_CLASSNAME}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="custom-plan-surface-label" className={LABEL_CLASSNAME}>
              Descripción de superficie
            </Label>
            <Input
              id="custom-plan-surface-label"
              value={value.customPlan?.surfaceLabel ?? ""}
              disabled={!isEditable}
              onChange={(event) =>
                updateCustomPlan({ surfaceLabel: event.target.value })
              }
              placeholder="Superficie hasta 800 m²"
              className={FIELD_CLASSNAME}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="custom-plan-surface-max" className={LABEL_CLASSNAME}>
              Superficie máx. (m²)
            </Label>
            <Input
              id="custom-plan-surface-max"
              value={value.customPlan?.surfaceMaxM2 ?? ""}
              disabled={!isEditable}
              onChange={(event) =>
                updateCustomPlan({ surfaceMaxM2: event.target.value })
              }
              placeholder="800"
              className={FIELD_CLASSNAME}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="custom-plan-monthly" className={LABEL_CLASSNAME}>
              Precio mensual (USD)
            </Label>
            <Input
              id="custom-plan-monthly"
              value={value.customPlan?.monthlyPriceUsd ?? ""}
              disabled={!isEditable}
              onChange={(event) =>
                updateCustomPlan({ monthlyPriceUsd: event.target.value })
              }
              placeholder="900"
              className={FIELD_CLASSNAME}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="custom-plan-annual" className={LABEL_CLASSNAME}>
              Precio mensual equivalente anual (USD)
            </Label>
            <Input
              id="custom-plan-annual"
              value={value.customPlan?.annualMonthlyPriceUsd ?? ""}
              disabled={!isEditable}
              onChange={(event) =>
                updateCustomPlan({ annualMonthlyPriceUsd: event.target.value })
              }
              placeholder="720"
              className={FIELD_CLASSNAME}
            />
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="project-billing-interval" className={LABEL_CLASSNAME}>
            Facturación
          </Label>
          <select
            id="project-billing-interval"
            value={value.billingInterval}
            disabled={!isEditable}
            onChange={(event) =>
              update({ billingInterval: event.target.value as BackofficeBillingInterval })
            }
            className={cn(FIELD_CLASSNAME, "px-3", !isEditable && "opacity-60")}
          >
            {BILLING_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="project-billing-start" className={LABEL_CLASSNAME}>
            Inicio de facturación
          </Label>
          <DatePicker
            id="project-billing-start"
            value={billingStartDate}
            disabled={!isEditable}
            onChange={(date) => {
              if (!date) return
              update({ billingStartDate: formatDashboardInputDate(date) })
            }}
            className={cn(
              FIELD_CLASSNAME,
              "rounded-xl border-[#edeef0] px-3 text-sm focus-visible:border-[#ff7433]",
              !isEditable && "opacity-60",
            )}
          />
        </div>
      </div>

      {selectedCatalogPlan && isEditable ? (
        <p className="text-xs leading-4 text-[#777b84]">
          Precio seleccionado:{" "}
          <span className="font-medium text-[#363a3f]">
            {formatPlanPricePreview(selectedCatalogPlan, value.billingInterval)}
          </span>
        </p>
      ) : null}

      {mode === "edit" &&
      onCancelSubscription &&
      subscriptionStatus &&
      subscriptionStatus !== "cancelled" ? (
        <div className="border-t border-[#edeef0] pt-3">
          <button
            type="button"
            disabled={isCancelling}
            onClick={onCancelSubscription}
            className="text-sm font-medium leading-5 text-[#dc3e42] transition-colors hover:text-[#b91c1c] disabled:opacity-60"
          >
            {isCancelling ? "Cancelando subscripción..." : "Cancelar subscripción"}
          </button>
        </div>
      ) : null}
    </div>
  )
}
