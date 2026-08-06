"use client"

import { ArrowRight, X } from "lucide-react"
import type { FormEvent, ReactNode } from "react"

import { Input } from "@/components/ui/input"
import {
  PhoneDialSelect,
  PhoneInputShell,
  phoneNumberInputClassName,
} from "@/components/landing/PhoneDialSelect"
import type { PhoneDialCode, PhoneDialOption } from "@/lib/landing/phoneInput"
import { cn } from "@/lib/utils"

const fieldInputClassName =
  "h-[45px] rounded-[10px] border-[#edeef0] bg-white px-4 text-base leading-[1.4] text-[#18191b] shadow-none placeholder:text-[#777b84] focus-visible:border-[#ff7433] focus-visible:ring-0"

export type ContactFormState = {
  firstName: string
  lastName: string
  company: string
  email: string
  phone: string
  phoneDialCode: PhoneDialCode
  comments: string
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

type ContactTeamModalDesktopProps = {
  form: ContactFormState
  isSubmitting: boolean
  phoneDialOption: PhoneDialOption
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  updateField: (field: keyof ContactFormState) => (value: string) => void
}

export function ContactTeamModalDesktop({
  form,
  isSubmitting,
  phoneDialOption,
  onClose,
  onSubmit,
  updateField,
}: ContactTeamModalDesktopProps) {
  return (
    <div className="flex w-full flex-col bg-[#fefcfb]">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#eef0f2] px-8 pb-5 pt-8">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h2 className="font-recoleta text-2xl leading-[1.05] text-[#111113]">
            Agendar reunión con el equipo
          </h2>
          <p className="text-base leading-[1.4] text-[#111113]">
            Dejanos tus datos y nos pondremos en contacto para coordinar una
            reunión de 30-min.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="grid size-8 shrink-0 place-items-center rounded-2xl text-[#111113] transition-colors hover:bg-[#edeef0]"
          aria-label="Cerrar"
        >
          <X className="size-4" strokeWidth={2} />
        </button>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col px-8 py-7">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nombre" required htmlFor="contact-first-name">
              <Input
                id="contact-first-name"
                value={form.firstName}
                onChange={(event) =>
                  updateField("firstName")(event.target.value)
                }
                placeholder="Juan"
                className={fieldInputClassName}
              />
            </FormField>

            <FormField label="Apellido" required htmlFor="contact-last-name">
              <Input
                id="contact-last-name"
                value={form.lastName}
                onChange={(event) =>
                  updateField("lastName")(event.target.value)
                }
                placeholder="García"
                className={fieldInputClassName}
              />
            </FormField>
          </div>

          <FormField label="Empresa" required htmlFor="contact-company">
            <Input
              id="contact-company"
              value={form.company}
              onChange={(event) => updateField("company")(event.target.value)}
              placeholder="Constructora XYZ S.A."
              className={fieldInputClassName}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-5">
            <FormField
              label="Correo electrónico"
              required
              htmlFor="contact-email"
            >
              <Input
                id="contact-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => updateField("email")(event.target.value)}
                placeholder="juan@empresa.com"
                className={fieldInputClassName}
              />
            </FormField>

            <FormField label="Teléfono" optional htmlFor="contact-phone">
              <PhoneInputShell>
                <PhoneDialSelect
                  value={form.phoneDialCode}
                  onValueChange={(value) => updateField("phoneDialCode")(value)}
                />
                <Input
                  id="contact-phone"
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
          </div>

          <FormField label="Comentarios" htmlFor="contact-comments">
            <textarea
              id="contact-comments"
              value={form.comments}
              onChange={(event) => updateField("comments")(event.target.value)}
              placeholder='Ej.: "No estoy seguro de si BuildOn me va a servir para gestionar el tipo de obra que tengo."'
              className="min-h-[120px] w-full resize-none rounded-[10px] border border-[#edeef0] bg-white px-4 py-3 text-base leading-[1.4] text-[#18191b] shadow-none placeholder:text-[#777b84] focus-visible:border-[#ff7433] focus-visible:outline-none focus-visible:ring-0"
            />
          </FormField>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-3.5 text-base font-medium leading-[1.4] text-white",
              isSubmitting && "opacity-70",
            )}
          >
            Enviar solicitud
            <ArrowRight className="size-4" strokeWidth={2} />
          </button>
        </div>
      </form>
    </div>
  )
}
