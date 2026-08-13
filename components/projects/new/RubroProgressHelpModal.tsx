"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type RubroProgressHelpModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RubroProgressHelpModal({
  open,
  onOpenChange,
}: RubroProgressHelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "w-[550px] max-w-[min(550px,calc(100vw-48px))] gap-0 rounded-[16px] border bg-white px-[33px] py-[41px]",
          "shadow-[0_0_5px_rgba(243,103,31,0.08)]",
        )}
        style={{ borderColor: "#e2e8f0" }}
      >
        <div className="flex w-full flex-col gap-1">
          <DialogTitle className="text-left font-recoleta text-[24px] font-normal leading-[1.05] text-[#18191b]">
            Cómo se calcula el avance de la obra
          </DialogTitle>

          <DialogDescription asChild>
            <div className="flex flex-col gap-4 pt-2 text-[16px] leading-[1.4] text-[#18191b]">
              <p>
                Cada rubro aporta un porcentaje al avance general de la obra. Por defecto,
                los tres rubros de estructura representan el 30% del avance total, ya que
                suelen concentrar la mayor parte del progreso en una obra tradicional. El
                resto del porcentaje se distribuye automáticamente entre los demás rubros.
              </p>
              <p>Podés modificar estos valores si tu proyecto requiere una distribución diferente.</p>
            </div>
          </DialogDescription>
        </div>
      </DialogContent>
    </Dialog>
  )
}
