"use client"

import Image from "next/image"
import { useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  CREATE_PROJECT_COLORS,
  CREATE_PROJECT_TYPE,
} from "@/lib/projects/createProjectTokens"
import { cn } from "@/lib/utils"

type CreateProjectSuccessPanelProps = {
  projectId: string
  projectName: string
}

export function CreateProjectSuccessPanel({
  projectId,
  projectName,
}: CreateProjectSuccessPanelProps) {
  const router = useRouter()

  const goToProject = useCallback(() => {
    router.push(`/${projectId}`)
    router.refresh()
  }, [router, projectId])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-labelledby="create-project-success-title"
      aria-modal="true"
    >
      <div
        className={cn(
          "w-full max-w-[448px] rounded-[16px] border bg-white px-[33px] py-[41px]",
          "shadow-[0_0_5px_rgba(243,103,31,0.08)]",
        )}
        style={{ borderColor: "#e2e8f0" }}
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
            <h2
              id="create-project-success-title"
              className={cn(
                CREATE_PROJECT_TYPE.pageTitle,
                "font-recoleta text-[24px] leading-[1.05]",
              )}
              style={{ color: CREATE_PROJECT_COLORS.title }}
            >
              ¡Proyecto creado con éxito!
            </h2>

            <p
              className="text-[16px] leading-[1.4]"
              style={{ color: CREATE_PROJECT_COLORS.title }}
            >
              El proyecto{" "}
              <span className="font-medium">{projectName}</span> fue creado
              exitosamente y está listo para comenzar.
            </p>
          </div>

          <Button
            type="button"
            variant="brand"
            size="brand"
            onClick={goToProject}
            className={cn(
              CREATE_PROJECT_TYPE.navButton,
              "h-auto w-full px-6 py-3 font-medium shadow-[0_0_10px_rgba(243,103,31,0.3)]",
            )}
          >
            Ingresar al dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
