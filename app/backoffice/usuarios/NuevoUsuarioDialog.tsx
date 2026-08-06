"use client"

import { useEffect, useState, useTransition } from "react"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

import { createBackofficeUser } from "@/app/backoffice/usuarios/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

type NuevoUsuarioDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FIELD_CLASSNAME =
  "h-[42px] rounded-xl border-[#edeef0] bg-white text-sm leading-[1.4] text-[#18191b] placeholder:text-[#696e77] shadow-none focus-visible:border-[#ff7433] focus-visible:ring-0"

const LABEL_CLASSNAME = "text-xs font-medium leading-[1.4] text-[#5a6169]"

function emptyFormState() {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  }
}

export function NuevoUsuarioDialog({
  open,
  onOpenChange,
}: NuevoUsuarioDialogProps) {
  const router = useRouter()
  const [form, setForm] = useState(emptyFormState)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) {
      setForm(emptyFormState())
      setFormError(null)
      setSuccessMessage(null)
    }
  }, [open])

  const updateField = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
    if (formError) setFormError(null)
    if (successMessage) setSuccessMessage(null)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setSuccessMessage(null)

    if (!form.firstName.trim()) {
      setFormError("El nombre es requerido.")
      return
    }

    if (!form.email.trim()) {
      setFormError("El correo electrónico es requerido.")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFormError("Ingresá un correo electrónico válido.")
      return
    }

    startTransition(async () => {
      const result = await createBackofficeUser({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
      })

      if (!result.ok) {
        setFormError(result.error)
        return
      }

      setSuccessMessage(
        `Enviamos un correo a ${form.email.trim()} para que complete el registro y cree su contraseña.`,
      )
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] gap-0 p-0">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="border-b border-[#f4f5f6] px-6 py-5">
            <DialogHeader className="gap-1.5">
              <DialogTitle className="font-recoleta text-[22px] font-normal leading-[1.2] text-[#272a2d]">
                Nuevo usuario
              </DialogTitle>
              <DialogDescription className="text-sm leading-[1.4] text-[#777b84]">
                Completá los datos y le enviaremos un correo con un enlace para
                confirmar el registro y crear su contraseña.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex flex-col gap-4 px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-user-first-name" className={LABEL_CLASSNAME}>
                  Nombre
                </Label>
                <Input
                  id="new-user-first-name"
                  value={form.firstName}
                  onChange={(event) => updateField("firstName", event.target.value)}
                  placeholder="Nombre"
                  className={FIELD_CLASSNAME}
                  autoComplete="given-name"
                  disabled={Boolean(successMessage)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-user-last-name" className={LABEL_CLASSNAME}>
                  Apellido
                </Label>
                <Input
                  id="new-user-last-name"
                  value={form.lastName}
                  onChange={(event) => updateField("lastName", event.target.value)}
                  placeholder="Apellido"
                  className={FIELD_CLASSNAME}
                  autoComplete="family-name"
                  disabled={Boolean(successMessage)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-user-email" className={LABEL_CLASSNAME}>
                Mail
              </Label>
              <Input
                id="new-user-email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="correo@ejemplo.com"
                className={FIELD_CLASSNAME}
                autoComplete="email"
                disabled={Boolean(successMessage)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-user-phone" className={LABEL_CLASSNAME}>
                Teléfono
              </Label>
              <Input
                id="new-user-phone"
                type="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+54 11 1234 5678"
                className={FIELD_CLASSNAME}
                autoComplete="tel"
                disabled={Boolean(successMessage)}
              />
            </div>

            {formError ? (
              <p className="text-sm leading-[1.4] text-[#dc3e42]">{formError}</p>
            ) : null}

            {successMessage ? (
              <p className="rounded-xl border border-[#acdec8] bg-[#f4fbf7] px-3 py-3 text-sm leading-[1.4] text-[#208368]">
                {successMessage}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[#f4f5f6] px-6 py-4">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-[10px] border-[#edeef0] bg-white px-4 text-sm font-medium text-[#43484e] shadow-none hover:bg-[#f4f5f6]"
            >
              {successMessage ? "Cerrar" : "Cancelar"}
            </Button>
            {!successMessage ? (
              <Button
                type="submit"
                variant="brand"
                size="brand"
                disabled={isPending}
                className="px-4 text-sm font-medium"
              >
                {isPending ? <Spinner className="size-4" /> : <Plus className="size-4" />}
                {isPending ? "Enviando..." : "Crear usuario"}
              </Button>
            ) : null}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function NuevoUsuarioButton({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button
      type="button"
      variant="brand"
      size="brand"
      disabled={disabled}
      onClick={onClick}
      className="shrink-0 px-4 text-sm font-medium"
    >
      <Plus className="size-4" strokeWidth={1.75} />
      Nuevo usuario
    </Button>
  )
}
