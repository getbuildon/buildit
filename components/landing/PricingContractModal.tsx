"use client"

import Image from "next/image"
import { ArrowRight, X } from "lucide-react"
import { useState, type ReactNode } from "react"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import {
  getPlanFeaturePills,
  getPlanSurfaceSummary,
  PLAN_FEATURE_PILL_ICONS,
} from "@/lib/landing/planFeaturePills"
import {
  CONTRACT_COUNTRIES,
  getContractProvincesForCountry,
  type ContractCountryCode,
} from "@/lib/landing/contractLocations"
import {
  isValidEmail,
  sanitizeEmailInput,
} from "@/lib/landing/emailInput"
import {
  getPhoneDialOption,
  PHONE_DIAL_OPTIONS,
  sanitizePhoneInput,
} from "@/lib/landing/phoneInput"
import type { BillingPeriod, PricingPlan } from "@/lib/landing/pricingPlans"
import { getPlanDisplayPrice } from "@/lib/landing/pricingPlans"
import { cn } from "@/lib/utils"

type PricingContractModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: PricingPlan | null
  billing: BillingPeriod
  surfaceTierId?: string
}

type ContractFormState = {
  firstName: string
  lastName: string
  company: string
  email: string
  phone: string
  phoneDialCode: ContractCountryCode
  country: string
  province: string
}

const INITIAL_FORM: ContractFormState = {
  firstName: "",
  lastName: "",
  company: "",
  email: "",
  phone: "",
  phoneDialCode: "ar",
  country: "",
  province: "",
}

const fieldInputClassName =
  "h-[46px] rounded-[10px] border-[#edeef0] bg-white px-4 text-base leading-[1.4] text-[#18191b] shadow-none placeholder:text-[#777b84] focus-visible:border-[#ff7433] focus-visible:ring-0"

const fieldSelectTriggerClassName =
  "h-[46px] rounded-[10px] border-[#edeef0] bg-white px-4 text-base leading-[1.4] text-[#18191b] shadow-none focus:border-[#ff7433] focus:ring-0 data-[placeholder]:text-[#777b84] [&_svg]:size-3 [&_svg]:text-[#777b84]"

function PlanFeaturePills({ plan }: { plan: PricingPlan }) {
  const pills = getPlanFeaturePills(plan)

  return (
    <div className="flex flex-wrap content-start items-start gap-[6px]">
      {pills.map((pill) => (
        <span
          key={pill.label}
          className="inline-flex shrink-0 items-center gap-[6px] rounded-[8px] border border-white/[0.08] bg-white/[0.06] px-[10px] py-[6px]"
        >
          <Image
            src={PLAN_FEATURE_PILL_ICONS[pill.icon]}
            alt=""
            width={12}
            height={12}
            aria-hidden
            className="size-3 shrink-0"
          />
          <span className="whitespace-nowrap text-xs leading-[1.4] tracking-[-0.36px] text-[#afb3ba]">
            {pill.label}
          </span>
        </span>
      ))}
    </div>
  )
}

