"use client"

import Image from "next/image"
import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CREATE_PROJECT_COLORS,
  CREATE_PROJECT_TYPE,
} from "@/lib/projects/createProjectTokens"
import { cn } from "@/lib/utils"

type CreateProjectDraftSavedModalProps = {
  open: boolean
}

export function CreateProjectDraftSavedModal({ open }: CreateProjectDraftSavedModalProps) {
  const router = useRouter()

  const goToDashboard = useCallback(() => {
    router.push("/home")
    router.refresh()
  }, [router])

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "max-w-[448px] gap-8 rounded-[16px] border bg-white px-[33px] py-[41px]",
          "shadow-[0_0_5px_rgba(243,103,31,0.08)]",
        )}
        style={{ borderColor: "#e2e8f0" }}
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <div className="flex flex-col items-center gap-8">
          <div
            className="flex size-20 items-center justify-center rounded-full"
            style={{ backgroundColor: "#ffeae0" }}
            aria-hidden
          >
            <Image
              src="/projects/create-success-icon.svg"
              alt=""
              width={40}
              height={40}
              className="size-10"
            />
          </div>

          <div className="flex w-full flex-col items-center gap-2 text-center">
            <DialogTitle
              className={cn(
                CREATE_PROJECT_TYPE.pageTitle,
                "font-recoleta text-[24px] leading-[1.05] font-normal",
              )}
              style={{ color: CREATE_PROJECT_COLORS.title }}
            >
              Borrador guardado
            </DialogTitle>

            <DialogDescription
              className="max-w-[382px] text-[16px] leading-[1.4]"
              style={{ color: CREATE_PROJECT_COLORS.title }}
            >
              Podrás continuar la configuración cuando quieras.
            </DialogDescription>
          </div>

          <Button
            type="button"
            variant="brand"
            size="brand"
            onClick={goToDashboard}
            className={cn(
              CREATE_PROJECT_TYPE.navButton,
              "h-auto w-full px-6 py-3 font-medium shadow-[0_0_10px_rgba(243,103,31,0.3)]",
            )}
          >
            Regresar al Dashboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
