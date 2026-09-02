"use client"

import { ProjectCardSkeleton } from "@/components/projects/ProjectCardSkeleton"
import { HomePageLayout } from "@/components/home/HomePageLayout"
import { Skeleton } from "@/components/ui/skeleton"
import { HOME_LAYOUT } from "@/lib/home/designTokens"

const SKELETON_CARD_COUNT = 3

export function HomePageSkeleton() {
  return (
    <HomePageLayout
      ariaBusy
      ariaLabel="Cargando proyectos"
      header={
        <>
          <Skeleton tone="dark" className="h-9 w-[min(100%,128px)] rounded-[10px] sm:w-[140px]" />
          <Skeleton tone="dark" className="size-10 shrink-0 rounded-full" />
        </>
      }
    >
      <div className={HOME_LAYOUT.greetingWrap}>
        <Skeleton tone="dark" className="h-9 w-[min(100%,280px)] rounded-[12px] sm:h-10 sm:w-[300px]" />
      </div>

      <div className={HOME_LAYOUT.projectGrid}>
        {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
          <ProjectCardSkeleton key={index} />
        ))}
      </div>
    </HomePageLayout>
  )
}
