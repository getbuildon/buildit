import { ChevronDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

const CONFIG_CARD_SHADOW = "0 0 10px rgba(243, 103, 31, 0.08)" as const

function ConfigSettingsCardSkeleton({ titleWidth }: { titleWidth: string }) {
  return (
    <section
      className="rounded-[16px] border border-[#edeef0] bg-white px-4 py-4 sm:px-6"
      style={{ boxShadow: CONFIG_CARD_SHADOW }}
      aria-busy="true"
      aria-hidden
    >
      <div className="flex w-full items-center gap-2">
        <Skeleton className={titleWidth} />
        <ChevronDown className="size-4 shrink-0 text-[#edeef0]" aria-hidden />
      </div>
    </section>
  )
}

export function ConfiguracionSectionsSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:gap-5" aria-label="Cargando configuración del proyecto">
      <ConfigSettingsCardSkeleton titleWidth="h-5 w-[min(100%,200px)] rounded-[8px]" />
      <ConfigSettingsCardSkeleton titleWidth="h-5 w-[min(100%,160px)] rounded-[8px]" />
      <ConfigSettingsCardSkeleton titleWidth="h-5 w-[min(100%,320px)] rounded-[8px]" />
    </div>
  )
}
