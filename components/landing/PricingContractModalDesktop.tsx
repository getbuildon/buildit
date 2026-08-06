"use client"

import Image from "next/image"
import { ArrowRight, X } from "lucide-react"
import type { FormEvent, ReactNode } from "react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PhoneDialSelect,
  PhoneInputShell,
  phoneNumberInputClassName,
} from "@/components/landing/PhoneDialSelect"
import type { ContractCountryCode } from "@/lib/landing/contractLocations"
import type { PhoneDialOption } from "@/lib/landing/phoneInput"
import type { BillingPeriod, PricingPlan } from "@/lib/landing/pricingPlans"
import {
  formatPlanPrice,
  getPlanPriceBreakdown,
  getPlanSurfaceLabel,
} from "@/lib/landing/pricingPlans"
import { cn } from "@/lib/utils"

const DESKTOP_TEAM_FEATURE_ICONS = [
  "/landing/contract/desktop/feature-admin.svg",
  "/landing/contract/desktop/feature-supervisor.svg",
  "/landing/contract/desktop/feature-operator.svg",
] as const

const DESKTOP_OTHER_FEATURE_ICONS = {
  clients: "/landing/contract/desktop/feature-clients.svg",
  support: "/landing/contract/desktop/feature-support.svg",
  dashboard: "/landing/contract/desktop/feature-dashboard.svg",
} as const

function DesktopFeatureIcon({
  src,
  size = 14,
}: {
  src: string
  size?: 14 | 16
}) {
  const className = size === 16 ? "size-4" : "size-3.5"

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      aria-hidden
      className={className}
    />
  )
}

