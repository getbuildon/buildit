"use client"

import { useEffect, useState } from "react"
import { Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/components/ui/toast"
import { submitPlanUpgradeRequest } from "@/app/[projectId]/equipo/actions"
import type { ProjectUserType } from "@/lib/projects/createProjectDraft"
import { FORM_MODAL_DIALOG } from "@/lib/project/designTokens"
import { cn } from "@/lib/utils"

type RequestPlanUpgradeModalProps = {
  projectId: string | null
  userType?: ProjectUserType | null
  surfaceLimit?: {
    planSurfaceMaxM2: number
    unitsSurfaceM2: number
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RequestPlanUpgradeModal({
  projectId,
  userType = null,
  surfaceLimit = null,
  open,
  onOpenChange,
}: RequestPlanUpgradeModalProps) {
  const toast = useToast()
  const [comments, setComments] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setComments("")
    setError("")
    setIsSubmitting(false)
  }, [open, userType, surfaceLimit])

  const handleSubmit = async () => {
    if (isSubmitting) return

    if (!projectId) {
      setError("Guardá el borrador del proyecto para poder solicitar la mejora del plan.")
      return
    }

    if (surfaceLimit) {
      setIsSubmitting(true)
      setError("")

      const result = await submitPlanUpgradeRequest(projectId, {
        kind: "surface",
        planSurfaceMaxM2: surfaceLimit.planSurfaceMaxM2,
        unitsSurfaceM2: surfaceLimit.unitsSurfaceM2,
        comments: comments.trim() || undefined,
      })

      setIsSubmitting(false)

      if (!result.ok) {
        setError(result.error)
        return
      }

      toast.success("Solicitud enviada al administrador de la organización.")
      onOpenChange(false)
      return
    }

    if (!userType) return

    setIsSubmitting(true)
    setError("")

    const result = await submitPlanUpgradeRequest(projectId, {
      kind: "userType",
      userType,
      comments: comments.trim() || undefined,
    })

    setIsSubmitting(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    toast.success("Solicitud enviada al administrador de la organización.")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName={FORM_MODAL_DIALOG.overlay}
        className={cn(
          FORM_MODAL_DIALOG.content,
          "max-w-[calc(100vw-32px)] gap-8 rounded-[16px] border border-[#e2e8f0] px-[33px] py-[41px] shadow-[0_0_5px_rgba(243,103,31,0.08)] sm:max-w-[448px]",
        )}
        showCloseButton={false}
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center gap-8">
            <div
              className="flex size-20 items-center justify-center rounded-full bg-[#ffeae0]"
              aria-hidden
            >
              <Send className="size-10 text-[#ff7433]" strokeWidth={1.5} />
            </div>

            <div className="flex w-full flex-col items-center gap-3 text-center">
              <DialogTitle className="font-recoleta text-[24px] font-normal leading-[1.05] text-[#18191b]">
                Solicitar mejora de plan
              </DialogTitle>
              <DialogDescription className="max-w-[382px] text-[16px] font-normal leading-[1.4] text-[#18191b]">
                Vas a enviar una solicitud para mejorar el plan al administrador
                de la organización.
              </DialogDescription>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <textarea
              value={comments}
              onChange={(event) => {
                setComments(event.target.value)
                if (error) setError("")
              }}
              placeholder="Agregar comentarios..."
              rows={3}
              className="min-h-[68px] w-full resize-none rounded-[8px] border border-[#afb3ba] bg-white px-4 py-2 text-[14px] font-normal leading-[1.4] text-[#18191b] placeholder:text-[#777b84] focus-visible:border-[#ff7433] focus-visible:outline-none"
            />
            {error ? (
              <p className="text-[13px] leading-5 text-[#dc2626]">{error}</p>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1 rounded-[10px] border border-[#696e77] px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#363a3f] disabled:opacity-50"
            >
              Cancelar
            </button>
            <Button
              type="button"
              variant="brand"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting || (!userType && !surfaceLimit)}
              className="h-auto flex-1 px-4 py-3 text-[14px] font-normal leading-[1.4] shadow-[0_0_10px_rgba(243,103,31,0.3)]"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="size-4" />
                  Enviando...
                </>
              ) : (
                "Enviar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
