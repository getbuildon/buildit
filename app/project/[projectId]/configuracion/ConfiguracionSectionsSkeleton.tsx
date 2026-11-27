import { ChevronDown } from "lucide-react"
import { Icon, Skeleton } from "@/library/atoms"

/** Lugar de una sección plegable mientras cargan los datos de la obra. */
function ConfigSettingsCardSkeleton({ titleWidth }: { titleWidth: string }) {
  return (
    <section className="rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block">
      <div className="flex w-full items-center gap-compact">
        <div className="flex min-w-0 flex-1">
          <Skeleton shape="text" className={titleWidth} />
        </div>
        <Icon icon={ChevronDown} className="text-ink-subtle" />
      </div>
    </section>
  )
}

export function ConfiguracionSectionsSkeleton() {
  return (
    <div
      className="flex flex-col gap-group sm:gap-block"
      aria-busy="true"
      aria-label="Cargando configuración del proyecto"
    >
      <ConfigSettingsCardSkeleton titleWidth="h-5 w-[min(100%,200px)]" />
      <ConfigSettingsCardSkeleton titleWidth="h-5 w-[min(100%,160px)]" />
      <ConfigSettingsCardSkeleton titleWidth="h-5 w-[min(100%,320px)]" />
    </div>
  )
}