function FormField({
  label,
  required = false,
  htmlFor,
  children,
}: {
  label: string
  required?: boolean
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-[3px] text-xs leading-[1.4] tracking-[-0.36px] text-[#272a2d]"
      >
        {label}
        {required ? <span className="text-primary">*</span> : null}
      </label>
      {children}
    </div>
  )
}

export function PricingContractModal({
  open,
  onOpenChange,
  plan,
  billing,
  surfaceTierId,
}: PricingContractModalProps) {
  const toast = useToast()
  const [form, setForm] = useState<ContractFormState>(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!plan) return null

  const price = getPlanDisplayPrice(plan, billing, surfaceTierId)
  const isQuote = Boolean(plan.priceLabel)
  const surfaceSummary = getPlanSurfaceSummary(plan, surfaceTierId)
  const phoneDialOption = getPhoneDialOption(form.phoneDialCode)
  const provinceOptions = form.country
    ? getContractProvincesForCountry(form.country as ContractCountryCode)
    : []

  const updateField =
    (field: keyof ContractFormState) =>
    (value: string) => {
      setForm((current) => {
        if (field === "country") {
          return { ...current, country: value, province: "" }
        }
        return { ...current, [field]: value }
      })
    }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setForm(INITIAL_FORM)
      setIsSubmitting(false)
    }
    onOpenChange(nextOpen)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.company.trim() ||
      !form.email.trim() ||
      !form.country ||
      !form.province
    ) {
      toast.error("Completá los campos obligatorios.")
      return
    }

    if (!isValidEmail(form.email)) {
      toast.error("Ingresá un correo electrónico válido.")
      return
    }

    setIsSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 600))

    toast.success("Solicitud enviada. Te contactaremos pronto.")
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-[#18191b]/60"
        className="fixed inset-0 top-0 left-0 flex h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-0 bg-[#fefcfb] p-0 shadow-none"
      >
        <DialogTitle className="sr-only">
          Solicitar contratación de {plan.name}
        </DialogTitle>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <section className="bg-[#18191b] px-4 py-6">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-[260px]">
                <h2 className="font-recoleta text-2xl leading-[1.05] text-[#fefcfb]">
                  Estás a un paso de empezar con BuildOn.
                </h2>
                <p className="pt-3 text-sm leading-[1.4] text-[#afb3ba]">
                  Dejanos tus datos y nuestro equipo te contactará para dar de
                  alta tu cuenta y ayudarte a arrancar.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#fefcfb]"
                aria-label="Cerrar"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>

            <div className="mt-5 flex items-end justify-between gap-2">
              <div>
                <p className="text-base font-medium leading-[1.4] text-[#fefcfb]">
                  {plan.name}
                </p>
                <p className="text-xs leading-[1.4] tracking-[-0.36px] text-[#afb3ba]">
                  {surfaceSummary}
                </p>
              </div>

              <div className="flex shrink-0 items-baseline gap-0.5 whitespace-nowrap">
                <p className="font-recoleta text-2xl leading-[1.05] text-[#fefcfb]">
                  {price}
                </p>
                {!isQuote ? (
                  <p className="text-xs leading-[1.4] tracking-[-0.36px] text-[#afb3ba]">
                    usd/mes
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-5">
              <PlanFeaturePills plan={plan} />
            </div>
          </section>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 bg-white px-6 pb-11 pt-7"
          >
            <p className="text-base font-medium leading-[1.4] text-[#18191b]">
              Completá tus datos
            </p>

            <div className="flex flex-col gap-4">
              <FormField label="Nombre" required htmlFor="contract-first-name">
                <Input
                  id="contract-first-name"
                  value={form.firstName}
                  onChange={(event) => updateField("firstName")(event.target.value)}
                  placeholder="Juan"
                  className={fieldInputClassName}
                />
              </FormField>

              <FormField label="Apellido" required htmlFor="contract-last-name">
                <Input
                  id="contract-last-name"
                  value={form.lastName}
                  onChange={(event) => updateField("lastName")(event.target.value)}
                  placeholder="García"
                  className={fieldInputClassName}
                />
              </FormField>

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
                  onChange={(event) =>
                    updateField("email")(
                      sanitizeEmailInput(event.target.value),
                    )
                  }
                  placeholder="juan@empresa.com"
                  className={fieldInputClassName}
                />
              </FormField>

              <FormField label="Teléfono" htmlFor="contract-phone">
                <div className="flex h-[46px] w-full items-center gap-2 rounded-[10px] border border-[#edeef0] bg-white px-4">
                  <Select
                    value={form.phoneDialCode}
                    onValueChange={(value) =>
                      updateField("phoneDialCode")(value)
                    }
                  >
                    <SelectTrigger
                      aria-label="Código de país telefónico"
                      className="h-auto w-auto shrink-0 gap-1 rounded-none border-0 border-r border-[#dee5ed] bg-transparent p-0 pr-2 shadow-none focus:ring-0 [&>svg]:size-2 [&>svg]:text-[#777b84]"
                    >
                      <SelectValue>
                        <span aria-hidden className="text-base leading-none">
                          {phoneDialOption.flag}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start">
                      {PHONE_DIAL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center gap-2">
                            <span aria-hidden>{option.flag}</span>
                            <span>{option.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="contract-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(event) =>
                      updateField("phone")(
                        sanitizePhoneInput(event.target.value),
                      )
                    }
                    placeholder={phoneDialOption.placeholder}
                    className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 text-base leading-[1.4] text-[#18191b] shadow-none placeholder:text-[#777b84] focus-visible:border-0 focus-visible:ring-0"
                  />
                </div>
              </FormField>

              <FormField label="País" required>
                <Select
                  value={form.country || undefined}
                  onValueChange={updateField("country")}
                >
                  <SelectTrigger className={fieldSelectTriggerClassName}>
                    <SelectValue placeholder="Seleccionar país" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_COUNTRIES.map((country) => (
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

            <div className="flex flex-col gap-3">
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
                Al enviar aceptás que el equipo de BuildOn te contacte para dar
                de alta tu cuenta.
              </p>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
