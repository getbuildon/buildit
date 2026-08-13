"use client"

import { Spinner } from "@/components/ui/spinner"
import { CREATE_PROJECT_COLORS } from "@/lib/projects/createProjectTokens"
import { cn } from "@/lib/utils"

type CreateProjectLoadingScreenProps = {
  className?: string
}

export function CreateProjectLoadingScreen({
  className,
}: CreateProjectLoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center px-6",
        className,
      )}
      style={{ backgroundColor: CREATE_PROJECT_COLORS.pageBg }}
      aria-live="polite"
      aria-busy="true"
      aria-label="Cargando obra"
    >
      <Spinner className="size-8 text-[#ff7433]" />
    </div>
  )
}
