"use client"

import Image from "next/image"
import { X } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

type LandingLeadSuccessContentProps = {
  onClose: () => void
  title?: string
  description?: string
}

export function LandingLeadSuccessContent({
  onClose,
  title = "¡Solicitud enviada con éxito!",
  description = "Recibimos tu solicitud correctamente. Nuestro equipo la revisará y se pondrá en contacto con vos a la brevedad para activar tu plan y ayudarte a comenzar con BuildOn.",
}: LandingLeadSuccessContentProps) {
  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-[21px] right-[33px] grid size-8 place-items-center rounded-full text-[#18191b] transition-colors hover:bg-[#edeef0]"
        aria-label="Cerrar"
      >
        <X className="size-4" strokeWidth={2} />
      </button>

      <div className="flex flex-col items-center">
        <div className="grid size-20 place-items-center rounded-full bg-[#ff7433]">
          <Image
            src="/landing/contract/success-celebration.svg"
            alt=""
            width={40}
            height={40}
            aria-hidden
            className="size-10"
          />
        </div>
      </div>

      <div className="flex w-full max-w-[440px] flex-col items-center">
        <DialogTitle className="text-center font-recoleta text-2xl font-normal leading-[1.05] text-[#18191b]">
          {title}
        </DialogTitle>
        <DialogDescription className="pt-2 text-center text-base leading-[1.4] text-[#18191b]">
          {description}
        </DialogDescription>
      </div>

      <div className="w-full max-w-[440px] rounded-[12px] bg-[rgba(255,246,241,0.8)] p-3">
        <p className="text-center text-sm leading-[1.4] text-[#272a2d]">
          Si no encontrás nuestro correo en tu bandeja de entrada, revisá las
          carpetas de Spam o Promociones.
        </p>
      </div>
    </>
  )
}

const SUCCESS_DIALOG_CLASSNAME =
  "h-[675px] max-h-[min(675px,calc(100dvh-48px))] w-full max-w-[960px] items-center justify-center gap-8 overflow-y-auto rounded-[4px] border border-[#e2e8f0] bg-white px-[33px] py-[41px] shadow-[0px_25px_50px_rgba(24,25,27,0.3),0_0_10px_rgba(243,103,31,0.08)]"

type LandingLeadSuccessModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LandingLeadSuccessModal({
  open,
  onOpenChange,
}: LandingLeadSuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-[#18191b]/60"
        className={SUCCESS_DIALOG_CLASSNAME}
      >
        <LandingLeadSuccessContent onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

export { SUCCESS_DIALOG_CLASSNAME }