function PlanFeatureListDesktop({ plan }: { plan: PricingPlan }) {
  return (
    <ul className="flex flex-col gap-2 border-t border-white/10 pt-4">
      {plan.teamFeatures.map((feature, index) => (
        <li key={feature} className="flex items-center gap-2">
          <div className="grid size-6 shrink-0 place-items-center rounded-[8px] bg-white/10">
            <DesktopFeatureIcon
              src={
                DESKTOP_TEAM_FEATURE_ICONS[index] ??
                DESKTOP_TEAM_FEATURE_ICONS[0]
              }
            />
          </div>
          <span className="text-xs leading-[1.4] tracking-[-0.36px] text-[#afb3ba]">
            {feature}
          </span>
        </li>
      ))}

      {plan.otherFeatures.map((feature) => {
        const lower = feature.toLowerCase()
        const isDashboard = lower.includes("dashboard")
        const iconSrc = lower.includes("cliente")
          ? DESKTOP_OTHER_FEATURE_ICONS.clients
          : lower.includes("soporte")
            ? DESKTOP_OTHER_FEATURE_ICONS.support
            : DESKTOP_OTHER_FEATURE_ICONS.dashboard

        return (
          <li
            key={feature}
            className={cn(
              "flex gap-2",
              isDashboard ? "items-start" : "items-center",
            )}
          >
            <div className="grid size-6 shrink-0 place-items-center rounded-[8px] bg-white/10">
              <DesktopFeatureIcon src={iconSrc} size={isDashboard ? 16 : 14} />
            </div>
            <span className="text-xs leading-[1.4] tracking-[-0.36px] text-[#afb3ba]">
              {feature}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

const fieldInputClassName =
  "h-[45px] rounded-[10px] border-[#edeef0] bg-white px-4 text-base leading-[1.4] text-[#18191b] shadow-none placeholder:text-[#777b84] focus-visible:border-[#ff7433] focus-visible:ring-0"

const fieldSelectTriggerClassName =
  "h-[45px] rounded-[10px] border-[#edeef0] bg-white px-4 text-base leading-[1.4] text-[#18191b] shadow-none focus:border-[#ff7433] focus:ring-0 data-[placeholder]:text-[#777b84] [&_svg]:size-3.5 [&_svg]:text-[#777b84]"

export type ContractFormState = {
  firstName: string
  lastName: string
  company: string
  email: string
  phone: string
  phoneDialCode: ContractCountryCode
  country: string
  province: string
}

function FormField({
  label,
  required = false,
  optional = false,
  htmlFor,
  className,
  children,
}: {
  label: string
  required?: boolean
  optional?: boolean
  htmlFor?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-[3px] text-xs leading-[1.4] tracking-[-0.36px] text-[#272a2d]"
      >
        {label}
        {required ? <span className="text-primary">*</span> : null}
        {optional ? (
          <span className="text-[#777b84]">(opcional)</span>
        ) : null}
      </label>
      {children}
    </div>
  )
}

function ContractPlanPrice({
  billing,
  breakdown,
}: {
  billing: BillingPeriod
  breakdown: ReturnType<typeof getPlanPriceBreakdown>
}) {
  if (breakdown.isQuote) {
    return (
      <p className="font-recoleta text-2xl leading-[1.05] text-[#fefcfb]">
        A cotizar
      </p>
    )
  }

  if (billing === "annual" && breakdown.annualMonthlyPrice != null) {
    const annualTotal = breakdown.annualMonthlyPrice * 12

    return (
      <div className="flex flex-wrap items-end gap-1 py-3">
        <p className="font-recoleta text-2xl leading-[1.05] text-[#fefcfb]">
          {formatPlanPrice(annualTotal)}
        </p>
        <p className="text-xs leading-[1.4] tracking-[-0.36px] text-[#afb3ba]">
          usd/año
        </p>
        <p className="text-xs leading-[1.4] tracking-[-0.36px] text-[#afb3ba]">
          ({formatPlanPrice(breakdown.annualMonthlyPrice)} usd/mes)
        </p>
      </div>
    )
  }

  const monthly =
    breakdown.monthlyPrice ?? breakdown.annualMonthlyPrice ?? null

  if (monthly == null) return null

  return (
    <div className="flex items-end gap-1 py-3">
      <p className="font-recoleta text-2xl leading-[1.05] text-[#fefcfb]">
        {formatPlanPrice(monthly)}
      </p>
      <p className="text-xs leading-[1.4] tracking-[-0.36px] text-[#afb3ba]">
        usd/mes
      </p>
    </div>
  )
}

type PricingContractModalDesktopProps = {
  plan: PricingPlan
  billing: BillingPeriod
  surfaceTierId?: string
  form: ContractFormState
  isSubmitting: boolean
  provinceOptions: { value: string; label: string }[]
  countries: { value: string; label: string }[]
  phoneDialOption: PhoneDialOption
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  updateField: (field: keyof ContractFormState) => (value: string) => void
}

export function PricingContractModalDesktop({
  plan,
  billing,
  surfaceTierId,
  form,
  isSubmitting,
  provinceOptions,
  countries,
  phoneDialOption,
  onClose,
  onSubmit,
  updateField,
}: PricingContractModalDesktopProps) {
  const priceBreakdown = getPlanPriceBreakdown(plan, surfaceTierId)
  const surfaceLabel = getPlanSurfaceLabel(plan, surfaceTierId)

  return (
    <div className="grid max-h-[90vh] min-h-0 w-full grid-cols-[340px_minmax(0,1fr)] items-stretch overflow-hidden">
      <aside className="min-h-0 overflow-y-auto bg-[#18191b] p-10">
        <div className="grid size-10 place-items-center rounded-[14px] bg-[rgba(255,116,51,0.2)]">
          <Image
            src="/landing/contract/desktop/modal-celebration.svg"
            alt=""
            width={20}
            height={20}
            aria-hidden
            className="size-5"
          />
        </div>

        <h2 className="pt-4 font-recoleta text-2xl leading-[1.05] text-[#fefcfb]">
          Estás a un paso de empezar con BuildOn.
        </h2>
        <p className="pt-3 max-w-[260px] text-sm leading-[1.4] text-[#afb3ba]">
          Dejanos tus datos y nuestro equipo te contactará para dar de alta tu
          cuenta y ayudarte a arrancar.
        </p>

        <div className="mt-8 rounded-[4px] border border-white/10 bg-[#212225] p-5">
          <p className="py-1 text-[10px] leading-[1.4] tracking-[-0.5px] text-[#afb3ba]">
            PLAN SELECCIONADO
          </p>
          <p className="pt-1 font-recoleta text-[22px] leading-[33px] text-[#fefcfb]">
            {plan.name}
          </p>
          <p className="text-xs leading-[1.4] tracking-[-0.36px] text-[#afb3ba]">
            {surfaceLabel}
          </p>

          <ContractPlanPrice billing={billing} breakdown={priceBreakdown} />

          <PlanFeatureListDesktop plan={plan} />
        </div>
      </aside>

      <div className="flex min-h-0 flex-col overflow-hidden bg-[#fefcfb]">
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-[#eef0f2] bg-[#fefcfb] px-8 py-5">
          <p className="text-base leading-[1.4] text-[#18191b]">
            Completá tus datos
          </p>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-[#18191b] transition-colors hover:bg-[#edeef0]"
            aria-label="Cerrar"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#fefcfb] px-8 py-7"
        >
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Nombre" required htmlFor="contract-first-name">
                <Input
                  id="contract-first-name"
                  value={form.firstName}
                  onChange={(event) =>
                    updateField("firstName")(event.target.value)
                  }
                  placeholder="Juan"
                  className={fieldInputClassName}
                />
              </FormField>

              <FormField label="Apellido" required htmlFor="contract-last-name">
                <Input
                  id="contract-last-name"
                  value={form.lastName}
                  onChange={(event) =>
                    updateField("lastName")(event.target.value)
                  }
                  placeholder="García"
                  className={fieldInputClassName}
                />
              </FormField>
            </div>

            <FormField label="Empresa" required htmlFor="contract-company">
              <Input
                id="contract-company"
                value={form.company}
                onChange={(event) => updateField("company")(event.target.value)}
                placeholder="Constructora XYZ S.A."
                className={fieldInputClassName}
              />
            </FormField>

            <FormField
              label="Correo electrónico"
              required
              htmlFor="contract-email"
            >
              <Input
                id="contract-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => updateField("email")(event.target.value)}
                placeholder="juan@empresa.com"
                className={fieldInputClassName}
              />
            </FormField>

            <FormField label="Teléfono" optional htmlFor="contract-phone">
              <PhoneInputShell>
                <PhoneDialSelect
                  value={form.phoneDialCode}
                  onValueChange={(value) => updateField("phoneDialCode")(value)}
                />
                <Input
                  id="contract-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) => updateField("phone")(event.target.value)}
                  placeholder={phoneDialOption.placeholder}
                  className={phoneNumberInputClassName}
                />
              </PhoneInputShell>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="País" required>
                <Select
                  value={form.country || undefined}
                  onValueChange={updateField("country")}
                >
                  <SelectTrigger className={fieldSelectTriggerClassName}>
                    <SelectValue placeholder="Seleccionar país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Provincia" required>
                <Select
                  value={form.province || undefined}
                  onValueChange={updateField("province")}
                  disabled={!form.country}
                >
                  <SelectTrigger className={fieldSelectTriggerClassName}>
                    <SelectValue placeholder="Seleccionar provincia" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinceOptions.map((province) => (
                      <SelectItem key={province.value} value={province.value}>
                        {province.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-3.5 text-base font-medium leading-[1.4] text-white",
                isSubmitting && "opacity-70",
              )}
            >
              Enviar solicitud
              <ArrowRight className="size-4" strokeWidth={2} />
            </button>

            <p className="text-center text-xs leading-[1.4] tracking-[-0.36px] text-[#696e77]">
              Al enviar aceptás que el equipo de BuildOn te contacte para dar de
              alta tu cuenta.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
