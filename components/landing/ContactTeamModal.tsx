"use client"

import { ArrowRight, X } from "lucide-react"
import { useState, type ReactNode } from "react"

import {
  ContactTeamModalDesktop,
  type ContactFormState,
} from "@/components/landing/ContactTeamModalDesktop"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import {
  PhoneDialSelect,
  PhoneInputShell,
  phoneNumberInputClassName,
} from "@/components/landing/PhoneDialSelect"
import {
  isValidEmail,
  sanitizeEmailInput,
} from "@/lib/landing/emailInput"
import {
  getPhoneDialOption,
  sanitizePhoneInput,
} from "@/lib/landing/phoneInput"
import {
  LandingLeadSuccessContent,
  SUCCESS_DIALOG_CLASSNAME,
} from "@/components/landing/LandingLeadSuccessModal"
import { submitLandingLead } from "@/lib/landing/submitLandingLead"
import { useIsDesktopViewport } from "@/lib/landing/useIsDesktopViewport"
import { cn } from "@/lib/utils"

type ContactTeamModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const INITIAL_FORM: ContactFormState = {
  firstName: "",
  lastName: "",
  company: "",
  email: "",
  phone: "",
  phoneDialCode: "ar",
  comments: "",
}

const fieldInputClassName =
  "h-[46px] rounded-[10px] border-[#edeef0] bg-white px-4 text-base leading-[1.4] text-[#18191b] shadow-none placeholder:text-[#777b84] focus-visible:border-[#ff7433] focus-visible:ring-0"

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

export function ContactTeamModal({ open, onOpenChange }: ContactTeamModalProps) {
  const toast = useToast()
  const isDesktop = useIsDesktopViewport()
  const [form, setForm] = useState<ContactFormState>(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const phoneDialOption = getPhoneDialOption(form.phoneDialCode)

  const updateField =
    (field: keyof ContactFormState) =>
    (value: string) => {
      setForm((current) => {
        if (field === "email") {
          return { ...current, email: sanitizeEmailInput(value) }
        }

        if (field === "phone") {
          return { ...current, phone: sanitizePhoneInput(value) }
        }

        return { ...current, [field]: value }
      })
    }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setForm(INITIAL_FORM)
      setIsSubmitting(false)
      setShowSuccess(false)
    }
    onOpenChange(nextOpen)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.company.trim() ||
      !form.email.trim()
    ) {
      toast.error("Completá los campos obligatorios.")
      return
    }

    if (!isValidEmail(form.email)) {
      toast.error("Ingresá un correo electrónico válido.")
      return
    }

    setIsSubmitting(true)

    const result = await submitLandingLead({
      kind: "contact",
      firstName: form.firstName,
      lastName: form.lastName,
      company: form.company,
      email: form.email,
      phone: form.phone,
      phoneDialCode: form.phoneDialCode,
      comments: form.comments,
    })

    setIsSubmitting(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    setForm(INITIAL_FORM)
    setShowSuccess(true)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        presentation={showSuccess || isDesktop ? "default" : "sheet"}
        overlayClassName="bg-[#18191b]/60"
        className={
          showSuccess
            ? SUCCESS_DIALOG_CLASSNAME
            : cn(
                "overflow-hidden border-0 bg-[#fefcfb] p-0 shadow-none",
                isDesktop
                  ? "flex max-h-[90vh] min-h-0 w-[calc(100%-48px)] max-w-[960px] flex-col overflow-hidden rounded-[4px] shadow-[0px_25px_50px_-12px_rgba(24,25,27,0.3)]"
                  : "flex-col",
              )
        }
      >
        {showSuccess ? (
          <LandingLeadSuccessContent
            onClose={() => handleOpenChange(false)}
            description="Recibimos tu solicitud correctamente. Nuestro equipo se pondrá en contacto con vos a la brevedad para coordinar un día y horario."
          />
        ) : (
          <>
        <DialogTitle className="sr-only">
          Agendar reunión con el equipo
        </DialogTitle>

        {isDesktop ? (
          <ContactTeamModalDesktop
            form={form}
            isSubmitting={isSubmitting}
            phoneDialOption={phoneDialOption}
            onClose={() => handleOpenChange(false)}
            onSubmit={handleSubmit}
            updateField={updateField}
          />
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <header className="px-4 py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-[320px]">
                  <h2 className="max-w-[240px] font-recoleta text-2xl leading-[1.05] text-[#111113]">
                    Agendar reunión con el equipo
                  </h2>
                  <p className="pt-2 text-sm leading-[1.4] text-[#111113]">
                    Dejanos tus datos y nos pondremos en contacto para coordinar
                    una reunión de 30-min.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-2xl text-[#111113]"
                  aria-label="Cerrar"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              </div>
            </header>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-6 bg-white px-6 pb-11 pt-7"
            >
              <div className="flex flex-col gap-4">
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

                <FormField label="Empresa" required htmlFor="contact-company">
                  <Input
                    id="contact-company"
                    value={form.company}
                    onChange={(event) =>
                      updateField("company")(event.target.value)
                    }
                    placeholder="Constructora XYZ S.A."
                    className={fieldInputClassName}
                  />
                </FormField>

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
                    onChange={(event) =>
                      updateField("email")(event.target.value)
                    }
                    placeholder="juan@empresa.com"
                    className={fieldInputClassName}
                  />
                </FormField>

                <FormField label="Teléfono" htmlFor="contact-phone">
                  <PhoneInputShell>
                    <PhoneDialSelect
                      value={form.phoneDialCode}
                      onValueChange={(value) =>
                        updateField("phoneDialCode")(value)
                      }
                    />
                    <Input
                      id="contact-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(event) =>
                        updateField("phone")(event.target.value)
                      }
                      placeholder={phoneDialOption.placeholder}
                      className={phoneNumberInputClassName}
                    />
                  </PhoneInputShell>
                </FormField>

                <FormField label="Comentarios" htmlFor="contact-comments">
                  <textarea
                    id="contact-comments"
                    value={form.comments}
                    onChange={(event) =>
                      updateField("comments")(event.target.value)
                    }
                    placeholder='Ej.: "No estoy seguro de si BuildOn me va a servir para gestionar el tipo de obra que tengo."'
                    className="min-h-[120px] w-full resize-none rounded-[10px] border border-[#edeef0] bg-white px-4 py-3 text-base leading-[1.4] text-[#18191b] shadow-none placeholder:text-[#777b84] focus-visible:border-[#ff7433] focus-visible:outline-none focus-visible:ring-0"
                  />
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
        )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
