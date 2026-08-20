"use client"

import type { ReactNode } from "react"
import { useMemo } from "react"
import { MI_UNIDAD_LAYOUT } from "@/lib/project/designTokens"
import type { MiUnidadPageData } from "@/lib/projects/miUnidadTypes"
import { cn } from "@/lib/utils"
import { ConstructionMilestonesTimeline } from "./ConstructionMilestonesTimeline"
import { MiUnidadUnitSelector } from "./MiUnidadUnitSelector"
import { MiUnidadWeatherWidget } from "./MiUnidadWeatherWidget"
import { PortalNewsCarousel } from "./PortalNewsCarousel"

type MiUnidadViewProps = {
  projectId: string
  data: MiUnidadPageData
  greetingName: string
  topSlot?: ReactNode
  className?: string
}

function formatProjectEndDateLabel(date: string | null): string | null {
  if (!date) return null
  const parsed = new Date(`${date}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return null

  const month = parsed.toLocaleDateString("es-AR", { month: "long" })
  const year = parsed.getFullYear()
  const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1)
  return `${capitalizedMonth} ${year}`
}

export function MiUnidadView({
  data,
  greetingName,
  topSlot,
  className,
}: MiUnidadViewProps) {
  const projectEndDateLabel = useMemo(
    () => formatProjectEndDateLabel(data.projectEndDate),
    [data.projectEndDate],
  )

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col gap-8 pb-10",
        topSlot ? "pt-6" : "-mt-4 pt-[80px] lg:-mt-6",
        className,
      )}
      style={{ maxWidth: MI_UNIDAD_LAYOUT.contentMaxWidth }}
    >
      {topSlot}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="font-recoleta text-[32px] leading-[1.05] text-[#1d293d] sm:text-[36px]">
            Hola {greetingName} 👋
          </h1>
          <p className="pt-1 text-[16px] leading-[1.4] text-[#272a2d]">
            Seguí el avance de obra en tiempo real.
          </p>
        </div>
        <MiUnidadWeatherWidget weather={data.weather} className="sm:ml-6" />
      </header>

      <MiUnidadUnitSelector
        units={data.units}
        projectName={data.projectName}
        projectEndDateLabel={projectEndDateLabel}
      />

      <section className="flex flex-col gap-3">
        <h2 className="font-recoleta text-[24px] leading-[1.05] text-[#272a2d]">
          Últimas novedades
        </h2>
        <PortalNewsCarousel items={data.news} />
      </section>

      <section className="rounded-[16px] border border-[#edeef0] bg-white p-[25px] shadow-[0_0_5px_rgba(243,103,31,0.08)]">
        <h2 className="font-recoleta text-[24px] leading-[1.05] text-[#1d293d]">
          Hitos de Construcción
        </h2>
        <div className="pt-4">
          <ConstructionMilestonesTimeline milestones={data.milestones} />
        </div>
      </section>
    </div>
  )
}
